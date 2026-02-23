/**
 * build_carousel.js
 *
 * One-command pipeline:
 * 1) generate charts
 * 2) generate images (prompt pack and optional asset generation)
 * 3) render
 * 4) validate
 * 5) overseer checks
 * 6) initialize performance tracking scaffold
 *
 * Outputs a build manifest:
 * - logs/<slug>_build_manifest.json
 */

import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const LOGS_DIR = join(ROOT_DIR, 'logs');

function resolveSpecPath(inputPath) {
  return inputPath.startsWith('/') || /^[A-Za-z]:/.test(inputPath)
    ? inputPath
    : join(process.cwd(), inputPath);
}

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function runNodeStep(step, scriptPath, args = []) {
  const startedAt = new Date().toISOString();
  console.log(`\n[${step}] node ${scriptPath} ${args.join(' ')}`.trim());

  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });

  const endedAt = new Date().toISOString();
  return {
    step,
    script: scriptPath,
    args,
    startedAt,
    endedAt,
    exitCode: result.status ?? 1,
    success: (result.status ?? 1) === 0,
  };
}

function ensureLogsDir() {
  if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true });
}

function run(contentSpecPath, options) {
  const specPath = resolveSpecPath(contentSpecPath);
  if (!existsSync(specPath)) {
    throw new Error(`Content spec not found: ${specPath}`);
  }

  const contentSpec = loadJson(specPath);
  const slug = contentSpec.slug;
  ensureLogsDir();

  const steps = [];
  const startedAt = new Date().toISOString();
  const skipOverseerByPlanner = contentSpec?.planner?.runOverseerChecks === false;
  const effectiveSkipOverseer = options.skipOverseer || skipOverseerByPlanner;

  if (!options.skipCharts) {
    steps.push(runNodeStep('generate_charts', 'scripts/generate_chart_assets.js', [specPath]));
    if (!steps[steps.length - 1].success) return finalize(false);
  }

  if (!options.skipImages) {
    steps.push(runNodeStep('generate_images', 'scripts/generate_imagen_assets.js', [specPath]));
    if (!steps[steps.length - 1].success) return finalize(false);
  }

  steps.push(runNodeStep('render', 'scripts/render_html_to_pdf.js', [specPath]));
  if (!steps[steps.length - 1].success) return finalize(false);

  steps.push(runNodeStep('validate', 'scripts/validate_pdf.js', [specPath]));
  if (!steps[steps.length - 1].success) return finalize(false);

  if (!effectiveSkipOverseer) {
    steps.push(runNodeStep('overseer', 'scripts/run_overseer_checks.js', [specPath]));
    if (!steps[steps.length - 1].success) return finalize(false);
  }

  if (!options.skipPerformanceLog) {
    steps.push(runNodeStep('init_performance_log', 'scripts/init_performance_log.js', [specPath]));
    if (!steps[steps.length - 1].success) return finalize(false);
  }

  return finalize(true);

  function finalize(success) {
    const endedAt = new Date().toISOString();
    const manifest = {
      slug,
      title: contentSpec.title,
      contentSpecPath: specPath,
      startedAt,
      endedAt,
      success,
      environment: {
        nodeVersion: process.version,
        hasImageApiKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      },
      options,
      resolvedBehavior: {
        skipOverseerByPlanner,
        effectiveSkipOverseer,
      },
      steps,
      artifacts: {
        pdf: join(ROOT_DIR, 'output', 'pdf', `${slug}.pdf`),
        slideImagesDir: join(ROOT_DIR, 'output', 'images', slug),
        validation: join(ROOT_DIR, 'logs', `${slug}_validation.json`),
        renderIntelligence: join(ROOT_DIR, 'logs', `${slug}_render_intelligence.json`),
        copyOverseer: join(ROOT_DIR, 'logs', `${slug}_copy_overseer.json`),
        designOverseer: join(ROOT_DIR, 'logs', `${slug}_design_overseer.json`),
        performanceLog: join(ROOT_DIR, 'logs', 'performance', `${slug}.json`),
      },
    };

    const manifestPath = join(LOGS_DIR, `${slug}_build_manifest.json`);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('\nBuild Manifest');
    console.log('==============');
    console.log(`Success: ${success}`);
    console.log(`Manifest: ${manifestPath}`);

    process.exit(success ? 0 : 1);
  }
}

function parseOptions(args) {
  return {
    skipCharts: args.includes('--skip-charts'),
    skipImages: args.includes('--skip-images'),
    skipOverseer: args.includes('--skip-overseer'),
    skipPerformanceLog: args.includes('--skip-performance-log'),
  };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/build_carousel.js <content-spec.json> [--skip-charts] [--skip-images] [--skip-overseer] [--skip-performance-log]');
  process.exit(1);
}

const contentSpecPath = args.find(arg => !arg.startsWith('--'));
if (!contentSpecPath) {
  console.error('Error: content spec path is required.');
  process.exit(1);
}

try {
  run(contentSpecPath, parseOptions(args));
} catch (err) {
  console.error(`Build failed: ${err.message}`);
  process.exit(1);
}
