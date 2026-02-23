/**
 * generate_imagen_assets.js
 *
 * Builds visual prompts for carousel slides and optionally generates images
 * using the Gemini/OpenAI-compatible image endpoint when GEMINI_API_KEY is set.
 *
 * Output:
 * - output/generated_images/<slug>/prompts.json
 * - output/generated_images/<slug>/slide_XX.png (when generation succeeds)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const OUTPUT_DIR = join(ROOT_DIR, 'output', 'generated_images');

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function toPlainText(text = '') {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .trim();
}

function buildImagePrompt(contentSpec, slide, index) {
  const primary = contentSpec.colorOverride?.primary || '#0A6C8F';
  const accent = contentSpec.colorOverride?.lightAccent || '#E6F7FB';
  const headline = toPlainText(slide.headline || '');
  const intro = toPlainText(slide.introText || '');
  const bullets = (slide.bullets || []).map(b => toPlainText(b)).slice(0, 3);
  const intent = [
    headline,
    intro,
    ...bullets,
  ].filter(Boolean).join(' | ');

  return [
    'Create a premium, clean LinkedIn carousel illustration in square 1:1 format.',
    'No text, no logos, no letters, no UI screenshots, no watermarks.',
    `Visual intent: ${intent}.`,
    'Style: editorial tech illustration, minimalist, modern, high-end, balanced composition.',
    `Color palette hint: primary ${primary}, soft accent ${accent}, navy neutrals, subtle gradients.`,
    'Composition: one central visual metaphor with supporting abstract elements; clear focal point.',
    'Lighting: soft studio light, polished and professional.',
    'Avoid clutter and avoid cartoon style.',
    `Slide index reference: ${index + 1}.`,
  ].join(' ');
}

async function fetchImageBytesFromResponse(data) {
  if (data?.data?.[0]?.b64_json) {
    return Buffer.from(data.data[0].b64_json, 'base64');
  }

  if (data?.data?.[0]?.url) {
    const imageRes = await fetch(data.data[0].url);
    if (!imageRes.ok) throw new Error(`Image URL fetch failed: ${imageRes.status}`);
    const arrayBuffer = await imageRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error('No image payload returned by API');
}

async function generateOneImage({ apiKey, model, prompt }) {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/images/generations';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Image API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return fetchImageBytesFromResponse(data);
}

async function run(contentSpecPath) {
  const fullPath = contentSpecPath.startsWith('/') || /^[A-Za-z]:/.test(contentSpecPath)
    ? contentSpecPath
    : join(process.cwd(), contentSpecPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Content spec not found: ${fullPath}`);
  }

  const contentSpec = loadJson(fullPath);
  const slugDir = join(OUTPUT_DIR, contentSpec.slug);
  if (!existsSync(slugDir)) mkdirSync(slugDir, { recursive: true });

  const prompts = [];
  for (let i = 0; i < contentSpec.slides.length; i++) {
    const slide = contentSpec.slides[i];
    if (slide.type !== 'body' && slide.type !== 'framing') continue;
    prompts.push({
      slideNumber: i + 1,
      type: slide.type,
      headline: toPlainText(slide.headline || ''),
      prompt: buildImagePrompt(contentSpec, slide, i),
    });
  }

  const promptsPath = join(slugDir, 'prompts.json');
  writeFileSync(promptsPath, JSON.stringify({
    slug: contentSpec.slug,
    model: process.env.IMAGEN_MODEL || 'imagen-4.0-fast-generate-001',
    generatedAt: new Date().toISOString(),
    prompts,
  }, null, 2));

  console.log(`Saved prompts: ${promptsPath}`);

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  const model = process.env.IMAGEN_MODEL || 'imagen-4.0-fast-generate-001';

  if (!apiKey) {
    console.log('No GEMINI_API_KEY/GOOGLE_API_KEY set. Prompt pack generated only.');
    return;
  }

  let successCount = 0;
  for (const item of prompts) {
    const outPath = join(slugDir, `slide_${String(item.slideNumber).padStart(2, '0')}.png`);
    try {
      const imageBytes = await generateOneImage({
        apiKey,
        model,
        prompt: item.prompt,
      });
      writeFileSync(outPath, imageBytes);
      successCount += 1;
      console.log(`Generated image: ${outPath}`);
    } catch (err) {
      console.warn(`Failed slide ${item.slideNumber}: ${err.message}`);
    }
  }

  console.log(`Image generation complete. Success: ${successCount}/${prompts.length}`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/generate_imagen_assets.js <content-spec.json>');
  process.exit(1);
}

run(args[0]).catch(err => {
  console.error(err.message);
  process.exit(1);
});
