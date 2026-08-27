/**
 * Rebuild every FunnyFy brand asset from a single source render of the logo.
 *
 *   node scripts/build-brand-assets.js <path-to-logo-on-black.png>
 *
 * The source is expected to be the mark on a black (or near-black) background, as
 * produced by an image generator. Black is keyed out to real transparency so the
 * mark can sit on any surface, then each output is composited at the scale that
 * platform expects:
 *
 *   logo-mark.png     transparent, tight crop  - in-app use (home header lockup)
 *   splash-logo.png   1024, mark at 54% height - expo-splash-screen
 *   icon.png          1024, mark at 71% height - store / launcher icon
 *   adaptive-icon.png 1024, mark at 55% height - Android adaptive foreground; small
 *                                                enough to survive the circular crop
 *
 * Re-run `npx expo prebuild --platform android` afterwards: the native project keeps
 * its own baked copies of the splash and launcher images.
 */
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const BG = { r: 11, g: 15, b: 25 }; // DARK_BG #0B0F19

// Alpha ramp. LO must clear the source background: generated art often has faint
// texture or noise in the "black" area that would otherwise key in as grey haze.
const ALPHA_LO = 34;
const ALPHA_HI = 70;

const CANVAS = 1024;
const COMPOSITES = [
  { file: 'splash-logo.png', heightFraction: 0.544 },
  { file: 'icon.png', heightFraction: 0.712 },
  { file: 'adaptive-icon.png', heightFraction: 0.554 },
];

/**
 * Keep only the largest connected blob of the alpha mask.
 *
 * Generated art tends to carry faint texture in its "black" area with occasional
 * specks as bright as the mark's own soft edges, so no threshold separates them.
 * The mark is one big body and the noise is scattered dust, so connectivity does.
 */
function keepLargestBlob(rgba, W, H) {
  const seen = new Uint8Array(W * H);
  const solid = (p) => rgba[p * 4 + 3] > 10;
  let best = null;

  for (let start = 0; start < W * H; start++) {
    if (seen[start] || !solid(start)) continue;
    const blob = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop();
      blob.push(p);
      const x = p % W;
      const y = (p - x) / W;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const n = ny * W + nx;
          if (seen[n] || !solid(n)) continue;
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    if (!best || blob.length > best.length) best = blob;
  }

  if (!best) throw new Error('no mark found in source - is it darker than ALPHA_LO?');

  const keep = new Uint8Array(W * H);
  for (const p of best) keep[p] = 1;
  let dropped = 0;
  for (let p = 0; p < W * H; p++) {
    if (keep[p] || rgba[p * 4 + 3] === 0) continue;
    rgba[p * 4] = 0;
    rgba[p * 4 + 1] = 0;
    rgba[p * 4 + 2] = 0;
    rgba[p * 4 + 3] = 0;
    dropped++;
  }
  return { kept: best.length, dropped };
}

/** Key the black background out to transparency and crop tight to the mark. */
async function extractMark(src) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const rgba = Buffer.alloc(W * H * 4);

  for (let i = 0; i < W * H * 4; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const v = Math.max(r, g, b);
    const a = Math.min(1, Math.max(0, (v - ALPHA_LO) / (ALPHA_HI - ALPHA_LO)));
    if (a <= 0) continue;

    // Un-premultiply: the art is composited over black, so soft edges are dimmed.
    // Dividing by alpha keeps them from fringing dark over a lighter background.
    rgba[i] = Math.min(255, Math.round(r / a));
    rgba[i + 1] = Math.min(255, Math.round(g / a));
    rgba[i + 2] = Math.min(255, Math.round(b / a));
    rgba[i + 3] = Math.round(a * 255);
  }

  const { kept, dropped } = keepLargestBlob(rgba, W, H);
  console.log(`keyed mark: ${kept} px kept, ${dropped} px of background noise dropped`);

  let left = W;
  let top = H;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (rgba[(y * W + x) * 4 + 3] > 10) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  const pad = 2;
  const box = {
    left: Math.max(0, left - pad),
    top: Math.max(0, top - pad),
  };
  box.width = Math.min(W - 1, right + pad) - box.left + 1;
  box.height = Math.min(H - 1, bottom + pad) - box.top + 1;

  const png = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract(box)
    .png()
    .toBuffer();
  return { png, width: box.width, height: box.height };
}

/** Column extents per row, to see where a following letter can tuck in. */
async function inkProfile(markPng) {
  const { data, info } = await sharp(markPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rows = [];
  for (const frac of [0.1, 0.25, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
    const y = Math.round(frac * (info.height - 1));
    let first = -1;
    let last = -1;
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 40) {
        if (first < 0) first = x;
        last = x;
      }
    }
    rows.push(
      `${(frac * 100).toFixed(0)}%: ${first < 0 ? '-' : (first / info.width).toFixed(2) + '..' + (last / info.width).toFixed(2)}`
    );
  }
  return rows.join('  ');
}

(async () => {
  const src = process.argv[2];
  if (!src) throw new Error('usage: node scripts/build-brand-assets.js <logo-on-black.png>');

  const mark = await extractMark(src);
  const aspect = mark.width / mark.height;
  console.log(`mark ${mark.width}x${mark.height}  aspect ${aspect.toFixed(3)}`);
  console.log('ink spans (fraction of width, by row):', await inkProfile(mark.png));

  const markPath = path.join(ASSETS, 'logo-mark.png');
  await sharp(mark.png).resize({ height: 512 }).png({ compressionLevel: 9 }).toFile(markPath);
  console.log('wrote logo-mark.png  512 tall,', Math.round(512 * aspect), 'wide');

  for (const { file, heightFraction } of COMPOSITES) {
    const h = Math.round(CANVAS * heightFraction);
    const w = Math.round(h * aspect);
    const layer = await sharp(mark.png).resize({ width: w, height: h, fit: 'contain' }).toBuffer();
    await sharp({ create: { width: CANVAS, height: CANVAS, channels: 4, background: { ...BG, alpha: 1 } } })
      .composite([{ input: layer, left: Math.round((CANVAS - w) / 2), top: Math.round((CANVAS - h) / 2) }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(ASSETS, file));
    console.log(`wrote ${file}  mark ${w}x${h} on ${CANVAS}x${CANVAS} #0B0F19`);
  }

  console.log(`\nheaderLogo in styles.js should be ${Math.round(26 * aspect)}x26 for this aspect.`);
})();
