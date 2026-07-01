#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * generate-comparison-set.js
 *
 * Runs each "before" reference photo through every enabled FunnyFy style
 * via the existing /api/enqueue + /api/job pipeline, downloads the
 * results, and saves them as bundled mobile assets:
 *
 *   apps/mobile/assets/comparisons/after/<categoryFolder>/<afterBase>.jpg
 *
 * After it finishes, register the curated pairs in
 *   apps/mobile/data/comparisonPairs.js  →  CURATED_PAIRS
 *
 * Usage:
 *   node scripts/generate-comparison-set.js
 *
 * Required environment variables:
 *   API_BASE       Backend URL (e.g. https://funnyfy-staging.vercel.app)
 *   AUTH_TOKEN     JWT for an account that has quota
 *
 * Optional:
 *   BEFORE_DIR     Default: apps/mobile/assets/comparisons/before
 *   OUTPUT_DIR     Default: apps/mobile/assets/comparisons
 *   STYLE_FILTER   Comma-separated style ids to limit the run
 *   CONCURRENCY    Default: 2 (don't push this hard — you'll hit rate limits)
 *   POLL_TIMEOUT_S Default: 120 (per job)
 *   SKIP_EXISTING  Default: 1 — set to 0 to re-generate even when a file exists
 *
 * Cost note:
 *   ~$0.04 per generation on flux-kontext-pro, ~$0.03 on nano-banana.
 *   N enabled styles × M before photos = N*M generations.
 */

const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULTS = {
  BEFORE_DIR: path.join(ROOT, 'apps/mobile/assets/comparisons/before'),
  OUTPUT_DIR: path.join(ROOT, 'apps/mobile/assets/comparisons/after'),
  CONCURRENCY: 2,
  POLL_INTERVAL_MS: 2000,
  POLL_TIMEOUT_S: 120,
  SKIP_EXISTING: 1,
};

/** Maps catalog categoryId → folder under comparisons/after/ */
const AFTER_CATEGORY_DIR = {
  caricatures: 'caricature',
  cartoons: 'cartoons',
  '3d-characters': '3d',
  paintings: 'Paintings',
  'anime-manga': 'Anime',
};

/** Output basename per style when it differs from the before filename. */
const STYLE_AFTER_BASENAME = {
  handd: 'handd',
  carc1: 'carc1',
  '90s-cartoon': 'toon',
  chibi: 'chibi',
  'classic-v1': 'classic',
  'classic-v2': 'classicv2',
  'saturday-v1': 'smv1',
  'saturday-v2': 'smv2',
  comic: 'comic',
  cute: 'cute',
  dc: 'dc',
  'cyberpunk-v1': 'cyberpunkv1',
  'cyberpunk-v2': 'cyberpunkv2',
  disney: 'disney',
  '3dclay': '3dclay',
  'pixar-like': 'pxl',
  'oil-paint': 'oilpaint',
  'water-color': 'wc',
  acrylic: 'Acrylic',
  gouache: 'Gouache',
  expressionist: 'Expressionist',
  impressionist: 'Impressionist',
  baroque: 'Baroque',
  'van-gogh': 'van-gogh',
  monet: 'monet',
  renoir: 'Renoir',
  cezanne: 'Cézanne',
  gauguin: 'Gauguin',
  matisse: 'Matisse',
  seurat: 'Seurat',
  'ink-wash': 'Ink-Wash',
  impasto: 'Impasto',
  'hokusai-v1': 'Hokusai',
  'hokusai-v2': 'Hokusai2',
  hiroshige: 'Hiroshige',
  sesshu: 'Sesshū',
};

const env = {
  API_BASE: process.env.API_BASE,
  AUTH_TOKEN: process.env.AUTH_TOKEN,
  BEFORE_DIR: process.env.BEFORE_DIR || DEFAULTS.BEFORE_DIR,
  OUTPUT_DIR: process.env.OUTPUT_DIR || DEFAULTS.OUTPUT_DIR,
  STYLE_FILTER: process.env.STYLE_FILTER
    ? new Set(process.env.STYLE_FILTER.split(',').map((s) => s.trim()).filter(Boolean))
    : null,
  CONCURRENCY: Number(process.env.CONCURRENCY || DEFAULTS.CONCURRENCY),
  POLL_TIMEOUT_S: Number(process.env.POLL_TIMEOUT_S || DEFAULTS.POLL_TIMEOUT_S),
  SKIP_EXISTING: Number(process.env.SKIP_EXISTING ?? DEFAULTS.SKIP_EXISTING),
};

function assertEnv() {
  const missing = [];
  if (!env.API_BASE) missing.push('API_BASE');
  if (!env.AUTH_TOKEN) missing.push('AUTH_TOKEN');
  if (missing.length) {
    console.error(`[generate-comparison-set] Missing env vars: ${missing.join(', ')}`);
    console.error('Get a token by POSTing to /api/auth/token from a dev account.');
    process.exit(1);
  }
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.AUTH_TOKEN}`,
  };
}

async function fetchEnabledStyles() {
  const res = await fetch(`${env.API_BASE}/api/styles`);
  if (!res.ok) {
    throw new Error(`/api/styles returned ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  const list = json?.styles || json?.data || json;
  if (!Array.isArray(list)) {
    throw new Error('Could not parse /api/styles response (expected array of styles)');
  }
  return list
    .filter((s) => s.enabled !== false)
    .filter((s) => (env.STYLE_FILTER ? env.STYLE_FILTER.has(s.id) : true));
}

async function readBeforeImages() {
  let entries;
  try {
    entries = await fs.readdir(env.BEFORE_DIR, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(
        `Before directory not found: ${env.BEFORE_DIR}\n` +
          `Create it and add 4-8 reference face photos (.jpg/.png), then re-run.`,
      );
    }
    throw err;
  }
  const files = entries
    .filter((e) => e.isFile() && /\.(jpe?g|png|webp)$/i.test(e.name))
    .map((e) => path.join(env.BEFORE_DIR, e.name));
  if (files.length === 0) {
    throw new Error(`No image files in ${env.BEFORE_DIR}`);
  }
  return files;
}

function basename(filePath) {
  return path.basename(filePath).replace(/\.[^.]+$/, '');
}

function extToMime(ext) {
  const lower = ext.toLowerCase();
  if (lower === '.png') return 'image/png';
  if (lower === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function fileToDataUrl(filePath) {
  const buf = await fs.readFile(filePath);
  const mime = extToMime(path.extname(filePath));
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function enqueueJob(styleId, imageDataUrl) {
  const res = await fetch(`${env.API_BASE}/api/enqueue`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ payload: { styleId, imageUrl: imageDataUrl } }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Enqueue returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok || !json?.ok || !json?.jobId) {
    throw new Error(
      `Enqueue failed (${res.status}) for style=${styleId}: ${json?.error || json?.message || text}`,
    );
  }
  return json.jobId;
}

async function pollJob(jobId) {
  const deadline = Date.now() + env.POLL_TIMEOUT_S * 1000;
  while (Date.now() < deadline) {
    await sleep(DEFAULTS.POLL_INTERVAL_MS);
    const res = await fetch(`${env.API_BASE}/api/job?id=${encodeURIComponent(jobId)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Poll failed (${res.status}): ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    const status = json?.job?.status || json?.status;
    if (status === 'completed') {
      const url = json?.job?.output_image_url || json?.output_image_url || json?.job?.outputImageUrl;
      if (!url) throw new Error(`Job ${jobId} completed but has no output_image_url`);
      return url;
    }
    if (status === 'failed') {
      throw new Error(`Job ${jobId} failed: ${json?.job?.error_message || json?.error_message || 'unknown'}`);
    }
  }
  throw new Error(`Job ${jobId} did not complete within ${env.POLL_TIMEOUT_S}s`);
}

async function downloadTo(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buf);
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processPair(style, beforePath) {
  const categoryDir = AFTER_CATEGORY_DIR[style.categoryId];
  if (!categoryDir) {
    throw new Error(`No after/ folder mapped for categoryId=${style.categoryId}`);
  }

  const fileBase = STYLE_AFTER_BASENAME[style.id] || basename(beforePath);
  const outPath = path.join(env.OUTPUT_DIR, categoryDir, `${fileBase}.jpg`);

  if (env.SKIP_EXISTING && (await fileExists(outPath))) {
    return { skipped: true, outPath };
  }

  const dataUrl = await fileToDataUrl(beforePath);
  const jobId = await enqueueJob(style.id, dataUrl);
  const outputUrl = await pollJob(jobId);
  await downloadTo(outputUrl, outPath);
  return { skipped: false, outPath, jobId };
}

async function runQueue(tasks, concurrency) {
  const results = [];
  let cursor = 0;
  let inFlight = 0;
  return new Promise((resolve) => {
    const launch = () => {
      while (inFlight < concurrency && cursor < tasks.length) {
        const idx = cursor++;
        inFlight++;
        const task = tasks[idx];
        (async () => {
          const t0 = Date.now();
          try {
            const r = await processPair(task.style, task.beforePath);
            const ms = Date.now() - t0;
            results.push({ ok: true, ...task, ...r, ms });
            const tag = r.skipped ? 'SKIP' : 'OK  ';
            console.log(
              `[${tag}] ${task.style.id.padEnd(28)} ${basename(task.beforePath).padEnd(22)} ${ms}ms`,
            );
          } catch (err) {
            const ms = Date.now() - t0;
            results.push({ ok: false, ...task, error: err.message, ms });
            console.warn(
              `[FAIL] ${task.style.id.padEnd(28)} ${basename(task.beforePath).padEnd(22)} ${ms}ms — ${err.message}`,
            );
          } finally {
            inFlight--;
            if (cursor >= tasks.length && inFlight === 0) resolve(results);
            else launch();
          }
        })();
      }
    };
    launch();
  });
}

async function main() {
  assertEnv();

  console.log('[generate-comparison-set] Fetching enabled styles…');
  const styleList = await fetchEnabledStyles();
  console.log(`[generate-comparison-set] ${styleList.length} enabled styles`);

  console.log(`[generate-comparison-set] Reading before images from ${env.BEFORE_DIR}`);
  const beforeImages = await readBeforeImages();
  console.log(`[generate-comparison-set] ${beforeImages.length} before images`);

  const tasks = [];
  for (const style of styleList) {
    for (const beforePath of beforeImages) {
      tasks.push({ style, beforePath });
    }
  }
  console.log(`[generate-comparison-set] ${tasks.length} pairs to process (concurrency=${env.CONCURRENCY})`);
  console.log(`[generate-comparison-set] Output → ${env.OUTPUT_DIR}\n`);

  const t0 = Date.now();
  const results = await runQueue(tasks, env.CONCURRENCY);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  const okCount = results.filter((r) => r.ok && !r.skipped).length;
  const skipCount = results.filter((r) => r.ok && r.skipped).length;
  const failCount = results.filter((r) => !r.ok).length;

  console.log('\n─────────────────────────────────────────');
  console.log(`Done in ${elapsed}s`);
  console.log(`  ✅ Generated: ${okCount}`);
  console.log(`  ⏭️  Skipped (already existed): ${skipCount}`);
  console.log(`  ❌ Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFailures:');
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  - ${r.style.id} / ${basename(r.beforePath)} → ${r.error}`);
    }
    console.log('\nRetry just the failures with SKIP_EXISTING=1 (default) and a STYLE_FILTER.');
  }

  console.log(
    '\nNext: open apps/mobile/data/comparisonPairs.js and register the new pairs in CURATED_PAIRS,\n' +
      'then rebuild the APK to ship the assets.',
  );
}

main().catch((err) => {
  console.error('[generate-comparison-set] Fatal:', err);
  process.exit(1);
});
