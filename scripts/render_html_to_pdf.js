/**
 * render_html_to_pdf.js
 *
 * Renders carousel slides from a content spec JSON to PDF.
 * Uses Playwright for headless browser rendering and pdf-lib for PDF merging.
 */

import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import Handlebars from 'handlebars';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Configuration paths
const BRAND_RULES_PATH = join(ROOT_DIR, 'brand', 'brand_rules.json');
const TEMPLATE_PATH = join(ROOT_DIR, 'templates', 'html', 'slide.html');
const STYLES_PATH = join(ROOT_DIR, 'templates', 'html', 'styles.css');
const OUTPUT_PDF_DIR = join(ROOT_DIR, 'output', 'pdf');
const OUTPUT_IMAGES_DIR = join(ROOT_DIR, 'output', 'images');
const OUTPUT_GENERATED_IMAGES_DIR = join(ROOT_DIR, 'output', 'generated_images');
const OUTPUT_GENERATED_CHARTS_DIR = join(ROOT_DIR, 'output', 'generated_charts');
const LOGS_DIR = join(ROOT_DIR, 'logs');

const INTENT_LABELS = {
  workflow: 'Workflow',
  result: 'Result',
  milestone: 'Milestone',
  proof: 'Proof',
  context: 'Context',
  framework: 'Framework',
  transition: 'Next Move',
  story: 'Story',
};

const INTENT_DEFAULT_STYLE = {
  workflow: 'info',
  result: 'success',
  milestone: 'success',
  proof: 'proof',
  context: 'neutral',
  framework: 'info',
  transition: 'success',
  story: 'neutral',
  custom: 'neutral',
};

const STYLE_ICONS = {
  info: '\u25CF',
  success: '\u25B2',
  proof: '\u2713',
  neutral: '\u25CB',
};

const CONTROLLED_LABELS = new Map([
  ['workflow', 'Workflow'],
  ['result', 'Result'],
  ['milestone', 'Milestone'],
  ['proof', 'Proof'],
  ['context', 'Context'],
  ['framework', 'Framework'],
  ['next move', 'Next Move'],
  ['story', 'Story'],
]);

/**
 * Load and parse JSON file
 */
function loadJson(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Convert image file to base64 data URL
 */
function imageToDataUrl(imagePath) {
  if (!existsSync(imagePath)) return null;
  const imageBuffer = readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = imagePath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
  return `data:image/${ext};base64,${base64}`;
}

/**
 * Convert headline text to HTML with highlight spans
 * Syntax: **word** for blue highlight, __word__ for coral highlight, ~~word~~ for coral text
 */
function formatHeadlineHtml(headline) {
  if (!headline) return '';
  return headline
    .replace(/\*\*([^*]+)\*\*/g, '<span class="highlight-box">$1</span>')
    .replace(/__([^_]+)__/g, '<span class="highlight-blue">$1</span>')
    .replace(/~~([^~]+)~~/g, '<span class="highlight-coral">$1</span>');
}

/**
 * Format bullet text with bold support
 */
function formatBulletHtml(bullet) {
  if (!bullet) return '';
  return bullet.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Remove markdown markers for plain-text processing
 */
function toPlainText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .trim();
}

/**
 * Split a bullet into optional icon + formatted HTML content
 */
function splitBulletContent(bullet) {
  if (!bullet) return null;
  const trimmed = bullet.trim();
  const iconMatch = trimmed.match(/^([\u{1F300}-\u{1FAFF}\u2600-\u27BF]+)\s+/u);
  const icon = iconMatch ? iconMatch[1] : '*';
  const text = iconMatch ? trimmed.slice(iconMatch[0].length).trim() : trimmed;
  return {
    icon,
    textPlain: toPlainText(text),
    textHtml: formatBulletHtml(text),
  };
}

/**
 * Auto-emphasize part of body/framing headlines if author did not add markers.
 */
function applyAutomaticHeadlineAccent(headline, slideType, enabled = true) {
  if (!enabled || !headline) return headline || '';
  if (slideType !== 'body' && slideType !== 'framing') return headline;
  if (/[*_~]{2}/.test(headline)) return headline;

  const withColon = headline.match(/^([^:]{2,}:\s*)(.+)$/);
  if (withColon) {
    const prefix = withColon[1];
    const suffix = withColon[2].trim();
    const words = suffix.split(/\s+/);
    if (words.length >= 2) {
      const accent = `__${words.slice(0, 2).join(' ')}__`;
      const rest = words.slice(2).join(' ');
      return `${prefix}${accent}${rest ? ` ${rest}` : ''}`;
    }
  }

  const words = headline.trim().split(/\s+/);
  if (words.length < 4) return headline;
  const mid = Math.floor(words.length / 2) - 1;
  const start = Math.max(1, mid);
  const end = Math.min(words.length, start + 2);
  const accent = `__${words.slice(start, end).join(' ')}__`;
  return `${words.slice(0, start).join(' ')} ${accent} ${words.slice(end).join(' ')}`.replace(/\s+/g, ' ').trim();
}

function resolveExistingImage(candidates) {
  for (const imagePath of candidates) {
    if (!imagePath || typeof imagePath !== 'string') continue;
    if (!existsSync(imagePath)) continue;
    return {
      path: imagePath,
      dataUrl: imageToDataUrl(imagePath),
    };
  }
  return null;
}

function buildPathCandidates(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return [];
  return [
    rawPath,
    join(ROOT_DIR, rawPath),
    join(ROOT_DIR, 'brand', rawPath),
    join(ROOT_DIR, 'brand', 'assets', rawPath),
  ];
}

/**
 * Resolve regular image visual path for body/framing slides.
 * Priority:
 * 1) explicit slide.visual.imagePath / legacy slide.visualImage
 * 2) generated image in output/generated_images/<slug>/slide_XX.png
 */
function resolveSlideImageVisual(slide, index, contentSpec) {
  const explicitPath = slide?.visual?.imagePath;
  const legacyPath = slide?.visualImage;

  const explicitFound = resolveExistingImage(buildPathCandidates(explicitPath));
  if (explicitFound) {
    return {
      dataUrl: explicitFound.dataUrl,
      source: 'explicit_image',
      resolvedPath: explicitFound.path,
    };
  }

  const legacyFound = resolveExistingImage(buildPathCandidates(legacyPath));
  if (legacyFound) {
    return {
      dataUrl: legacyFound.dataUrl,
      source: 'legacy_visualImage',
      resolvedPath: legacyFound.path,
    };
  }

  const generatedPath = join(
    OUTPUT_GENERATED_IMAGES_DIR,
    contentSpec.slug,
    `slide_${String(index + 1).padStart(2, '0')}.png`,
  );
  const generated = resolveExistingImage([generatedPath]);
  if (generated) {
    return {
      dataUrl: generated.dataUrl,
      source: 'generated_image',
      resolvedPath: generated.path,
    };
  }

  return null;
}

/**
 * Resolve chart visual path from explicit chart image path or generated chart directory.
 */
function resolveChartVisual(slide, index, contentSpec) {
  const explicitChartImagePath = slide?.visual?.chart?.imagePath;
  const explicitChartFound = resolveExistingImage(buildPathCandidates(explicitChartImagePath));
  if (explicitChartFound) {
    return {
      dataUrl: explicitChartFound.dataUrl,
      source: 'explicit_chart_image',
      resolvedPath: explicitChartFound.path,
    };
  }

  const generatedChartPath = join(
    OUTPUT_GENERATED_CHARTS_DIR,
    contentSpec.slug,
    `slide_${String(index + 1).padStart(2, '0')}.png`,
  );
  const generatedChart = resolveExistingImage([generatedChartPath]);
  if (generatedChart) {
    return {
      dataUrl: generatedChart.dataUrl,
      source: 'generated_chart',
      resolvedPath: generatedChart.path,
    };
  }

  return null;
}

/**
 * Normalize text for similarity checks
 */
function normalizeForCompare(text) {
  return toPlainText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(text) {
  return normalizeForCompare(text);
}

/**
 * Jaccard token similarity (0-1)
 */
function jaccardSimilarity(a, b) {
  const aTokens = new Set(normalizeForCompare(a).split(' ').filter(Boolean));
  const bTokens = new Set(normalizeForCompare(b).split(' ').filter(Boolean));

  if (!aTokens.size || !bTokens.size) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  const union = new Set([...aTokens, ...bTokens]).size;
  return union ? intersection / union : 0;
}

/**
 * True when candidate text is too similar to bullet narrative
 */
function isDuplicateLikeBullet(candidateText, bulletItems = []) {
  const candidate = normalizeForCompare(candidateText);
  if (!candidate) return false;

  return bulletItems.some(item => {
    const bullet = normalizeForCompare(item.textPlain);
    if (!bullet) return false;
    if (bullet.includes(candidate) || candidate.includes(bullet)) return true;
    return jaccardSimilarity(candidate, bullet) >= 0.72;
  });
}

/**
 * Build KPI stats by extracting numeric anchors
 */
function sanitizeStats(inputStats = []) {
  if (!Array.isArray(inputStats)) return [];
  const deduped = [];
  for (const raw of inputStats) {
    const value = toPlainText(raw?.value || '');
    const label = toPlainText(raw?.label || '');
    if (!value || !label) continue;
    if (deduped.some(x => normalizeForCompare(x.value) === normalizeForCompare(value) && normalizeForCompare(x.label) === normalizeForCompare(label))) {
      continue;
    }
    deduped.push({ value, label });
    if (deduped.length >= 4) break;
  }
  return deduped;
}

function relevanceAgainstContext(candidateText, contextText) {
  return jaccardSimilarity(candidateText, contextText);
}

/**
 * Build KPI stats by extracting numeric anchors.
 */
function buildInfographicStats(slide) {
  const lines = [
    toPlainText(slide.headline),
    toPlainText(slide.introText),
    ...(slide.bullets || []).map(b => toPlainText(b)),
  ].filter(Boolean);

  const candidates = [];

  for (const line of lines) {
    const currency = line.match(/([$\u00A3\u20AC]\s?\d+(?:[.,]\d+)?(?:[MBK])?)/i);
    if (currency) candidates.push({ value: currency[1], label: 'Portfolio Scope' });

    const awards = line.match(/(\d+)\s+awards?/i);
    if (awards) candidates.push({ value: awards[1], label: 'Awards Earned' });

    const percent = line.match(/(\d+(?:\.\d+)?%)/i);
    if (percent) candidates.push({ value: percent[1], label: 'Performance Lift' });

    const hours = line.match(/(\d+)\+?\s*hours?/i);
    if (hours) candidates.push({ value: `${hours[1]}+`, label: 'Hours Saved' });

    const years = line.match(/(\d+)\s+year/i);
    if (years) candidates.push({ value: years[1], label: 'Years of Impact' });

    const largeNumber = line.match(/\b(\d+(?:[.,]\d+)?)\s*(M|B|K)\b/i);
    if (largeNumber) {
      const value = `${largeNumber[1]}${largeNumber[2].toUpperCase()}`;
      candidates.push({ value, label: 'Scale' });
    }
  }

  const stats = sanitizeStats(candidates).slice(0, 4);
  const confidence = stats.length >= 2 ? 0.88 : stats.length === 1 ? 0.65 : 0;

  return { stats, confidence };
}

/**
 * Build conceptual cards that do NOT mirror bullet text.
 * No generic fallback cards are added.
 */
function buildAutoInsightCards(slide, bulletItems = []) {
  const context = [
    toPlainText(slide.headline),
    toPlainText(slide.introText),
    ...bulletItems.map(item => item.textPlain),
  ].join(' ');

  const catalog = [
    {
      key: 'connectivity',
      test: /\bmcp|connector|toolbox|integration|gateway|server\b/i,
      title: 'Connectivity Layer',
      detail: 'Attach trusted tools and data sources in one flow.',
    },
    {
      key: 'orchestration',
      test: /\bagent|orchestrat|manager|parallel|specialist\b/i,
      title: 'Agent Orchestration',
      detail: 'Split planning, execution, and review by role.',
    },
    {
      key: 'runtime',
      test: /\bvoice|stt|telephony|webhook|api\b/i,
      title: 'Runtime Pipeline',
      detail: 'Coordinate interfaces, tools, and validation checks.',
    },
    {
      key: 'routing',
      test: /\bextension|codex|claude|model\b/i,
      title: 'Model Routing',
      detail: 'Use specialized models based on task boundaries.',
    },
    {
      key: 'control',
      test: /\breliability|hardening|guardrail|governance|quota|auth|risk\b/i,
      title: 'Control Plane',
      detail: 'Enforce guardrails, monitoring, and safe operations.',
    },
    {
      key: 'data',
      test: /\bdata|schema|query|sql|looker|bigquery|alloydb\b/i,
      title: 'Data Grounding',
      detail: 'Validate logic against real schema and metric context.',
    },
    {
      key: 'verification',
      test: /\bartifact|verify|trace|audit|evidence\b/i,
      title: 'Verification Loop',
      detail: 'Require inspectable outputs before shipping changes.',
    },
  ];

  const cards = [];
  const matchedKeys = [];
  for (const card of catalog) {
    if (!card.test.test(context)) continue;
    if (cards.some(existing => existing.title === card.title)) continue;
    if (isDuplicateLikeBullet(card.title, bulletItems)) continue;
    if (isDuplicateLikeBullet(card.detail, bulletItems)) continue;

    cards.push(card);
    matchedKeys.push(card.key);
    if (cards.length >= 3) break;
  }

  const confidence = cards.length >= 2 ? 0.8 : cards.length === 1 ? 0.55 : 0;
  return {
    cards: cards.slice(0, 3).map((card, index) => ({
      icon: String(index + 1),
      title: card.title,
      detail: card.detail,
    })),
    confidence,
    matchedKeys,
  };
}

function sanitizeExplicitCards(cards, bulletItems, contextText, rejections) {
  if (!Array.isArray(cards)) return [];
  const accepted = [];

  for (let i = 0; i < cards.length; i++) {
    const raw = cards[i];
    const title = toPlainText(raw?.title || '');
    const detail = toPlainText(raw?.detail || '');
    const icon = raw?.icon ? toPlainText(raw.icon) : String(i + 1);

    if (!title) {
      rejections.push({
        type: 'visual_card_rejected',
        reason: 'missing_title',
        index: i,
      });
      continue;
    }

    if (isDuplicateLikeBullet(title, bulletItems) || (detail && isDuplicateLikeBullet(detail, bulletItems))) {
      rejections.push({
        type: 'visual_card_rejected',
        reason: 'duplicates_primary_bullets',
        index: i,
        title,
      });
      continue;
    }

    const relevance = relevanceAgainstContext(`${title} ${detail}`, contextText);
    if (relevance < 0.02) {
      rejections.push({
        type: 'visual_card_rejected',
        reason: 'low_context_relevance',
        index: i,
        title,
        relevance,
      });
      continue;
    }

    accepted.push({ icon, title, detail });
    if (accepted.length >= 3) break;
  }

  return accepted;
}

function resolveIntent(slide) {
  const explicitIntent = toPlainText(slide.intent || '').toLowerCase();
  if (explicitIntent && Object.prototype.hasOwnProperty.call(INTENT_DEFAULT_STYLE, explicitIntent)) {
    return {
      intent: explicitIntent,
      confidence: 1,
      source: 'explicit',
    };
  }

  if (slide.type !== 'body') {
    return {
      intent: 'context',
      confidence: 0.9,
      source: 'non_body_default',
    };
  }

  if (slide.stepNumber) {
    return {
      intent: 'workflow',
      confidence: 0.9,
      source: 'legacy_stepNumber',
    };
  }

  const combined = [
    toPlainText(slide.headline),
    toPlainText(slide.introText),
    ...(slide.bullets || []).map(b => toPlainText(b)),
  ].join(' ');

  if (/\bworkflow\s+\d+\b/i.test(combined) || /^workflow\b/i.test(toPlainText(slide.headline))) {
    return {
      intent: 'workflow',
      confidence: 0.95,
      source: 'headline_workflow',
    };
  }

  const rules = {
    workflow: [
      /\bworkflow\b/i,
      /\bstep\b/i,
      /\bphase\b/i,
      /\bpipeline\b/i,
      /\bloop\b/i,
      /\borchestrat/i,
      /\bfactory\b/i,
      /\bhardening\b/i,
    ],
    result: [
      /\baward|awards|earned|won|impact|outcome|results|recognition\b/i,
      /\bportfolio|saved|efficiency|lift|growth|improv/i,
      /\bunder a year\b/i,
    ],
    milestone: [
      /\bmilestone|chapter|journey|role|promotion|achievement\b/i,
      /\bjoined|grateful|farewell\b/i,
    ],
    proof: [
      /\bproof|evidence|verified|audit|validated|benchmark\b/i,
    ],
    context: [
      /\bcontext|what changed|why now|landscape\b/i,
    ],
    framework: [
      /\bframework|model|system|blueprint|principles|matrix\b/i,
    ],
    transition: [
      /\bwhat'?s next|next move|next\b/i,
      /\broadmap|future\b/i,
    ],
    story: [
      /\bstory|my journey|grateful|chapter|farewell\b/i,
    ],
  };

  const scores = {};
  for (const [intent, patterns] of Object.entries(rules)) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(combined)) score += 0.28;
    }
    if (intent === 'workflow' && /agent\s+\d+/i.test(combined)) score += 0.25;
    if (intent === 'result' && /\b\d+/.test(combined)) score += 0.12;
    scores[intent] = Math.min(score, 1);
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestIntent, bestScore] = ranked[0] || ['context', 0.4];

  if (bestScore < 0.45) {
    return {
      intent: 'context',
      confidence: 0.45,
      source: 'inferred_low_confidence',
    };
  }

  return {
    intent: bestIntent,
    confidence: Math.min(bestScore, 0.92),
    source: 'inferred',
  };
}

function headlineWorkflowNumber(headline) {
  const match = String(headline || '').match(/workflow\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function resolveTopChip(slide, intentResolution, workflowOrdinal) {
  const result = {
    show: false,
    label: '',
    style: 'neutral',
    icon: STYLE_ICONS.neutral,
    mode: 'auto',
    source: 'none',
    confidence: 0,
    hiddenReason: '',
    rejections: [],
  };

  if (slide.type !== 'body') return result;

  const chip = slide.chip || {};
  const mode = toPlainText(chip.mode || 'auto').toLowerCase();
  result.mode = mode || 'auto';

  if (result.mode === 'hide') {
    result.hiddenReason = 'chip_mode_hide';
    result.source = 'explicit_chip';
    return result;
  }

  if (result.mode === 'workflow') {
    if (intentResolution.intent !== 'workflow') {
      result.hiddenReason = 'workflow_chip_not_allowed_for_non_workflow_intent';
      result.rejections.push({
        type: 'chip_rejected',
        reason: result.hiddenReason,
      });
      return result;
    }

    const number = chip.workflowNumber || slide.stepNumber || headlineWorkflowNumber(slide.headline) || workflowOrdinal || 1;
    result.show = true;
    result.label = `Workflow ${number}`;
    result.style = chip.style || 'info';
    result.icon = STYLE_ICONS[result.style] || STYLE_ICONS.info;
    result.source = 'explicit_chip';
    result.confidence = 1;
    return result;
  }

  if (result.mode === 'label') {
    const rawLabel = toPlainText(chip.label || '');
    if (!rawLabel) {
      result.hiddenReason = 'missing_chip_label';
      result.rejections.push({
        type: 'chip_rejected',
        reason: result.hiddenReason,
      });
      return result;
    }

    if (intentResolution.intent !== 'custom') {
      const canonical = CONTROLLED_LABELS.get(normalizeKey(rawLabel));
      if (!canonical) {
        result.hiddenReason = 'label_not_in_controlled_set';
        result.rejections.push({
          type: 'chip_rejected',
          reason: result.hiddenReason,
          label: rawLabel,
        });
        return result;
      }
      result.label = canonical;
    } else {
      result.label = rawLabel;
    }

    result.show = true;
    result.style = chip.style || INTENT_DEFAULT_STYLE[intentResolution.intent] || 'neutral';
    result.icon = STYLE_ICONS[result.style] || STYLE_ICONS.neutral;
    result.source = 'explicit_chip';
    result.confidence = 1;
    return result;
  }

  if (intentResolution.confidence < 0.65) {
    result.hiddenReason = 'intent_confidence_below_threshold';
    result.source = intentResolution.source;
    result.confidence = intentResolution.confidence;
    return result;
  }

  if (intentResolution.intent === 'custom') {
    result.hiddenReason = 'custom_intent_requires_explicit_label';
    result.source = intentResolution.source;
    result.confidence = intentResolution.confidence;
    return result;
  }

  if (intentResolution.intent === 'workflow') {
    const number = chip.workflowNumber || slide.stepNumber || headlineWorkflowNumber(slide.headline) || workflowOrdinal || 1;
    result.label = `Workflow ${number}`;
  } else {
    result.label = INTENT_LABELS[intentResolution.intent] || '';
  }

  if (!result.label) {
    result.hiddenReason = 'no_label_resolved_for_intent';
    result.source = intentResolution.source;
    result.confidence = intentResolution.confidence;
    return result;
  }

  result.show = true;
  result.style = chip.style || INTENT_DEFAULT_STYLE[intentResolution.intent] || 'neutral';
  result.icon = STYLE_ICONS[result.style] || STYLE_ICONS.neutral;
  result.source = 'auto_intent';
  result.confidence = intentResolution.confidence;
  return result;
}

function resolveVisualPanel(slide, index, contentSpec, bulletItems, intentResolution) {
  const decision = {
    show: false,
    mode: 'none',
    source: 'none',
    confidence: 0,
    imagePath: null,
    stats: [],
    cards: [],
    chartFootnote: '',
    rejections: [],
  };

  if (slide.type !== 'body') return decision;

  const visual = slide.visual || {};
  const explicitMode = toPlainText(visual.mode || 'auto').toLowerCase();
  const mode = explicitMode || 'auto';
  const contextText = [
    toPlainText(slide.headline),
    toPlainText(slide.introText),
    ...(slide.bullets || []).map(b => toPlainText(b)),
  ].join(' ');

  const explicitStats = sanitizeStats(visual.stats);
  const autoStatsPack = buildInfographicStats(slide);

  const explicitCards = sanitizeExplicitCards(visual.cards, bulletItems, contextText, decision.rejections);
  const autoCardsPack = buildAutoInsightCards(slide, bulletItems);

  const imageVisual = resolveSlideImageVisual(slide, index, contentSpec);
  const chartVisual = resolveChartVisual(slide, index, contentSpec);
  const hasChartSpec = !!visual.chart;

  const setDecision = ({ panelMode, source, confidence = 1, imagePath = null, stats = [], cards = [], chartFootnote = '' }) => {
    decision.show = panelMode !== 'none';
    decision.mode = panelMode;
    decision.source = source;
    decision.confidence = confidence;
    decision.imagePath = imagePath;
    decision.stats = stats;
    decision.cards = cards;
    decision.chartFootnote = chartFootnote;
    return decision;
  };

  if (mode === 'none') {
    return setDecision({
      panelMode: 'none',
      source: 'explicit_visual_mode',
      confidence: 1,
    });
  }

  if (mode === 'chart') {
    if (!hasChartSpec) {
      decision.rejections.push({
        type: 'visual_mode_chart_rejected',
        reason: 'missing_visual_chart_spec',
      });
      return decision;
    }
    if (!chartVisual?.dataUrl) {
      decision.rejections.push({
        type: 'visual_mode_chart_rejected',
        reason: 'chart_asset_missing',
      });
      return decision;
    }
    return setDecision({
      panelMode: 'chart',
      source: chartVisual.source,
      confidence: 1,
      imagePath: chartVisual.dataUrl,
      chartFootnote: toPlainText(visual.chart?.footnote || ''),
    });
  }

  if (mode === 'image') {
    if (!imageVisual?.dataUrl) {
      decision.rejections.push({
        type: 'visual_mode_image_rejected',
        reason: 'image_asset_missing',
      });
      return decision;
    }
    return setDecision({
      panelMode: 'image',
      source: imageVisual.source,
      confidence: 1,
      imagePath: imageVisual.dataUrl,
    });
  }

  if (mode === 'kpi') {
    const stats = explicitStats.length > 0 ? explicitStats : autoStatsPack.stats;
    const confidence = explicitStats.length > 0 ? 1 : autoStatsPack.confidence;
    if (!stats.length || confidence < 0.7) {
      decision.rejections.push({
        type: 'visual_mode_kpi_rejected',
        reason: 'insufficient_numeric_signal',
        confidence,
      });
      return decision;
    }
    return setDecision({
      panelMode: 'kpi',
      source: explicitStats.length > 0 ? 'explicit_visual_stats' : 'auto_numeric',
      confidence,
      stats,
    });
  }

  if (mode === 'cards') {
    const cards = explicitCards.length > 0 ? explicitCards : autoCardsPack.cards;
    const confidence = explicitCards.length > 0 ? 1 : autoCardsPack.confidence;
    if (cards.length < 2 || confidence < 0.7) {
      decision.rejections.push({
        type: 'visual_mode_cards_rejected',
        reason: 'insufficient_card_signal',
        confidence,
        cardCount: cards.length,
      });
      return decision;
    }
    return setDecision({
      panelMode: 'cards',
      source: explicitCards.length > 0 ? 'explicit_visual_cards' : 'auto_cards',
      confidence,
      cards,
    });
  }

  if (hasChartSpec && chartVisual?.dataUrl) {
    return setDecision({
      panelMode: 'chart',
      source: chartVisual.source,
      confidence: 1,
      imagePath: chartVisual.dataUrl,
      chartFootnote: toPlainText(visual.chart?.footnote || ''),
    });
  }

  if (imageVisual?.dataUrl) {
    return setDecision({
      panelMode: 'image',
      source: imageVisual.source,
      confidence: imageVisual.source === 'generated_image' ? 0.92 : 1,
      imagePath: imageVisual.dataUrl,
    });
  }

  if (explicitStats.length > 0) {
    return setDecision({
      panelMode: 'kpi',
      source: 'explicit_visual_stats',
      confidence: 1,
      stats: explicitStats,
    });
  }

  if (autoStatsPack.stats.length > 0 && autoStatsPack.confidence >= 0.72) {
    return setDecision({
      panelMode: 'kpi',
      source: 'auto_numeric',
      confidence: autoStatsPack.confidence,
      stats: autoStatsPack.stats,
    });
  }

  if (explicitCards.length >= 2) {
    return setDecision({
      panelMode: 'cards',
      source: 'explicit_visual_cards',
      confidence: 1,
      cards: explicitCards,
    });
  }

  if (autoCardsPack.cards.length >= 2 && autoCardsPack.confidence >= 0.72) {
    return setDecision({
      panelMode: 'cards',
      source: 'auto_cards',
      confidence: autoCardsPack.confidence,
      cards: autoCardsPack.cards,
    });
  }

  decision.rejections.push({
    type: 'visual_auto_none',
    reason: 'no_relevant_visual_signal',
    intent: intentResolution.intent,
  });
  return decision;
}

function resolveDensityProfile(slide, contentSpec, visualDecision, bulletItems) {
  const explicit = toPlainText(slide?.densityProfile || contentSpec?.planner?.densityProfile || '').toLowerCase();
  if (['compact', 'balanced', 'airy'].includes(explicit)) return explicit;

  const headlineLen = toPlainText(slide.headline || '').length;
  const introLen = toPlainText(slide.introText || '').length;
  const bulletLen = bulletItems.reduce((sum, item) => sum + (item.textPlain || '').length, 0);
  const total = headlineLen + introLen + bulletLen;
  const bulletCount = bulletItems.length;

  if (bulletCount >= 4 || total > 290) return 'airy';
  if (visualDecision.show && bulletCount <= 3 && total < 220) return 'compact';
  return 'balanced';
}

/**
 * Generate CSS override block when contentSpec has colorOverride
 */
function generateColorOverrideCSS(colorOverride) {
  if (!colorOverride) return '';
  const primary = colorOverride.primary || '#FF7B00';
  const gradient = colorOverride.gradient || '#E56A00';
  const lightAccent = colorOverride.lightAccent || '#FFF3E6';

  return `
    :root {
      --color-accent-blue: ${primary} !important;
      --color-accent-light-blue: ${lightAccent} !important;
      --color-accent-teal: ${primary} !important;
      --color-accent-light-teal: ${lightAccent} !important;
      --theme-cover-primary: ${primary} !important;
      --theme-cover-gradient: ${gradient} !important;
      --theme-framing-primary: ${primary} !important;
      --theme-framing-gradient: ${gradient} !important;
      --theme-cta-primary: ${primary} !important;
      --theme-cta-gradient: ${gradient} !important;
    }
    .slide::before { border-color: ${primary} !important; }
    .slide::after { background-color: ${primary} !important; }
    .slide--cover { background: linear-gradient(135deg, ${primary} 0%, ${gradient} 100%) !important; }
    .top-chip { background: ${primary} !important; border-color: ${primary} !important; color: #FFFFFF !important; }
    .highlight-box { background: ${primary} !important; }
    .highlight-blue { color: ${primary} !important; }
    .slide__bullet-icon { color: ${primary} !important; }
    .cta-text { color: ${primary} !important; }
    .divider--blue { background: ${primary} !important; }
    .underline-accent { text-decoration-color: ${primary} !important; }
    .slide--framing { background: linear-gradient(180deg, ${lightAccent} 0%, #FFFFFF 50%) !important; }
    .slide--framing .slide__headline { color: ${primary} !important; }
    .slide--framing::before { background: ${primary} !important; }
  `;
}

/**
 * Prepare slide data with computed flags for template rendering
 */
function prepareSlideData(slide, index, totalSlides, contentSpec, intentResolutions, workflowOrdinals) {
  const isCover = slide.type === 'cover';
  const isBody = slide.type === 'body';
  const isCta = slide.type === 'cta';
  const isFraming = slide.type === 'framing';
  const intentResolution = intentResolutions[index] || resolveIntent(slide);
  const workflowOrdinal = workflowOrdinals[index] || null;

  const bulletItems = (slide.bullets || [])
    .map(b => splitBulletContent(b))
    .filter(Boolean);

  const topChip = isBody
    ? resolveTopChip(slide, intentResolution, workflowOrdinal)
    : null;

  const visualDecision = isBody
    ? resolveVisualPanel(slide, index, contentSpec, bulletItems, intentResolution)
    : {
      show: false,
      mode: 'none',
      source: 'not_body',
      confidence: 0,
      imagePath: null,
      stats: [],
      cards: [],
      chartFootnote: '',
      rejections: [],
    };
  const densityProfile = isBody
    ? resolveDensityProfile(slide, contentSpec, visualDecision, bulletItems)
    : 'balanced';

  const diagramItems = Array.isArray(slide.diagram)
    ? slide.diagram.map(label => ({ label }))
    : [];

  const headlineWithAccent = applyAutomaticHeadlineAccent(
    slide.headline,
    slide.type,
    contentSpec.enforceHeadlineAccent !== false,
  );

  const intelligence = {
    slideNumber: index + 1,
    slideType: slide.type,
    headline: toPlainText(slide.headline || ''),
    intent: intentResolution,
    densityProfile,
    chip: topChip ? {
      mode: topChip.mode,
      show: topChip.show,
      label: topChip.label,
      style: topChip.style,
      source: topChip.source,
      confidence: topChip.confidence,
      hiddenReason: topChip.hiddenReason,
      rejections: topChip.rejections,
    } : null,
    visual: {
      mode: visualDecision.mode,
      show: visualDecision.show,
      source: visualDecision.source,
      confidence: visualDecision.confidence,
      rejections: visualDecision.rejections,
    },
  };

  return {
    ...slide,
    slideNumber: index + 1,
    totalSlides,
    intentResolved: intentResolution.intent,

    profileName: contentSpec.profile?.name || 'Your Name',
    avatarPath: contentSpec.profile?.avatar
      ? imageToDataUrl(join(ROOT_DIR, 'brand', 'assets', contentSpec.profile.avatar))
      : null,
    showProfileTop: isCover && contentSpec.profile?.name,
    showProfileBottom: !isCover && contentSpec.profile?.name,

    showRepostBadge: contentSpec.showRepostBadge !== false,

    coverLogoPath: slide.coverLogo
      ? imageToDataUrl(join(ROOT_DIR, 'brand', 'assets', slide.coverLogo))
      : null,

    coverImagePath: slide.coverImage
      ? imageToDataUrl(join(ROOT_DIR, 'brand', slide.coverImage))
      : null,

    headlineHtml: formatHeadlineHtml(headlineWithAccent),
    introText: formatBulletHtml(slide.introText),
    bullets: slide.bullets?.map(b => formatBulletHtml(b)),
    bulletItems,
    topChip,
    showTopChip: !!topChip?.show,
    topChipClass: topChip ? `top-chip top-chip--${topChip.style}` : '',
    visualMode: visualDecision.mode,
    showInfographic: isBody && visualDecision.show,
    showVisualImage: visualDecision.mode === 'image',
    showVisualChart: visualDecision.mode === 'chart',
    showVisualStats: visualDecision.mode === 'kpi',
    showVisualCards: visualDecision.mode === 'cards',
    slideVisualPath: visualDecision.imagePath,
    visualStats: visualDecision.stats,
    visualCards: visualDecision.cards,
    visualChartFootnote: visualDecision.chartFootnote,
    infographicStats: visualDecision.stats,
    insightCards: visualDecision.cards,
    diagramItems,

    isCover,
    isFraming,
    isBody,
    isCta,

    showMockup: !!slide.mockupContent,
    showDiagram: diagramItems.length > 0,
    densityProfile,
    _intelligence: intelligence,
  };
}

/**
 * Render a single slide to PNG using Playwright
 */
async function renderSlideToImage(page, html, outputPath, brandRules) {
  await page.setViewportSize({
    width: brandRules.slide.width,
    height: brandRules.slide.height,
  });

  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  await page.screenshot({
    path: outputPath,
    type: 'png',
  });

  return outputPath;
}

/**
 * Merge multiple PNGs into a single PDF
 */
async function mergeImagesToPdf(imagePaths, outputPath) {
  const pdfDoc = await PDFDocument.create();

  for (const imagePath of imagePaths) {
    const imageBytes = readFileSync(imagePath);
    const image = await pdfDoc.embedPng(imageBytes);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  writeFileSync(outputPath, pdfBytes);

  return outputPath;
}

/**
 * Main render function
 */
async function renderCarousel(contentSpecPath) {
  console.log('LinkedIn Carousel PDF Generator');
  console.log('================================\n');

  console.log('Loading configuration...');
  const brandRules = loadJson(BRAND_RULES_PATH);
  const contentSpec = loadJson(contentSpecPath);
  const templateHtml = readFileSync(TEMPLATE_PATH, 'utf-8');
  const stylesCSS = readFileSync(STYLES_PATH, 'utf-8');

  const template = Handlebars.compile(templateHtml);

  if (!existsSync(OUTPUT_PDF_DIR)) mkdirSync(OUTPUT_PDF_DIR, { recursive: true });
  if (!existsSync(OUTPUT_IMAGES_DIR)) mkdirSync(OUTPUT_IMAGES_DIR, { recursive: true });
  if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true });

  const slideImagesDir = join(OUTPUT_IMAGES_DIR, contentSpec.slug);
  if (!existsSync(slideImagesDir)) mkdirSync(slideImagesDir, { recursive: true });

  console.log(`Rendering "${contentSpec.title}" (${contentSpec.slides.length} slides)\n`);

  const intentResolutions = contentSpec.slides.map(slide => resolveIntent(slide));
  const workflowOrdinals = {};
  let workflowCounter = 0;
  for (let i = 0; i < contentSpec.slides.length; i++) {
    const slide = contentSpec.slides[i];
    if (slide.type === 'body' && intentResolutions[i]?.intent === 'workflow') {
      workflowCounter += 1;
      workflowOrdinals[i] = workflowCounter;
    }
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const imagePaths = [];
  const intelligenceSlides = [];

  for (let i = 0; i < contentSpec.slides.length; i++) {
    const slide = contentSpec.slides[i];
    const slideData = prepareSlideData(
      slide,
      i,
      contentSpec.slides.length,
      contentSpec,
      intentResolutions,
      workflowOrdinals,
    );
    intelligenceSlides.push(slideData._intelligence);
    const { _intelligence, ...templateData } = slideData;

    const colorOverrideCSS = generateColorOverrideCSS(contentSpec.colorOverride);
    const htmlWithStyles = template({
      ...templateData,
      title: contentSpec.title,
    }).replace('</head>', `<style>${stylesCSS}\n${colorOverrideCSS}</style></head>`);

    const imagePath = join(slideImagesDir, `slide_${String(i + 1).padStart(2, '0')}.png`);

    await renderSlideToImage(page, htmlWithStyles, imagePath, brandRules);
    imagePaths.push(imagePath);

    const headline = (slide.headline || '').substring(0, 40);
    console.log(`  OK Slide ${i + 1}/${contentSpec.slides.length}: ${slide.type} - "${headline}..."`);
  }

  await browser.close();

  console.log('\nMerging slides into PDF...');
  const pdfPath = join(OUTPUT_PDF_DIR, `${contentSpec.slug}.pdf`);
  await mergeImagesToPdf(imagePaths, pdfPath);

  const intelligencePath = join(LOGS_DIR, `${contentSpec.slug}_render_intelligence.json`);
  writeFileSync(intelligencePath, JSON.stringify({
    slug: contentSpec.slug,
    title: contentSpec.title,
    generatedAt: new Date().toISOString(),
    intentThreshold: 0.65,
    slides: intelligenceSlides,
  }, null, 2));

  console.log(`\nPDF generated: ${pdfPath}`);
  console.log(`Slide images: ${slideImagesDir}`);
  console.log(`Render intelligence: ${intelligencePath}`);

  return {
    pdfPath,
    imagePaths,
    slideCount: contentSpec.slides.length,
    intelligencePath,
  };
}

// CLI entry point
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node render_html_to_pdf.js <content-spec.json>');
  process.exit(1);
}

const contentSpecPath = args[0].startsWith('/') || /^[A-Za-z]:/.test(args[0])
  ? args[0]
  : join(process.cwd(), args[0]);

if (!existsSync(contentSpecPath)) {
  console.error(`Error: Content spec not found: ${contentSpecPath}`);
  process.exit(1);
}

renderCarousel(contentSpecPath)
  .then(result => {
    console.log('\nRender complete.');
    console.log(`Total slides: ${result.slideCount}`);
  })
  .catch(err => {
    console.error('Render failed:', err.message);
    process.exit(1);
  });
