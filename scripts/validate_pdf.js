/**
 * validate_pdf.js
 * 
 * Validates a carousel content spec against schema and content constraints
 * Outputs a validation report with pass/fail status and actionable fixes
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Configuration paths
const SCHEMA_PATH = join(ROOT_DIR, 'schemas', 'carousel.schema.json');
const BRAND_RULES_PATH = join(ROOT_DIR, 'brand', 'brand_rules.json');
const LOGS_DIR = join(ROOT_DIR, 'logs');

/**
 * Load and parse JSON file
 */
function loadJson(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

function normalizeText(text = '') {
    return String(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function toPlainText(text = '') {
    return String(text)
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/~~([^~]+)~~/g, '$1')
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

function looksDuplicateToBullets(candidateText, bullets = []) {
    const candidate = normalizeText(candidateText);
    if (!candidate) return false;
    return bullets.some(bullet => {
        const bulletNorm = normalizeText(toPlainText(bullet));
        if (!bulletNorm) return false;
        if (bulletNorm.includes(candidate) || candidate.includes(bulletNorm)) return true;
        return jaccardSimilarity(candidate, bulletNorm) >= 0.72;
    });
}

function containsClaimSignal(text = '') {
    const plain = toPlainText(text);
    return /(\b\d+(?:\.\d+)?%?\b|[$£€]\s?\d|(?:\d+)\s*(?:k|m|b)\b|\baward|awards|saved|increase|decrease|growth|portfolio|benchmark|largest|fastest\b)/i.test(plain);
}

function inferIntent(slide = {}) {
    const explicitIntent = normalizeText(slide.intent || '');
    const intentWhitelist = new Set(['workflow', 'result', 'milestone', 'proof', 'context', 'framework', 'transition', 'story', 'custom']);
    if (intentWhitelist.has(explicitIntent)) return explicitIntent;

    if (slide.type !== 'body') return 'context';
    if (slide.stepNumber) return 'workflow';

    const text = [
        toPlainText(slide.headline || ''),
        toPlainText(slide.introText || ''),
        ...(slide.bullets || []).map(b => toPlainText(b)),
    ].join(' ');

    if (/\bworkflow\s+\d+\b/i.test(text) || /^workflow\b/i.test(toPlainText(slide.headline || ''))) {
        return 'workflow';
    }
    if (/\baward|awards|earned|won|impact|outcome|results|recognition|portfolio\b/i.test(text)) {
        return 'result';
    }
    if (/\bjourney|chapter|grateful|farewell|story\b/i.test(text)) {
        return 'story';
    }
    if (/\bnext|roadmap|future\b/i.test(text)) {
        return 'transition';
    }
    if (/\bframework|model|system|blueprint\b/i.test(text)) {
        return 'framework';
    }
    return 'context';
}

function controlledChipLabel(label = '') {
    const map = {
        workflow: 'Workflow',
        result: 'Result',
        milestone: 'Milestone',
        proof: 'Proof',
        context: 'Context',
        framework: 'Framework',
        'next move': 'Next Move',
        story: 'Story',
    };
    return map[normalizeText(label)] || null;
}

/**
 * Validate content spec against JSON schema
 */
function validateSchema(contentSpec, schema) {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(contentSpec);

    return {
        valid,
        errors: validate.errors || [],
    };
}

/**
 * Validate content constraints from brand rules
 */
function validateConstraints(contentSpec, brandRules) {
    const issues = [];
    const warnings = [];
    const constraints = brandRules.constraints;
    const controlledLabelsSet = new Set(['Workflow', 'Result', 'Milestone', 'Proof', 'Context', 'Framework', 'Next Move', 'Story']);
    const headlineRegistry = [];
    const hasDeckSources = Array.isArray(contentSpec?.metadata?.sources) && contentSpec.metadata.sources.length > 0;

    contentSpec.slides.forEach((slide, index) => {
        const slideNum = index + 1;
        const inferredIntent = inferIntent(slide);
        const chip = slide.chip || {};
        const chipMode = normalizeText(chip.mode || 'auto');
        const visual = slide.visual || {};
        const visualMode = normalizeText(visual.mode || 'auto');
        const slideHasSources = Array.isArray(slide.sourceRefs) && slide.sourceRefs.length > 0;
        const claimText = [
            toPlainText(slide.headline || ''),
            toPlainText(slide.introText || ''),
            ...(slide.bullets || []).map(b => toPlainText(b)),
        ].join(' ');

        if (containsClaimSignal(claimText) && !slideHasSources && !hasDeckSources) {
            warnings.push({
                slide: slideNum,
                field: 'sourceRefs',
                message: 'Slide includes claim-like language without sourceRefs or metadata.sources.',
            });
        }

        // Headline length
        if (slide.headline && slide.headline.length > constraints.headline.maxLength) {
            issues.push({
                slide: slideNum,
                field: 'headline',
                message: `Headline exceeds ${constraints.headline.maxLength} characters (${slide.headline.length} chars)`,
                value: slide.headline,
                fix: `Shorten to ${constraints.headline.maxLength} characters`,
            });
        } else if (slide.headline && slide.headline.length > constraints.headline.preferredLength) {
            warnings.push({
                slide: slideNum,
                field: 'headline',
                message: `Headline exceeds preferred ${constraints.headline.preferredLength} characters (${slide.headline.length} chars)`,
            });
        }

        // Bullet count
        if (slide.bullets && slide.bullets.length > constraints.bullet.maxPerSlide) {
            issues.push({
                slide: slideNum,
                field: 'bullets',
                message: `Too many bullets: ${slide.bullets.length} (max ${constraints.bullet.maxPerSlide})`,
                fix: `Reduce to ${constraints.bullet.maxPerSlide} bullets or split into multiple slides`,
            });
        }
        if (slide.type === 'body' && slide.bullets && slide.bullets.length > 3) {
            warnings.push({
                slide: slideNum,
                field: 'bullets',
                message: `Prefer 3 bullets for cleaner visual density (currently ${slide.bullets.length})`,
            });
        }

        // Bullet length
        if (slide.bullets) {
            slide.bullets.forEach((bullet, bulletIndex) => {
                if (bullet.length > constraints.bullet.maxLength) {
                    issues.push({
                        slide: slideNum,
                        field: `bullet[${bulletIndex}]`,
                        message: `Bullet exceeds ${constraints.bullet.maxLength} characters (${bullet.length} chars)`,
                        value: bullet,
                        fix: `Shorten to ${constraints.bullet.maxLength} characters`,
                    });
                }
            });

            const normalized = slide.bullets.map(b => normalizeText(b));
            for (let i = 0; i < normalized.length; i++) {
                for (let j = i + 1; j < normalized.length; j++) {
                    if (normalized[i] && normalized[i] === normalized[j]) {
                        warnings.push({
                            slide: slideNum,
                            field: `bullet[${j}]`,
                            message: `Bullet appears duplicated in the same slide`,
                        });
                    }
                }
            }
        }

        // Chip semantics validation
        if (slide.type === 'body') {
            if (chipMode === 'workflow' && inferredIntent !== 'workflow') {
                issues.push({
                    slide: slideNum,
                    field: 'chip.mode',
                    message: 'workflow chip mode is only allowed when intent resolves to workflow',
                    fix: 'Set chip.mode to auto/hide/label, or set intent to workflow for process slides',
                });
            }

            if (chipMode === 'label' && !toPlainText(chip.label || '')) {
                issues.push({
                    slide: slideNum,
                    field: 'chip.label',
                    message: 'chip.mode=label requires a non-empty chip.label',
                    fix: 'Provide chip.label or use chip.mode=auto/hide',
                });
            }

            if ((chipMode === 'label' || chipMode === 'auto') && chip.label && inferredIntent !== 'custom') {
                const canonical = controlledChipLabel(chip.label);
                if (!canonical || !controlledLabelsSet.has(canonical)) {
                    issues.push({
                        slide: slideNum,
                        field: 'chip.label',
                        message: 'chip label must be in controlled set for auto/label mode unless intent is custom',
                        fix: 'Use one of: Workflow, Result, Milestone, Proof, Context, Framework, Next Move, Story',
                    });
                }
            }
        }

        // Visual chart mode validation
        if (slide.type === 'body' && visualMode === 'chart') {
            const chart = visual.chart || {};
            const validType = ['bar', 'line', 'doughnut'].includes(chart.type);
            const validSeries = Array.isArray(chart.series) && chart.series.length >= 2
                && chart.series.every(item =>
                    String(item?.label || '').trim().length > 0
                    && Number.isFinite(Number(item?.value)));

            if (!chart || !validType || !validSeries) {
                issues.push({
                    slide: slideNum,
                    field: 'visual.chart',
                    message: 'visual.mode=chart requires valid chart spec (type + >=2 numeric series points)',
                    fix: 'Provide visual.chart.type in {bar,line,doughnut} and series items with label/value',
                });
            }
        }

        // Visual cards anti-duplication validation
        if (slide.type === 'body' && Array.isArray(visual.cards) && visual.cards.length > 0) {
            for (let c = 0; c < visual.cards.length; c++) {
                const card = visual.cards[c];
                const cardTitle = toPlainText(card?.title || '');
                const cardDetail = toPlainText(card?.detail || '');
                if (looksDuplicateToBullets(cardTitle, slide.bullets || []) || looksDuplicateToBullets(cardDetail, slide.bullets || [])) {
                    issues.push({
                        slide: slideNum,
                        field: `visual.cards[${c}]`,
                        message: 'visual card duplicates primary bullet narrative',
                        fix: 'Use conceptual cards that add new signal rather than repeating bullets',
                    });
                }
            }
        }

        if ((slide.type === 'body' || slide.type === 'framing') && slide.headline) {
            const hasAccentMarkers = /\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~/.test(slide.headline);
            const autoAccentEnabled = contentSpec.enforceHeadlineAccent !== false;
            if (!hasAccentMarkers && !autoAccentEnabled) {
                warnings.push({
                    slide: slideNum,
                    field: 'headline',
                    message: 'Consider accent markers (__text__) for stronger visual hierarchy',
                });
            }
        }

        // Slide type validation
        if (!constraints.slideTypes.includes(slide.type)) {
            issues.push({
                slide: slideNum,
                field: 'type',
                message: `Invalid slide type: "${slide.type}"`,
                fix: `Use one of: ${constraints.slideTypes.join(', ')}`,
            });
        }

        if (slide.headline) {
            headlineRegistry.push({
                slide: slideNum,
                type: slide.type,
                text: toPlainText(slide.headline),
            });
        }
    });

    // Headline uniqueness flow check
    for (let i = 1; i < headlineRegistry.length; i++) {
        const prev = headlineRegistry[i - 1];
        const curr = headlineRegistry[i];
        const sim = jaccardSimilarity(prev.text, curr.text);
        if (sim >= 0.82) {
            warnings.push({
                slide: curr.slide,
                field: 'headline',
                message: `Headline may be too similar to previous slide (${Math.round(sim * 100)}% overlap)`,
            });
        }
    }

    // Render intelligence checks
    const intelligencePath = join(LOGS_DIR, `${contentSpec.slug}_render_intelligence.json`);
    if (existsSync(intelligencePath)) {
        try {
            const intelligence = loadJson(intelligencePath);
            const bodySlides = Array.isArray(intelligence.slides)
                ? intelligence.slides.filter(s => s.slideType === 'body')
                : [];
            const bySlideNumber = new Map((intelligence.slides || []).map(s => [Number(s.slideNumber), s]));
            const visualCoverageTargetRaw = Number(contentSpec?.planner?.visualCoverageTarget);
            const visualCoverageTarget = Number.isFinite(visualCoverageTargetRaw)
                ? Math.min(0.9, Math.max(0.3, visualCoverageTargetRaw))
                : 0.3;

            if (bodySlides.length > 0) {
                const withVisual = bodySlides.filter(entry => entry?.visual?.show).length;
                const coverage = withVisual / bodySlides.length;
                if (coverage < visualCoverageTarget) {
                    issues.push({
                        slide: 0,
                        field: 'visual.coverage',
                        message: `Body-slide visual coverage is ${(coverage * 100).toFixed(1)}% (target ${(visualCoverageTarget * 100).toFixed(0)}%)`,
                        fix: 'Increase relevant side-panel usage (kpi/cards/chart/image) to meet coverage target',
                    });
                }
            }

            let consecutiveNone = 0;
            for (const entry of bodySlides) {
                const mode = normalizeText(entry?.visual?.mode || 'none');
                if (mode === 'none') {
                    consecutiveNone += 1;
                    if (consecutiveNone > 1) {
                        warnings.push({
                            slide: entry.slideNumber,
                            field: 'visual.mode',
                            message: 'More than one consecutive body slide has visual.mode=none after render intelligence',
                        });
                    }
                } else {
                    consecutiveNone = 0;
                }

                const chip = entry?.chip;
                if (chip?.show && Number(chip.confidence || 0) < 0.65) {
                    issues.push({
                        slide: entry.slideNumber,
                        field: 'chip.confidence',
                        message: 'Visible chip has confidence below threshold',
                        fix: 'Hide chip or set explicit intent/chip values',
                    });
                }

                const visual = entry?.visual;
                if (visual?.show && Number(visual.confidence || 0) < 0.65) {
                    issues.push({
                        slide: entry.slideNumber,
                        field: 'visual.confidence',
                        message: 'Visible side panel has low relevance confidence',
                        fix: 'Choose a more relevant visual mode or add explicit visual data',
                    });
                }

                const visualRejections = Array.isArray(visual?.rejections) ? visual.rejections : [];
                if (visualRejections.some(rej => rej.reason === 'duplicates_primary_bullets')) {
                    issues.push({
                        slide: entry.slideNumber,
                        field: 'visual.cards',
                        message: 'Render intelligence found panel candidates duplicating primary bullets',
                        fix: 'Rewrite panel content to add net-new conceptual/metric signal',
                    });
                }
            }

            // Workflow chip sequence integrity
            const workflowChipEntries = bodySlides
                .filter(entry => entry?.chip?.show && /^workflow\s+\d+$/i.test(String(entry.chip.label || '').trim()))
                .map(entry => ({
                    slideNumber: Number(entry.slideNumber),
                    label: String(entry.chip.label || ''),
                    number: Number(String(entry.chip.label || '').replace(/[^0-9]/g, '')),
                    intent: normalizeText(entry?.intent?.intent || ''),
                }));

            let expectedWorkflowNumber = 1;
            for (const chipEntry of workflowChipEntries) {
                if (chipEntry.intent !== 'workflow') {
                    issues.push({
                        slide: chipEntry.slideNumber,
                        field: 'chip.label',
                        message: 'Workflow chip label appears on non-workflow intent slide',
                        fix: 'Use contextual labels for non-workflow intents',
                    });
                }

                if (chipEntry.number !== expectedWorkflowNumber) {
                    issues.push({
                        slide: chipEntry.slideNumber,
                        field: 'chip.label',
                        message: `Workflow chip numbering out of sequence (expected ${expectedWorkflowNumber}, got ${chipEntry.number})`,
                        fix: 'Ensure workflow chips increment sequentially without skips',
                    });
                    expectedWorkflowNumber = chipEntry.number + 1;
                } else {
                    expectedWorkflowNumber += 1;
                }
            }

            contentSpec.slides.forEach((slide, index) => {
                if (slide.type !== 'body') return;
                const requestedMode = normalizeText(slide?.visual?.mode || '');
                if (requestedMode !== 'chart') return;

                const intelligenceEntry = bySlideNumber.get(index + 1);
                const resolvedMode = normalizeText(intelligenceEntry?.visual?.mode || '');
                if (resolvedMode !== 'chart') {
                    issues.push({
                        slide: index + 1,
                        field: 'visual.mode',
                        message: 'visual.mode=chart did not resolve to chart at render time',
                        fix: 'Generate chart asset using scripts/generate_chart_assets.js and re-render',
                    });
                }
            });
        } catch (err) {
            warnings.push({
                slide: 0,
                field: 'render_intelligence',
                message: `Could not parse render intelligence log: ${err.message}`,
            });
        }
    } else {
        warnings.push({
            slide: 0,
            field: 'render_intelligence',
            message: 'Render intelligence log not found. Run render before strict validation.',
        });
    }

    // Structure validation
    if (contentSpec.slides.length > 0) {
        if (contentSpec.slides[0].type !== 'cover') {
            warnings.push({
                slide: 1,
                field: 'type',
                message: 'First slide should be type "cover"',
            });
        }

        const lastSlide = contentSpec.slides[contentSpec.slides.length - 1];
        if (lastSlide.type !== 'cta') {
            warnings.push({
                slide: contentSpec.slides.length,
                field: 'type',
                message: 'Last slide should be type "cta"',
            });
        }
    }

    return { issues, warnings };
}

/**
 * Generate validation report
 */
function generateReport(contentSpec, schemaResult, constraintResult) {
    const passed = schemaResult.valid && constraintResult.issues.length === 0;

    return {
        timestamp: new Date().toISOString(),
        slug: contentSpec.slug,
        title: contentSpec.title,
        slideCount: contentSpec.slides.length,
        passed,
        summary: {
            schemaValid: schemaResult.valid,
            schemaErrors: schemaResult.errors.length,
            constraintIssues: constraintResult.issues.length,
            warnings: constraintResult.warnings.length,
        },
        schemaErrors: schemaResult.errors,
        constraintIssues: constraintResult.issues,
        warnings: constraintResult.warnings,
    };
}

/**
 * Print report to console
 */
function printReport(report) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 CAROUSEL VALIDATION REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📝 Title: ${report.title}`);
    console.log(`🏷️  Slug: ${report.slug}`);
    console.log(`📊 Slides: ${report.slideCount}`);
    console.log(`⏰ Validated: ${report.timestamp}\n`);

    if (report.passed) {
        console.log('✅ STATUS: PASSED\n');
    } else {
        console.log('❌ STATUS: FAILED\n');
    }

    console.log('─────────────────────────────────────────────────────────────');
    console.log('SUMMARY');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  Schema valid: ${report.summary.schemaValid ? '✓' : '✗'}`);
    console.log(`  Schema errors: ${report.summary.schemaErrors}`);
    console.log(`  Constraint issues: ${report.summary.constraintIssues}`);
    console.log(`  Warnings: ${report.summary.warnings}\n`);

    if (report.schemaErrors.length > 0) {
        console.log('─────────────────────────────────────────────────────────────');
        console.log('SCHEMA ERRORS');
        console.log('─────────────────────────────────────────────────────────────');
        report.schemaErrors.forEach((err, i) => {
            console.log(`  ${i + 1}. ${err.instancePath || '/'}: ${err.message}`);
        });
        console.log('');
    }

    if (report.constraintIssues.length > 0) {
        console.log('─────────────────────────────────────────────────────────────');
        console.log('CONSTRAINT ISSUES');
        console.log('─────────────────────────────────────────────────────────────');
        report.constraintIssues.forEach((issue, i) => {
            console.log(`  ${i + 1}. Slide ${issue.slide}, ${issue.field}: ${issue.message}`);
            if (issue.fix) {
                console.log(`     → Fix: ${issue.fix}`);
            }
        });
        console.log('');
    }

    if (report.warnings.length > 0) {
        console.log('─────────────────────────────────────────────────────────────');
        console.log('WARNINGS');
        console.log('─────────────────────────────────────────────────────────────');
        report.warnings.forEach((warn, i) => {
            console.log(`  ${i + 1}. Slide ${warn.slide}, ${warn.field}: ${warn.message}`);
        });
        console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
}

/**
 * Main validation function
 */
function validateCarousel(contentSpecPath) {
    // Load files
    const schema = loadJson(SCHEMA_PATH);
    const brandRules = loadJson(BRAND_RULES_PATH);
    const contentSpec = loadJson(contentSpecPath);

    // Run validations
    const schemaResult = validateSchema(contentSpec, schema);
    const constraintResult = validateConstraints(contentSpec, brandRules);

    // Generate report
    const report = generateReport(contentSpec, schemaResult, constraintResult);

    // Print to console
    printReport(report);

    // Save report
    if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true });
    const reportPath = join(LOGS_DIR, `${contentSpec.slug}_validation.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📁 Report saved: ${reportPath}`);

    return report;
}

// CLI entry point
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node validate_pdf.js <content-spec.json>');
    process.exit(1);
}

const contentSpecPath = args[0].startsWith('/') || args[0].match(/^[A-Za-z]:/)
    ? args[0]
    : join(process.cwd(), args[0]);

if (!existsSync(contentSpecPath)) {
    console.error(`Error: Content spec not found: ${contentSpecPath}`);
    process.exit(1);
}

const report = validateCarousel(contentSpecPath);
process.exit(report.passed ? 0 : 1);
