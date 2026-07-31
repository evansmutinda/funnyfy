#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Regenerate MD/PROMPTS.md from api/_utils/styles-config.ts (LEGACY_STYLES).
 *
 * Usage: node scripts/generate-prompts-md.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STYLES_CONFIG = path.join(ROOT, 'api/_utils/styles-config.ts');
const OUTPUT = path.join(ROOT, 'MD/PROMPTS.md');

const MODEL_LABELS = {
  'black-forest-labs/flux-kontext-pro': 'flux-kontext-pro (DEFAULT_MODEL)',
  'google/nano-banana': 'nano-banana',
  'google/nano-banana-2': 'nano-banana-2',
  'bytedance/seedream-4': 'seedream-4',
  'bytedance/seedream-4.5': 'seedream-4.5',
};

const CATEGORY_ORDER = [
  'moods-moments',
  'caricatures',
  'cartoons',
  'paintings',
  'art',
  '3d-characters',
  'sculptures',
  'anime-manga',
];

const CATEGORY_LABELS = {
  'moods-moments': 'Moods & Moments',
  caricatures: 'Caricatures',
  cartoons: 'Cartoons',
  paintings: 'Paintings',
  art: 'Art',
  '3d-characters': '3D Characters',
  sculptures: 'Sculptures',
  'anime-manga': 'Anime & Manga',
};

function extractLegacyBlock(source) {
  const start = source.indexOf('const LEGACY_STYLES');
  if (start < 0) throw new Error('LEGACY_STYLES not found');
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error('Could not parse LEGACY_STYLES block');
}

function splitTopLevelEntries(block) {
  const entries = [];
  let i = 0;
  while (i < block.length) {
    const keyMatch = block.slice(i).match(/^\s*(?:'([^']+)'|([\w-]+))\s*:\s*\{/);
    if (!keyMatch) {
      i++;
      continue;
    }
    const key = keyMatch[1] || keyMatch[2];
    const bodyStart = i + keyMatch.index + keyMatch[0].length - 1;
    let depth = 0;
    let j = bodyStart;
    for (; j < block.length; j++) {
      if (block[j] === '{') depth++;
      else if (block[j] === '}') {
        depth--;
        if (depth === 0) {
          entries.push({ key, body: block.slice(bodyStart + 1, j) });
          i = j + 1;
          break;
        }
      }
    }
    if (j >= block.length) break;
  }
  return entries;
}

function extractPrompt(body) {
  const idx = body.search(/prompt:\s*/);
  if (idx < 0) return '';
  let rest = body.slice(idx).replace(/^prompt:\s*/, '');
  const quote = rest[0];
  if (quote !== '"' && quote !== "'" && quote !== '`') return '';
  rest = rest.slice(1);
  let out = '';
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '\\') {
      out += rest[i + 1] || '';
      i += 1;
      continue;
    }
    if (rest[i] === quote) break;
    out += rest[i];
  }
  return out.trim();
}

function field(body, name) {
  if (name === 'prompt') return extractPrompt(body);
  const re = new RegExp(`${name}:\\s*(['\`])([\\s\\S]*?)\\1`, 'm');
  const m = body.match(re);
  if (m) return m[2].replace(/\\'/g, "'").trim();
  const re2 = new RegExp(`${name}:\\s*([^,\\n]+)`, 'm');
  const m2 = body.match(re2);
  return m2 ? m2[1].trim() : '';
}

function parseStyles(block) {
  return splitTopLevelEntries(block).map(({ key, body }) => {
    const modelsMatch = body.match(/models:\s*\[([^\]]*)\]/);
    const models = modelsMatch
      ? [...modelsMatch[1].matchAll(/([A-Z0-9_]+)/g)].map((m) => m[1])
      : [];
    return {
      id: field(body, 'id') || key,
      label: field(body, 'label'),
      categoryId: field(body, 'categoryId'),
      description: field(body, 'description'),
      prompt: field(body, 'prompt'),
      model: field(body, 'model'),
      models,
      enabled: !/enabled:\s*false/.test(body),
    };
  });
}

function modelLabel(model) {
  return MODEL_LABELS[model] || model;
}

function resolveModelLabels(style) {
  if (style.models?.length) {
    return style.models.map(modelLabel).join(' · ') + ' (random)';
  }
  return modelLabel(style.model);
}

function renderStyle(style) {
  const status = style.enabled ? '' : ' *(disabled)*';
  return [
    `#### \`${style.id}\` — ${style.label}${status}`,
    '',
    `- **Category:** ${style.categoryId}`,
    `- **Model:** ${resolveModelLabels(style)}`,
    ...(style.description ? [`- **Description:** ${style.description}`] : []),
    '',
    '```',
    style.prompt,
    '```',
    '',
  ].join('\n');
}

function main() {
  const source = fs.readFileSync(STYLES_CONFIG, 'utf8');
  const styles = parseStyles(extractLegacyBlock(source));
  const enabled = styles.filter((s) => s.enabled);
  const disabled = styles.filter((s) => !s.enabled);

  const byCategory = new Map();
  for (const style of enabled) {
    if (!byCategory.has(style.categoryId)) byCategory.set(style.categoryId, []);
    byCategory.get(style.categoryId).push(style);
  }

  const lines = [
    '# FunnyFy — Style prompts reference',
    '',
    '**Source of truth:** `api/_utils/styles-config.ts` → `LEGACY_STYLES`',
    '',
    'Regenerate this file after prompt changes:',
    '',
    '```bash',
    'node scripts/generate-prompts-md.js',
    '```',
    '',
    `**Last generated:** ${new Date().toISOString().slice(0, 10)} · **${enabled.length} enabled** · **${disabled.length} disabled** in LEGACY_STYLES`,
    '',
    'Prompts are server-side only — the mobile app never bundles them. When adding a style, copy/adapt a prompt here, then add it to `LEGACY_STYLES` and deploy staging.',
    '',
    'See also: `MD/STYLES.md`, `MD/ADDING_MORE_STYLES_GUIDE.md`.',
    '',
    '---',
    '',
    '## Models',
    '',
    '| Constant | Replicate model |',
    '|----------|-----------------|',
    '| `DEFAULT_MODEL` | `black-forest-labs/flux-kontext-pro` |',
    '| `NANO_BANANA` | `google/nano-banana` |',
    '| `NANO_BANANA_2` | `google/nano-banana-2` |',
    '| `SEEDREAM_4` | `bytedance/seedream-4` |',
    '| `SEEDREAM_4_5` | `bytedance/seedream-4.5` |',
    '',
    '---',
    '',
    '## Enabled prompts',
    '',
  ];

  for (const catId of CATEGORY_ORDER) {
    const group = byCategory.get(catId);
    if (!group?.length) continue;
    lines.push(`### ${CATEGORY_LABELS[catId] || catId}`, '');
    for (const style of group) {
      lines.push(renderStyle(style));
    }
  }

  if (disabled.length) {
    lines.push('---', '', '## Disabled (LEGACY_STYLES)', '');
    for (const style of disabled) {
      lines.push(renderStyle(style));
    }
  }

  lines.push(
    '---',
    '',
    '## Prompt tips',
    '',
    '- **Short prompts** work for many cartoon/art styles (`make this a …`).',
    '- **Caricatures** use longer, structured prompts (likeness, exaggeration, medium, background).',
    '- **Multi-subject** styles (`impasto`, ukiyo-e masters) mention detecting all faces/subjects.',
    '- **Composition:** many prompts end with `Full-bleed composition. No borders.`',
    '- **Catalog placeholders** (160 styles, `enabled: false`) use auto-generated placeholder prompts until you replace them in `LEGACY_STYLES`.',
    '',
  );

  fs.writeFileSync(OUTPUT, lines.join('\n'), 'utf8');
  console.log(`[generate-prompts-md] Wrote ${path.relative(ROOT, OUTPUT)} (${enabled.length} enabled)`);
}

main();
