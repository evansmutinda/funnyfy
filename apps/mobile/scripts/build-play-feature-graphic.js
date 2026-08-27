/**
 * Build Google Play feature graphic (1024×500) from logo-mark + style tiles.
 *   node scripts/build-play-feature-graphic.js
 */
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const W = 1024;
const H = 500;
const out = path.join(ASSETS, 'play-store-feature-graphic.png');
const markPath = path.join(ASSETS, 'logo-mark.png');

/** Four diverse categories — larger cards for Play banner */
const STYLE_TILES = [
  'comparisons/tiles/after/cartoons/ghibli.jpg',
  'comparisons/tiles/after/Paintings/Hokusai.jpg',
  'comparisons/tiles/after/3d/vinyl.jpg',
  'comparisons/tiles/after/photography/cinematic.jpg',
];

async function roundedTile(relPath, size, radius) {
  const src = path.join(ASSETS, relPath);
  const square = await sharp(src)
    .resize(size, size, { fit: 'cover', position: 'attention' })
    .png()
    .toBuffer();

  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/>
    </svg>`
  );

  // Thin light border so cards pop on dark bg
  const bordered = await sharp(square)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const ring = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="${size - 3}" height="${size - 3}" rx="${radius}" ry="${radius}"
        fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>
    </svg>`
  );

  return sharp(bordered)
    .composite([{ input: ring, blend: 'over' }])
    .png()
    .toBuffer();
}

async function main() {
  const card = 280;
  const radius = 32;
  const tiles = [];
  for (const rel of STYLE_TILES) {
    tiles.push(await roundedTile(rel, card, radius));
  }

  // Four larger cards — dominate the right half (stay inside 1024×500)
  const placements = [
    { left: 360, top: 85, rotate: -7 },
    { left: 495, top: 40, rotate: -2 },
    { left: 630, top: 60, rotate: 3 },
    { left: 755, top: 35, rotate: 7 },
  ];

  const composites = [];
  for (let i = 0; i < tiles.length; i++) {
    const p = placements[i];
    const rotated = await sharp(tiles[i])
      .rotate(p.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const meta = await sharp(rotated).metadata();

    const shadow = await sharp({
      create: {
        width: meta.width + 16,
        height: meta.height + 16,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.45 },
      },
    })
      .png()
      .blur(10)
      .toBuffer();

    composites.push({
      input: shadow,
      left: Math.max(0, p.left - 4),
      top: Math.max(0, p.top + 6),
    });
    composites.push({ input: rotated, left: p.left, top: p.top });
  }

  const markH = Math.round(H * 0.28);
  const mark = await sharp(markPath)
    .resize({ height: markH, fit: 'inside' })
    .png()
    .toBuffer();
  const markX = 40;
  const markY = 88;

  const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B0F19"/>
      <stop offset="50%" stop-color="#0F1524"/>
      <stop offset="100%" stop-color="#151B2E"/>
    </linearGradient>
    <linearGradient id="glow" x1="0.15" y1="0.2" x2="1" y2="0.8">
      <stop offset="0%" stop-color="#FF6B2C" stop-opacity="0.16"/>
      <stop offset="40%" stop-color="#C026FF" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#2F6BFF" stop-opacity="0.12"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="40" y="345" font-family="Segoe UI, Arial, sans-serif" font-size="52" font-weight="700" fill="#FFFFFF" letter-spacing="-1">FunnyFy</text>
  <text x="40" y="388" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="500" fill="#C8D0E0">AI photo styles in one place</text>
</svg>`);

  await sharp(svg)
    .composite([
      { input: mark, left: markX, top: markY },
      ...composites,
    ])
    .png()
    .toFile(out);

  const m = await sharp(out).metadata();
  console.log('wrote', out, `${m.width}x${m.height}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
