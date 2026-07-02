#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pairsSource = fs.readFileSync(
  path.join(ROOT, 'apps/mobile/data/comparisonPairs.js'),
  'utf8',
);
const genSource = fs.readFileSync(
  path.join(ROOT, 'apps/mobile/data/comparisonPairAssets.generated.js'),
  'utf8',
);
const constantsSource = fs.readFileSync(
  path.join(ROOT, 'apps/mobile/constants.js'),
  'utf8',
);

const IDS = ['pixel', 'comic', 'comic-v1', 'comic-v2', '3d-render-v1', '3d-render-v2'];

function toJpg(rel) {
  const slash = rel.replace(/\\/g, '/');
  const last = slash.lastIndexOf('/');
  const dir = last >= 0 ? slash.slice(0, last) : '';
  const file = last >= 0 ? slash.slice(last + 1) : slash;
  const dot = file.lastIndexOf('.');
  const stem = dot >= 0 ? file.slice(0, dot) : file;
  return dir ? `${dir}/${stem}.jpg` : `${stem}.jpg`;
}

function extractPair(id) {
  const re = new RegExp(`['"]?${id.replace(/-/g, '\\-')}['"]?\\s*:\\s*\\{[^}]+\\}`, 's');
  const m = pairsSource.match(re);
  if (!m) return null;
  const before = m[0].match(/before:\s*'([^']+)'/)[1];
  const after = m[0].match(/after:\s*'([^']+)'/)[1];
  return { before, after };
}

function extractConstantRequire(id) {
  const mapEntry = constantsSource.match(
    new RegExp(`['"]?${id.replace(/-/g, '\\-')}['"]?\\s*:\\s*STYLE_CARD_IMAGE_\\w+`),
  );
  const exportLine = constantsSource.match(
    new RegExp(`export const (STYLE_CARD_IMAGE_[A-Z0-9_]+)[^;]*${id.replace(/-/g, '[-_]?')}[^;]*;`, 'i'),
  );
  const constName = mapEntry ? mapEntry[0].split(':')[1].trim().replace(',', '') : null;
  let requirePath = null;
  if (constName) {
    const req = constantsSource.match(
      new RegExp(`export const ${constName} = require\\('([^']+)'\\)`),
    );
    requirePath = req ? req[1] : null;
  }
  return { constName, requirePath };
}

console.log('Style thumbnail verification (pixel = reference)\n');

for (const id of IDS) {
  const pair = extractPair(id);
  const constant = extractConstantRequire(id);
  const tileAfter = pair ? toJpg(pair.after) : null;
  const tileBefore = pair ? toJpg(pair.before) : null;
  const afterFile = constant.requirePath
    ? path.join(ROOT, 'apps/mobile', constant.requirePath.replace('./', ''))
    : null;
  const afterExists = afterFile ? fs.existsSync(afterFile) : false;
  const afterSize = afterExists ? fs.statSync(afterFile).size : 0;
  const inGenAfter = tileAfter ? genSource.includes(`'${tileAfter}'`) : false;
  const inGenBefore = tileBefore ? genSource.includes(`'${tileBefore}'`) : false;

  console.log(`[${id}]`);
  console.log('  pair:', pair);
  console.log('  constant:', constant);
  console.log('  tile after file:', afterFile, afterExists ? `${afterSize} bytes` : 'MISSING');
  console.log('  in generated map:', { after: inGenAfter, before: inGenBefore });
  console.log('');
}
