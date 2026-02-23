/**
 * init_performance_log.js
 *
 * Creates a performance tracking scaffold for post-publish optimization.
 * Output:
 * - logs/performance/<slug>.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const PERFORMANCE_DIR = join(ROOT_DIR, 'logs', 'performance');

function resolveSpecPath(inputPath) {
  return inputPath.startsWith('/') || /^[A-Za-z]:/.test(inputPath)
    ? inputPath
    : join(process.cwd(), inputPath);
}

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function run(contentSpecPath) {
  const resolvedSpecPath = resolveSpecPath(contentSpecPath);
  if (!existsSync(resolvedSpecPath)) {
    throw new Error(`Content spec not found: ${resolvedSpecPath}`);
  }

  const contentSpec = loadJson(resolvedSpecPath);
  if (!existsSync(PERFORMANCE_DIR)) mkdirSync(PERFORMANCE_DIR, { recursive: true });

  const performancePath = join(PERFORMANCE_DIR, `${contentSpec.slug}.json`);
  if (existsSync(performancePath)) {
    console.log(`Performance log already exists: ${performancePath}`);
    return;
  }

  const template = {
    slug: contentSpec.slug,
    title: contentSpec.title,
    createdAt: new Date().toISOString(),
    publish: {
      status: 'draft',
      publishDate: null,
      channel: 'linkedin',
      postUrl: null,
      audienceTag: contentSpec.audience || '',
      objective: contentSpec.objective || null,
    },
    metrics: {
      impressions: null,
      likes: null,
      comments: null,
      reposts: null,
      saves: null,
      profileVisits: null,
      follows: null,
      ctr: null,
    },
    qualitativeSignals: {
      topCommentThemes: [],
      objections: [],
      strongSlideNumbers: [],
      weakSlideNumbers: [],
    },
    nextIteration: {
      keep: [],
      improve: [],
      testNext: [],
      nextVariantSlug: null,
    },
  };

  writeFileSync(performancePath, JSON.stringify(template, null, 2));
  console.log(`Performance log scaffold created: ${performancePath}`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/init_performance_log.js <content-spec.json>');
  process.exit(1);
}

try {
  run(args[0]);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
