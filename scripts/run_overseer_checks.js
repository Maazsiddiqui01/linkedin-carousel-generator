/**
 * run_overseer_checks.js
 *
 * Deterministic post-render quality gates for:
 * - Copy Overseer
 * - Design Overseer
 *
 * Outputs:
 * - logs/<slug>_copy_overseer.json
 * - logs/<slug>_design_overseer.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const LOGS_DIR = join(ROOT_DIR, 'logs');

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

function normalizeText(text = '') {
  return toPlainText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jaccardSimilarity(a = '', b = '') {
  const aTokens = new Set(normalizeText(a).split(' ').filter(Boolean));
  const bTokens = new Set(normalizeText(b).split(' ').filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }
  const union = new Set([...aTokens, ...bTokens]).size;
  return union ? intersection / union : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resolveSpecPath(inputPath) {
  return inputPath.startsWith('/') || /^[A-Za-z]:/.test(inputPath)
    ? inputPath
    : join(process.cwd(), inputPath);
}

function addIssue(bucket, item) {
  bucket.push(item);
}

function scoreBySignals(base, issues, warnings) {
  return clamp(Number((base - issues * 0.85 - warnings * 0.18).toFixed(2)), 1, 5);
}

function buildCopyReport(contentSpec, validationReport) {
  const issues = [];
  const warnings = [];

  const slides = Array.isArray(contentSpec.slides) ? contentSpec.slides : [];
  const bodySlides = slides.filter(s => s.type === 'body');

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideNum = i + 1;

    const segments = [];
    const headline = toPlainText(slide.headline || '');
    const intro = toPlainText(slide.introText || '');
    const bullets = Array.isArray(slide.bullets) ? slide.bullets.map(b => toPlainText(b)) : [];
    const panelCards = Array.isArray(slide?.visual?.cards)
      ? slide.visual.cards.flatMap(card => [toPlainText(card.title || ''), toPlainText(card.detail || '')]).filter(Boolean)
      : [];

    if (headline) segments.push({ slot: 'headline', text: headline });
    if (intro) segments.push({ slot: 'intro', text: intro });
    bullets.forEach((b, idx) => segments.push({ slot: `bullet_${idx + 1}`, text: b }));
    panelCards.forEach((c, idx) => segments.push({ slot: `panel_${idx + 1}`, text: c }));

    for (let a = 0; a < segments.length; a++) {
      for (let b = a + 1; b < segments.length; b++) {
        const first = segments[a];
        const second = segments[b];
        const firstNorm = normalizeText(first.text);
        const secondNorm = normalizeText(second.text);
        if (!firstNorm || !secondNorm) continue;

        const similarity = jaccardSimilarity(first.text, second.text);
        const contains = firstNorm.includes(secondNorm) || secondNorm.includes(firstNorm);

        if ((similarity >= 0.86 || (contains && Math.min(firstNorm.length, secondNorm.length) >= 24))) {
          addIssue(issues, {
            slide: slideNum,
            type: 'duplication',
            message: `Possible duplicate messaging between ${first.slot} and ${second.slot}`,
            fix: 'Differentiate headline, intro, bullets, and panel so each adds net-new value.',
          });
        }
      }
    }

    if (slide.type === 'body' && bullets.length > 3) {
      warnings.push({
        slide: slideNum,
        type: 'concision',
        message: `Body slide has ${bullets.length} bullets; 3 is preferred for premium clarity.`,
      });
    }

    if (bullets.some(line => line.length > 42)) {
      warnings.push({
        slide: slideNum,
        type: 'concision',
        message: 'One or more bullets are long; shorten for faster scanability.',
      });
    }
  }

  for (let i = 1; i < slides.length; i++) {
    const prev = toPlainText(slides[i - 1]?.headline || '');
    const curr = toPlainText(slides[i]?.headline || '');
    if (!prev || !curr) continue;
    const sim = jaccardSimilarity(prev, curr);
    if (sim >= 0.82) {
      addIssue(issues, {
        slide: i + 1,
        type: 'flow',
        message: 'Adjacent slide headlines are too similar.',
        fix: 'Rewrite one headline so each slide has a distinct role in the narrative.',
      });
    }
  }

  const lastSlide = slides[slides.length - 1] || {};
  if (lastSlide.type !== 'cta' || !toPlainText(lastSlide.ctaText || '')) {
    addIssue(issues, {
      slide: slides.length || 0,
      type: 'cta',
      message: 'Deck is missing a clear CTA on the closing slide.',
      fix: 'Use a direct CTA with a concrete action (comment keyword, follow-up, or download ask).',
    });
  }

  if (validationReport && Array.isArray(validationReport.constraintIssues) && validationReport.constraintIssues.length > 0) {
    addIssue(issues, {
      slide: 0,
      type: 'quality_gate',
      message: 'Validation report contains blocking issues.',
      fix: 'Resolve validation failures before delivery.',
    });
  }

  const categoryCounts = {
    clarity: issues.filter(x => x.type === 'duplication').length,
    concision: issues.filter(x => x.type === 'concision').length + warnings.filter(x => x.type === 'concision').length,
    non_duplication: issues.filter(x => x.type === 'duplication').length,
    narrative_flow: issues.filter(x => x.type === 'flow').length,
    cta_strength: issues.filter(x => x.type === 'cta').length,
  };

  const scores = {
    clarity: scoreBySignals(5, categoryCounts.clarity, warnings.length),
    concision: scoreBySignals(5, categoryCounts.concision, warnings.length),
    non_duplication: scoreBySignals(5, categoryCounts.non_duplication, warnings.length),
    narrative_flow: scoreBySignals(5, categoryCounts.narrative_flow, warnings.length),
    cta_strength: scoreBySignals(5, categoryCounts.cta_strength, warnings.length),
  };

  const requiredFixes = Array.from(new Set(issues.map(x => x.fix).filter(Boolean)));
  const avgBulletCount = bodySlides.length
    ? Number((bodySlides.reduce((sum, s) => sum + (Array.isArray(s.bullets) ? s.bullets.length : 0), 0) / bodySlides.length).toFixed(2))
    : 0;

  return {
    slug: contentSpec.slug,
    generatedAt: new Date().toISOString(),
    status: issues.length === 0 ? 'pass' : 'fail',
    scores,
    issues,
    warnings,
    requiredFixes,
    notes: {
      avgBodyBulletCount: avgBulletCount,
      narrativeFlow: issues.some(x => x.type === 'flow') ? 'needs_rework' : 'coherent',
      claimIntegrity: 'Use logs/research notes for externally-anchored claims.',
    },
  };
}

function buildDesignReport(contentSpec, validationReport, intelligenceReport) {
  const issues = [];
  const warnings = [];
  const slides = Array.isArray(intelligenceReport?.slides) ? intelligenceReport.slides : [];
  const bodySlides = slides.filter(s => s.slideType === 'body');

  if (!intelligenceReport || !slides.length) {
    addIssue(issues, {
      slide: 0,
      type: 'render_intelligence_missing',
      message: 'Render intelligence log is missing or empty.',
      fix: 'Run render step to produce logs/<slug>_render_intelligence.json before overseer checks.',
    });
  }

  const visualCoverageTarget = Number(contentSpec?.planner?.visualCoverageTarget);
  const targetCoverage = Number.isFinite(visualCoverageTarget)
    ? clamp(visualCoverageTarget, 0.3, 0.9)
    : 0.3;

  if (bodySlides.length > 0) {
    const visiblePanels = bodySlides.filter(s => s?.visual?.show).length;
    const coverage = visiblePanels / bodySlides.length;

    if (coverage < targetCoverage) {
      addIssue(issues, {
        slide: 0,
        type: 'visual_coverage',
        message: `Visual coverage is ${(coverage * 100).toFixed(1)}% (target ${(targetCoverage * 100).toFixed(0)}%).`,
        fix: 'Add relevant KPI/cards/chart/image panels to body slides with low visual density.',
      });
    }

    let consecutiveNone = 0;
    for (const entry of bodySlides) {
      const mode = normalizeText(entry?.visual?.mode || 'none');
      if (mode === 'none') {
        consecutiveNone += 1;
        if (consecutiveNone > 1) {
          addIssue(issues, {
            slide: Number(entry.slideNumber),
            type: 'density',
            message: 'More than one consecutive body slide has no side visual.',
            fix: 'Add a relevant panel or tighten layout so consecutive low-density slides are avoided.',
          });
        }
      } else {
        consecutiveNone = 0;
      }
    }

    const workflowChips = bodySlides
      .filter(entry => entry?.chip?.show && /^Workflow\s+\d+$/i.test(String(entry.chip.label || '').trim()))
      .map(entry => ({
        slide: Number(entry.slideNumber),
        number: Number(String(entry.chip.label).replace(/[^0-9]/g, '')),
        intent: entry?.intent?.intent || '',
      }));

    let expectedWorkflowNumber = 1;
    for (const chip of workflowChips) {
      if (chip.intent !== 'workflow') {
        addIssue(issues, {
          slide: chip.slide,
          type: 'chip_semantics',
          message: 'Workflow chip used on non-workflow intent.',
          fix: 'Use contextual chip labels based on intent, or hide chip.',
        });
      }
      if (chip.number !== expectedWorkflowNumber) {
        addIssue(issues, {
          slide: chip.slide,
          type: 'workflow_sequence',
          message: `Workflow chip numbering is out of sequence (expected ${expectedWorkflowNumber}, got ${chip.number}).`,
          fix: 'Ensure workflow chips increment sequentially without duplicates/skips.',
        });
        expectedWorkflowNumber = chip.number + 1;
      } else {
        expectedWorkflowNumber += 1;
      }
    }

    for (const entry of bodySlides) {
      const chip = entry?.chip;
      const visual = entry?.visual;
      const slideNum = Number(entry.slideNumber);

      if (chip?.show && Number(chip.confidence || 0) < 0.65) {
        addIssue(issues, {
          slide: slideNum,
          type: 'chip_confidence',
          message: 'Visible chip has low relevance confidence.',
          fix: 'Hide chip or provide explicit intent/chip mapping.',
        });
      }

      if (visual?.show && Number(visual.confidence || 0) < 0.65) {
        addIssue(issues, {
          slide: slideNum,
          type: 'visual_confidence',
          message: 'Visible panel has low confidence.',
          fix: 'Switch visual mode or provide explicit visual data.',
        });
      }

      const visualRejections = Array.isArray(visual?.rejections) ? visual.rejections : [];
      if (visualRejections.some(rej => rej.reason === 'duplicates_primary_bullets')) {
        addIssue(issues, {
          slide: slideNum,
          type: 'visual_duplication',
          message: 'Panel candidate duplicated bullet narrative.',
          fix: 'Replace panel content with conceptual/KPI/chart signal that adds net-new value.',
        });
      }
      if (visualRejections.some(rej => rej.reason === 'low_context_relevance')) {
        warnings.push({
          slide: slideNum,
          type: 'visual_relevance',
          message: 'A panel candidate was rejected for low context relevance.',
        });
      }
    }
  }

  if (validationReport && validationReport.passed === false) {
    addIssue(issues, {
      slide: 0,
      type: 'quality_gate',
      message: 'Validation report failed.',
      fix: 'Resolve validation report issues before delivery.',
    });
  }

  const designScores = {
    hierarchy_clarity: scoreBySignals(5, issues.filter(x => x.type === 'chip_confidence').length, warnings.length),
    alignment_rhythm: scoreBySignals(5, issues.filter(x => x.type === 'density').length + issues.filter(x => x.type === 'workflow_sequence').length, warnings.length),
    visual_relevance: scoreBySignals(5, issues.filter(x => x.type === 'visual_confidence').length + issues.filter(x => x.type === 'visual_duplication').length, warnings.length),
    density_balance: scoreBySignals(5, issues.filter(x => x.type === 'visual_coverage').length + issues.filter(x => x.type === 'density').length, warnings.length),
    aesthetic_polish: scoreBySignals(5, issues.length, warnings.length),
  };

  const requiredFixes = Array.from(new Set(issues.map(x => x.fix).filter(Boolean)));
  const coverage = bodySlides.length
    ? Number((bodySlides.filter(s => s?.visual?.show).length / bodySlides.length).toFixed(3))
    : 0;

  return {
    slug: contentSpec.slug,
    generatedAt: new Date().toISOString(),
    status: issues.length === 0 ? 'pass' : 'fail',
    scores: designScores,
    issues,
    warnings,
    requiredFixes,
    notes: {
      visualCoverage: coverage,
      targetCoverage,
      bodySlideCount: bodySlides.length,
    },
  };
}

function printSummary(copyReport, designReport, outputPaths) {
  console.log('\nOverseer Check Summary');
  console.log('======================');
  console.log(`Copy Overseer:   ${copyReport.status.toUpperCase()} (issues: ${copyReport.issues.length}, warnings: ${copyReport.warnings.length})`);
  console.log(`Design Overseer: ${designReport.status.toUpperCase()} (issues: ${designReport.issues.length}, warnings: ${designReport.warnings.length})`);
  console.log(`Copy report:     ${outputPaths.copy}`);
  console.log(`Design report:   ${outputPaths.design}`);
}

function run(contentSpecPath) {
  const resolvedSpecPath = resolveSpecPath(contentSpecPath);
  if (!existsSync(resolvedSpecPath)) {
    throw new Error(`Content spec not found: ${resolvedSpecPath}`);
  }
  if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true });

  const contentSpec = loadJson(resolvedSpecPath);
  const validationPath = join(LOGS_DIR, `${contentSpec.slug}_validation.json`);
  const intelligencePath = join(LOGS_DIR, `${contentSpec.slug}_render_intelligence.json`);

  const validationReport = existsSync(validationPath) ? loadJson(validationPath) : null;
  const intelligenceReport = existsSync(intelligencePath) ? loadJson(intelligencePath) : null;

  const copyReport = buildCopyReport(contentSpec, validationReport);
  const designReport = buildDesignReport(contentSpec, validationReport, intelligenceReport);

  const copyOut = join(LOGS_DIR, `${contentSpec.slug}_copy_overseer.json`);
  const designOut = join(LOGS_DIR, `${contentSpec.slug}_design_overseer.json`);
  writeFileSync(copyOut, JSON.stringify(copyReport, null, 2));
  writeFileSync(designOut, JSON.stringify(designReport, null, 2));

  printSummary(copyReport, designReport, { copy: copyOut, design: designOut });

  const passed = copyReport.status === 'pass' && designReport.status === 'pass';
  process.exit(passed ? 0 : 1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/run_overseer_checks.js <content-spec.json>');
  process.exit(1);
}

try {
  run(args[0]);
} catch (err) {
  console.error(`Overseer checks failed: ${err.message}`);
  process.exit(1);
}
