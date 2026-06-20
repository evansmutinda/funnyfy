/**
 * Removes StyleSheet keys not referenced as `styles.<key>` in app source.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const stylesPath = path.join(ROOT, 'styles.js');
const FALSE_POS = new Set(['length', 'map', 'find', 'root', 'js']);

function collectSourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'scripts') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name) && entry.name !== 'styles.js') out.push(full);
  }
  return out;
}

function getUsedKeys(files) {
  const used = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(/styles\.(\w+)/g)) {
      if (!FALSE_POS.has(match[1])) used.add(match[1]);
    }
  }
  return used;
}

function extractStyleBlocks(source) {
  const createIdx = source.indexOf('StyleSheet.create({');
  if (createIdx === -1) throw new Error('StyleSheet.create not found');
  const bodyStart = source.indexOf('{', createIdx) + 1;
  let depth = 1;
  let bodyEnd = bodyStart;
  for (let i = bodyStart; i < source.length && depth > 0; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    if (depth === 0) {
      bodyEnd = i;
      break;
    }
  }

  const header = source.slice(0, bodyStart);
  const footer = source.slice(bodyEnd);
  const body = source.slice(bodyStart, bodyEnd);

  const blocks = [];
  const re = /(?:^|\n)(\s+)(\w+): \{/g;
  let match;
  while ((match = re.exec(body))) {
    const key = match[2];
    const start = match.index + (match[0].startsWith('\n') ? 1 : 0);
    let keyDepth = 0;
    let i = start;
    while (i < body.length) {
      if (body[i] === '{') keyDepth++;
      else if (body[i] === '}') {
        keyDepth--;
        if (keyDepth === 0) {
          i++;
          break;
        }
      }
      i++;
    }
    while (i < body.length && /[\s,]/.test(body[i])) i++;
    const text = body.slice(start, i).trimEnd().replace(/,\s*$/, '');
    blocks.push({ key, text });
  }

  return { header, footer, blocks };
}

const files = collectSourceFiles(ROOT);
const used = getUsedKeys(files);
const source = fs.readFileSync(stylesPath, 'utf8');
const { header, footer, blocks } = extractStyleBlocks(source);

const kept = blocks.filter((b) => used.has(b.key));
const removed = blocks.filter((b) => !used.has(b.key));

const body = kept.map((b) => b.text).join(',\n\n  ');
const next = `${header}\n  ${body}\n${footer}`;

fs.writeFileSync(stylesPath, next);
console.log(`Kept ${kept.length} / ${blocks.length} style keys (removed ${removed.length}).`);

const missing = [...used].filter((k) => !kept.some((b) => b.key === k));
if (missing.length) console.warn('Referenced but missing:', missing.join(', '));
