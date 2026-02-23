/**
 * generate_chart_assets.js
 *
 * Generates chart images for slides that define `visual.chart`.
 * Output:
 * - output/generated_charts/<slug>/slide_XX.png
 * - output/generated_charts/<slug>/manifest.json
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const OUTPUT_DIR = join(ROOT_DIR, 'output', 'generated_charts');
const CHART_JS_PATH = join(ROOT_DIR, 'node_modules', 'chart.js', 'dist', 'chart.umd.js');

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function toPlainText(text = '') {
  return String(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .trim();
}

function resolveSpecPath(inputPath) {
  return inputPath.startsWith('/') || /^[A-Za-z]:/.test(inputPath)
    ? inputPath
    : join(process.cwd(), inputPath);
}

function chartConfigForSlide(contentSpec, slide) {
  const chart = slide?.visual?.chart;
  if (!chart) return null;

  const labels = (chart.series || []).map(item => toPlainText(item.label || ''));
  const values = (chart.series || []).map(item => Number(item.value));
  if (!labels.length || labels.length !== values.length || labels.some(x => !x) || values.some(v => Number.isNaN(v))) {
    return null;
  }

  const accent = contentSpec.colorOverride?.primary || '#0A6C8F';
  const accentSoft = 'rgba(10, 108, 143, 0.16)';
  const gridColor = 'rgba(71, 85, 105, 0.18)';
  const textColor = '#1A1A2E';

  return {
    type: chart.type || 'bar',
    data: {
      labels,
      datasets: [
        {
          label: toPlainText(chart.title || 'Series'),
          data: values,
          borderColor: accent,
          backgroundColor: chart.type === 'line' ? 'rgba(10, 108, 143, 0.22)' : accentSoft,
          borderWidth: 2,
          fill: chart.type === 'line',
          tension: 0.28,
          pointBackgroundColor: accent,
          pointRadius: chart.type === 'line' ? 3 : 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: !!chart.title,
          text: toPlainText(chart.title || ''),
          color: textColor,
          font: { size: 16, weight: '700' },
        },
      },
      scales: chart.type === 'doughnut' ? {} : {
        x: {
          ticks: { color: textColor, font: { size: 11 } },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: textColor, font: { size: 11 } },
          grid: { color: gridColor },
          beginAtZero: true,
        },
      },
    },
  };
}

async function renderChartPng(page, chartJsCode, chartConfig, outputPath) {
  const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 640px;
      height: 460px;
      background: #ffffff;
      font-family: Manrope, Segoe UI, sans-serif;
    }
    .wrap {
      width: 640px;
      height: 460px;
      box-sizing: border-box;
      padding: 14px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
      border: 1px solid rgba(79, 107, 255, 0.12);
      border-radius: 12px;
      background: #ffffff;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <canvas id="chart"></canvas>
  </div>
  <script>${chartJsCode}</script>
  <script>
    const config = ${JSON.stringify(chartConfig)};
    const ctx = document.getElementById('chart');
    new Chart(ctx, config);
  </script>
</body>
</html>`;

  await page.setViewportSize({ width: 640, height: 460 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(220);
  await page.screenshot({ path: outputPath, type: 'png' });
}

async function run(contentSpecPath) {
  const fullPath = resolveSpecPath(contentSpecPath);
  if (!existsSync(fullPath)) {
    throw new Error(`Content spec not found: ${fullPath}`);
  }
  if (!existsSync(CHART_JS_PATH)) {
    throw new Error('chart.js is not installed. Run: npm install chart.js');
  }

  const chartJsCode = readFileSync(CHART_JS_PATH, 'utf-8');
  const contentSpec = loadJson(fullPath);

  const slugDir = join(OUTPUT_DIR, contentSpec.slug);
  if (!existsSync(slugDir)) mkdirSync(slugDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const manifest = {
    slug: contentSpec.slug,
    generatedAt: new Date().toISOString(),
    charts: [],
  };

  for (let i = 0; i < contentSpec.slides.length; i++) {
    const slide = contentSpec.slides[i];
    const chartSpec = slide?.visual?.chart;
    if (!chartSpec) continue;

    const config = chartConfigForSlide(contentSpec, slide);
    const targetPath = join(slugDir, `slide_${String(i + 1).padStart(2, '0')}.png`);

    if (!config) {
      manifest.charts.push({
        slideNumber: i + 1,
        status: 'skipped',
        reason: 'invalid_chart_series',
      });
      continue;
    }

    try {
      await renderChartPng(page, chartJsCode, config, targetPath);
      manifest.charts.push({
        slideNumber: i + 1,
        status: 'generated',
        path: targetPath,
      });
      console.log(`Generated chart: ${targetPath}`);
    } catch (err) {
      manifest.charts.push({
        slideNumber: i + 1,
        status: 'failed',
        reason: err.message,
      });
      console.warn(`Failed chart for slide ${i + 1}: ${err.message}`);
    }
  }

  await browser.close();

  const manifestPath = join(slugDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Chart manifest: ${manifestPath}`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/generate_chart_assets.js <content-spec.json>');
  process.exit(1);
}

run(args[0]).catch(err => {
  console.error(err.message);
  process.exit(1);
});
