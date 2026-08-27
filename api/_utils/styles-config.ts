// Styles configuration - protected on server
// Catalog: 160 styles from Funnyfy_Categories_Updated.xlsx (placeholders, disabled by default)
// Live styles: LEGACY_STYLES in this file (prompts, models, enabled flag)
//
// >>> Add new enabled styles to LEGACY_STYLES below. <<<
// Single source of truth — all API routes import from this file.

import { STYLE_CATALOG } from './style-catalog';

export interface StyleConfig {
  id: string;
  label: string;
  categoryId: string;
  description?: string;
  prompt: string;
  /** Primary model (cost estimates + fallback). */
  model: string;
  /** Optional pool — process-job picks one at random per generation. */
  models?: string[];
  /**
   * Optional style template image (public path or absolute URL).
   * Sent as image_input[0]; the user's photo is image_input[1].
   * Example: `style-refs/caricatures/mugface.png` → served from /public on Vercel.
   */
  referenceImage?: string;
  premium?: boolean;
  enabled?: boolean;
  /**
   * Oldest app semver that includes assets/UI for this style.
   * Older clients omit the style from `/api/styles` (see app-version.ts).
   * Ship the APK first, then set this when enabling the style.
   */
  minAppVersion?: string;
}

/** Models available for a style (pool or single primary). */
export function getStyleModels(style: StyleConfig): string[] {
  if (Array.isArray(style.models) && style.models.length > 0) {
    return style.models;
  }
  return style.model ? [style.model] : [];
}

/** Pick a model for this generation (random from pool when set). */
export function resolveStyleModel(style: StyleConfig): string {
  const pool = getStyleModels(style);
  if (pool.length === 0) {
    throw new Error(`Style ${style.id} has no model configured`);
  }
  if (pool.length === 1) return pool[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Public HTTPS URL for a style's bundled reference/template image. */
export function resolveStyleReferenceUrl(style: StyleConfig): string | null {
  const ref = style.referenceImage?.trim();
  if (!ref) return null;
  if (/^https?:\/\//i.test(ref)) return ref;

  const base =
    process.env.STYLE_ASSETS_BASE_URL?.replace(/\/$/, '') ||
    process.env.PUBLIC_BASE_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!base) {
    console.warn('[styles] No STYLE_ASSETS_BASE_URL / VERCEL_URL for reference image', style.id);
    return null;
  }

  return `${base}/${ref.replace(/^\//, '')}`;
}

const DEFAULT_MODEL = 'black-forest-labs/flux-kontext-pro';
const NANO_BANANA = 'google/nano-banana';
const NANO_BANANA_2 = 'google/nano-banana-2';
const SEEDREAM_4 = 'bytedance/seedream-4';
const SEEDREAM_4_5 = 'bytedance/seedream-4.5';

function placeholderPrompt(label: string): string {
  return (
    `Transform this photo into a ${label} caricature. ` +
    `Preserve facial likeness with playful exaggeration. ` +
    `Style: ${label}. Full-bleed composition. No borders.`
  );
}

function catalogPlaceholders(): Record<string, StyleConfig> {
  return Object.fromEntries(
    STYLE_CATALOG.map((entry) => [
      entry.id,
      {
        id: entry.id,
        label: entry.label,
        categoryId: entry.categoryId,
        description: `${entry.label} — coming soon`,
        prompt: placeholderPrompt(entry.label),
        model: DEFAULT_MODEL,
        enabled: false,
        premium: false,
      },
    ]),
  );
}


const STICKER_PROMPT_BASE =
  "Create a premium Pixar-style 3D sticker of the exact same person from the uploaded image, using the uploaded photo as the only facial reference. Preserve the person's exact facial structure, hairstyle, grooming details, skin tone, proportions, and all unique identifying features with very high likeness accuracy. Do not over-beautify, heavily stylize, or alter identity beyond recognition.\n\nOutput a single sticker only — not a grid, collage, or sheet. Use a 1:1 square composition suitable for a digital sticker (tight head-and-shoulders portrait only; no full-body or mid-body). Place the character on a fully transparent background. Use a clean die-cut silhouette with a smooth rounded bottom / semi-curved sticker base. Optional: a very subtle soft drop shadow under the figure only (no floor, no cream backdrop, no scene).\n\nRender in a high-end Pixar-inspired 3D animation style with glossy shading, soft global illumination, detailed facial textures, bold clean outlines, and slightly exaggerated cartoon proportions. Use soft studio lighting with subtle rim light so the sticker reads clearly at small size. Dress the subject in modern casual clothing with a slightly stylized fashion look — clean, minimal, and sticker-friendly. No text, logos, watermarks, or extra characters.";

type StickerExpression = {
  id: string;
  label: string;
  expression: string;
  /**
   * Optional extra prompt for this expression (pose, face, props, etc.).
   * - Fragment → `Use thinking expression, mouth closed, …`
   * - Full line starting with `Use ` → used as-is (single stickers)
   */
  detail?: string;
  /** Defaults to NANO_BANANA when omitted. */
  model?: string;
};

function stickerExpressionInstruction(item: StickerExpression): string {
  const name = item.expression || item.label;
  const extra = item.detail?.trim();
  if (!extra) return `Use ${name} expression.`;
  if (/^use\s/i.test(extra)) {
    return extra.endsWith('.') ? extra : `${extra}.`;
  }
  return `Use ${name.toLowerCase()} expression, ${extra}.`;
}

function stickerSheetCellLine(item: StickerExpression | undefined, id: string, index: number): string {
  if (!item) return `${index + 1}. ${id}`;
  const name = item.expression || item.label || id;
  const extra = item.detail?.trim();
  if (!extra) return `${index + 1}. ${name}`;
  const sheetDetail = /^use\s/i.test(extra)
    ? extra.replace(/^use\s+/i, '').replace(/\.$/, '')
    : extra;
  return `${index + 1}. ${name} — ${sheetDetail}`;
}

const STICKER_EXPRESSIONS: StickerExpression[] = [
  {
    "id": "angry",
    "label": "Angry",
    "expression": "Angry"
  },
  {
    "id": "bored",
    "label": "Bored",
    "expression": "Bored"
  },
  {
    "id": "celebrate",
    "label": "Celebrate",
    "expression": "Celebrate"
  },
  {
    "id": "confused",
    "label": "Confused",
    "expression": "Confused"
  },
  {
    "id": "cool",
    "label": "Cool",
    "expression": "Cool"
  },
  {
    "id": "crying",
    "label": "Crying",
    "expression": "Crying"
  },
  {
    "id": "disgusted",
    "label": "Disgusted",
    "expression": "Disgusted"
  },
  {
    "id": "excited",
    "label": "Excited",
    "expression": "Excited",
    "detail": "eyes opened very wide with intense joyful energy, eyebrows raised high, mouth opened extremely wide in a huge genuine grin, upper and lower teeth clearly visible, cheeks lifted, face slightly stretched by excitement, conveying overwhelming happiness, surprise, and anticipation"
  },
  {
    "id": "eyeroll",
    "label": "Eye Roll",
    "expression": "Eyeroll",
    "detail": "both eyes rolled dramatically upward, with the pupils positioned high toward the upper eyelids; slightly lowered eyelids, raised eyebrows, subtly pursed lips, and an unmistakable \"seriously?\" / \"here we go again\" attitude. Add a slight head tilt and an expressive, unimpressed posture to reinforce the emotion",
    "model": NANO_BANANA_2
  },
  {
    "id": "facepalm",
    "label": "Facepalm",
    "expression": "Facepalm"
  },
  {
    "id": "happy",
    "label": "Happy",
    "expression": "Happy"
  },
  {
    "id": "laughing",
    "label": "Laughing",
    "expression": "Laughing"
  },
  {
    "id": "love",
    "label": "Love",
    "expression": "Love",
    "detail": "Use love with heart eyes expression. use the heart sign with hands, have heart signs on the eyes"
  },
  {
    "id": "mind-blown",
    "label": "Mind Blown",
    "expression": "Mind Blown"
  },
  {
    "id": "need-coffee",
    "label": "Need Coffee",
    "expression": "Need Coffee",
    "detail": "Use funny 'need coffee' expression."
  },
  {
    "id": "nervous",
    "label": "Nervous",
    "expression": "Nervous"
  },
  {
    "id": "proud",
    "label": "Proud",
    "expression": "Proud"
  },
  {
    "id": "sad",
    "label": "Sad",
    "expression": "Sad"
  },
  {
    "id": "sarcastic",
    "label": "Sarcastic",
    "expression": "Sarcastic"
  },
  {
    "id": "scared",
    "label": "Scared",
    "expression": "Scared"
  },
  {
    "id": "shocked",
    "label": "Shocked",
    "expression": "Shocked"
  },
  {
    "id": "skeptical",
    "label": "Skeptical",
    "expression": "Skeptical"
  },
  {
    "id": "sleepy",
    "label": "Sleepy",
    "expression": "Sleepy",
    "detail": "Use sleepy expression. add 'zzzz'"
  },
  {
    "id": "smirk",
    "label": "Smirk",
    "expression": "Smirk"
  },
  {
    "id": "sorry",
    "label": "Sorry",
    "expression": "Sorry"
  },
  {
    "id": "surprised",
    "label": "Surprised",
    "expression": "Surprised"
  },
  {
    "id": "thinking",
    "label": "Thinking",
    "expression": "Thinking",
    "detail": "mouth closed, eyes looking up-sideways, fingers on chin (thinking stance)"
  },
  {
    "id": "thumbs-down",
    "label": "Thumbs Down",
    "expression": "Thumbs Down"
  },
  {
    "id": "thumbs-up",
    "label": "Thumbs Up",
    "expression": "Thumbs Up"
  },
  {
    "id": "wink",
    "label": "Wink",
    "expression": "Wink"
  }
];

export const STICKER_SHEET_STYLE_ID = 'sticker-sheet';

export function parseSheetExpressions(raw: string | null | undefined): string[] {
  return String(raw || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function stickerSheetGrid(count: number): { cols: number; rows: number } {
  if (count === 4) return { cols: 2, rows: 2 };
  if (count === 12) return { cols: 3, rows: 4 };
  return { cols: 3, rows: 3 };
}

export function buildStickerSheetPrompt(expressionIds: string[]): string {
  const count = expressionIds.length;
  const { cols, rows } = stickerSheetGrid(count);
  const square = cols === rows;
  const composition = square
    ? 'Use a 1:1 square composition filling the entire image.'
    : `Use a ${cols}:${rows} portrait composition filling the entire image.`;
  const lines = expressionIds.map((id, index) => {
    const meta = STICKER_EXPRESSIONS.find((item) => item.id === id);
    return stickerSheetCellLine(meta, id, index);
  });

  return `Create a premium Pixar-style 3D sticker sheet of the exact same person from the uploaded image, using the uploaded photo as the only facial reference. Preserve the person's exact facial structure, hairstyle, grooming details, skin tone, proportions, and all unique identifying features with very high likeness accuracy. Do not over-beautify, heavily stylize, or alter identity beyond recognition.

Output one sticker sheet only — a ${cols}×${rows} grid of exactly ${count} die-cut stickers. Same person in every cell. Even gutters, identical cell size, aligned rows and columns, no labels, no captions, no numbers, no text, no collage bleed, no extra characters. ${composition} Place every character on a fully transparent or plain off-white background. Each cell is a clean die-cut silhouette with a smooth rounded bottom / semi-curved sticker base. Optional: a very subtle soft drop shadow under each figure only (no floor, no scene).

Render in a high-end Pixar-inspired 3D animation style with glossy shading, soft global illumination, detailed facial textures, bold clean outlines, and slightly exaggerated cartoon proportions. Use soft studio lighting with subtle rim light so each sticker reads clearly at small size. Dress each cell in modern casual clothing with a slightly stylized fashion look — clean, minimal, and sticker-friendly. Clothing may vary by cell. No text, logos, watermarks, or extra characters.

Grid, left to right, top to bottom:
${lines.join('\n')}`;
}

const STICKER_SHEET_STYLE: StyleConfig = {
  id: STICKER_SHEET_STYLE_ID,
  label: 'Sticker pack',
  categoryId: 'stickers',
  description: 'Pixar-style 3D sticker sheet',
  prompt: buildStickerSheetPrompt(['happy', 'laughing', 'cool', 'angry', 'surprised', 'thinking', 'love', 'wink', 'thumbs-up']),
  model: NANO_BANANA,
  enabled: true,
  premium: false,
};

function buildStickerStyles(): Record<string, StyleConfig> {
  return Object.fromEntries(
    STICKER_EXPRESSIONS.map((item) => [
      item.id,
      {
        id: item.id,
        label: item.label,
        categoryId: 'stickers',
        description: `Pixar-style 3D die-cut sticker — ${item.expression} expression`,
        prompt: `${STICKER_PROMPT_BASE}\n\n${stickerExpressionInstruction(item)}`,
        model: item.model || NANO_BANANA,
        enabled: true,
        premium: false,
      },
    ]),
  );
}

/** Live styles — not in spreadsheet IDs; kept for backward compatibility with jobs/gallery */
const LEGACY_STYLES: Record<string, StyleConfig> = {
  '80s-cartoon': {
    id: '80s-cartoon',
    label: '80s',
    categoryId: 'cartoons',
    description: 'Classic 80s animated cartoon style',
    prompt: 'Make this a 80s cartoon. no text.',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'video-game-i': {
    id: 'video-game-i',
    label: 'Video game V1',
    categoryId: 'cartoons',
    description:
      'Stylized urban video-game character illustration with bold linework, cinematic lighting, and strong facial likeness',
    prompt:
      "Using the uploaded photo as the sole reference, transform the subject into a stylized gta san andreas inspired character illustration. Preserve the subject's recognizable identity, facial structure, hairstyle, skin tone, body proportions, clothing, and distinctive features with strong likeness accuracy.\n\nUse bold graphic shapes, exaggerated but believable facial features, sharp clean linework, dramatic cinematic lighting, saturated colors, strong shadows, subtle texture, and a polished illustrated finish. Give the character a confident, expressive, larger-than-life appearance while keeping the original pose and clothing recognizable.\n\nCreate a dynamic, poster-like composition with a gritty urban-game atmosphere, dramatic perspective, crisp details, and a high-end digitally painted finish. Do not add logos, text, game titles, recognizable characters, or specific copyrighted artwork. Keep the background simple and non-distracting so the subject remains the focus.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'video-game-ii': {
    id: 'video-game-ii',
    label: 'Video game V2',
    categoryId: 'cartoons',
    description:
      'Stylized modern urban video-game character illustration with bold linework, cinematic lighting, and strong facial likeness',
    prompt:
      "Using the uploaded photo as the sole reference, transform the subject into a stylized gta v inspired character illustration. Preserve the subject's recognizable identity, facial structure, hairstyle, skin tone, body proportions, clothing, and distinctive features with strong likeness accuracy.\n\nUse bold graphic shapes, exaggerated but believable facial features, sharp clean linework, dramatic cinematic lighting, saturated colors, strong shadows, subtle texture, and a polished illustrated finish. Give the character a confident, expressive, larger-than-life appearance while keeping the original pose and clothing recognizable.\n\nCreate a dynamic, poster-like composition with a gritty urban-game atmosphere, dramatic perspective, crisp details, and a high-end digitally painted finish. Do not add logos, text, game titles, recognizable characters, or specific copyrighted artwork. Keep the background simple and non-distracting so the subject remains the focus.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  '90s-cartoon': {
    id: '90s-cartoon',
    label: '90s',
    categoryId: 'cartoons',
    description: 'Classic 90s animated cartoon style',
    prompt: 'Make this a 90s cartoon',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  chibi: {
    id: 'chibi',
    label: 'Chibi',
    categoryId: 'cartoons',
    description: 'Cute, big-head chibi cartoon style',
    prompt: 'Make this a chibi cartoon, maintaining posture and facial features',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'classic-v1': {
    id: 'classic-v1',
    label: 'Classic V1',
    categoryId: 'cartoons',
    description: 'Classic cartoon style with timeless animated character appeal',
    prompt: 'make this a Classic Cartoon',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  'classic-v2': {
    id: 'classic-v2',
    label: 'Classic V2',
    categoryId: 'cartoons',
    description: 'Classic cartoon style with bold lines and expressive character design',
    prompt: 'make this a Classic Cartoon',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  'saturday-v1': {
    id: 'saturday-v1',
    label: 'Saturday V1',
    categoryId: 'cartoons',
    description: 'Saturday morning cartoon style with bright colors and playful energy',
    prompt: 'make this a Saturday Morning Cartoon',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  'saturday-v2': {
    id: 'saturday-v2',
    label: 'Saturday V2',
    categoryId: 'cartoons',
    description: 'Saturday morning cartoon style with bold outlines and cheerful animation',
    prompt: 'make this a Saturday Morning Cartoon',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  comic: {
    id: 'comic',
    label: 'Comic',
    categoryId: 'cartoons',
    description: 'Comic cartoon style with bold ink lines and expressive character art',
    prompt: 'make this a comic Cartoon',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  cute: {
    id: 'cute',
    label: 'Cute',
    categoryId: 'cartoons',
    description: 'Cute cartoon style with soft shapes and adorable character charm',
    prompt: 'make this a cute Cartoon',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'cyberpunk-v1': {
    id: 'cyberpunk-v1',
    label: 'Cyberpunk V1',
    categoryId: 'cartoons',
    description: 'Cyberpunk cartoon style with neon-lit futuristic character design',
    prompt: 'make this a cyberpunk style cartoon, no extra text',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'cyberpunk-v2': {
    id: 'cyberpunk-v2',
    label: 'Cyberpunk V2',
    categoryId: 'cartoons',
    description: 'Cyberpunk cartoon style with bold sci-fi edges and vivid neon color',
    prompt: 'make this a cyberpunk style cartoon, no extra text',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  disney: {
    id: 'disney',
    label: 'Animated',
    categoryId: 'cartoons',
    description: 'Classic animated cartoon with soft features and charming character design',
    prompt: 'make this an animated cartoon with soft features, no extra text',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  ghibli: {
    id: 'ghibli',
    label: 'Ghibli',
    categoryId: 'cartoons',
    description: 'Studio Ghibli-style cartoon',
    prompt: 'make this a ghibli cartoon',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  pixel: {
    id: 'pixel',
    label: 'Pixel',
    categoryId: 'cartoons',
    description: 'Pixel cartoon style with retro game-art charm',
    prompt: 'make this a pixel cartoon',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  '3d-render-v1': {
    id: '3d-render-v1',
    label: '3D Render V1',
    categoryId: 'cartoons',
    description: '3D rendered art cartoon with polished CGI character styling',
    prompt: 'make all subjects and object a 3D Rendered Art cartoon',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  '3d-render-v2': {
    id: '3d-render-v2',
    label: '3D Render V2',
    categoryId: 'cartoons',
    description: '3D rendered art cartoon with vivid stylized CGI illustration',
    prompt: 'make all subjects and object a 3D Rendered Art cartoon',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'comic-v1': {
    id: 'comic-v1',
    label: 'Comic V1',
    categoryId: 'cartoons',
    description: 'Comic book style cartoon with classic printed-panel energy',
    prompt: 'make this a Comic Book Style cartoon',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  'comic-v2': {
    id: 'comic-v2',
    label: 'Comic V2',
    categoryId: 'cartoons',
    description: 'Comic book style cartoon with sharper modern illustrated rendering',
    prompt: 'make this a Comic Book Style cartoon',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'comic-v3': {
    id: 'comic-v3',
    label: 'Comic V3',
    categoryId: 'cartoons',
    description: 'Comic book style cartoon with bold superhero comic-book character design',
    prompt: 'make this a DC style Cartoon',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  neon: {
    id: 'neon',
    label: 'Neon',
    categoryId: 'art',
    description: 'Vibrant neon cartoon style',
    prompt: 'make a neon cartoon',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  anime: {
    id: 'anime',
    label: 'Anime',
    categoryId: 'cartoons',
    description: 'Anime-style cartoon',
    prompt: 'Make this an anime cartoon, maintaining poster and facial features',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  manga: {
    id: 'manga',
    label: 'Manga',
    categoryId: 'cartoons',
    description: 'Manga-style cartoon',
    prompt: 'Make this a manga cartoon, maintaining poster and facial features, no text',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  'genndy-v1': {
    id: 'genndy-v1',
    label: 'Genndy V1',
    categoryId: 'cartoons',
    description:
      'Genndy Tartakovsky-stylized 2D caricature with elongated faces, sharp angles, and noir-inspired shading',
    prompt:
      'make a Genndy Tartakovsky-stylized 2D caricature character with elongated faces, and sharp angular features. Bold clean lineart, and dramatic noir-inspired shading. Character in suit and vintage outfit, placed inside a vertical color panel. Big expressive eyes, strong eyebrows, and a retro detective cartoon vibe. High-contrast, graphic, stylized character design. no text',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  'genndy-v2': {
    id: 'genndy-v2',
    label: 'Genndy V2',
    categoryId: 'cartoons',
    description:
      'Genndy Tartakovsky-stylized 2D caricature with elongated faces, sharp angles, and noir-inspired shading',
    prompt:
      'make a Genndy Tartakovsky-stylized 2D caricature character with elongated faces, and sharp angular features. Bold clean lineart, and dramatic noir-inspired shading. Character in suit and vintage outfit, placed inside a vertical color panel. Big expressive eyes, strong eyebrows, and a retro detective cartoon vibe. High-contrast, graphic, stylized character design. no text',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  '3dclay': {
    id: '3dclay',
    label: '3D Clay',
    categoryId: '3d-characters',
    description: '3D Clay cartoon style',
    prompt: 'make this a 3D Clay cartoon',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  puppet: {
    id: 'puppet',
    label: 'Puppet',
    categoryId: '3d-characters',
    description:
      'Charming handcrafted puppet character with felt textures, expressive features, and theatrical studio warmth',
    prompt:
      "Transform the uploaded subject into a charming handcrafted puppet character inspired by the classic Muppet aesthetic.\n\nUse the uploaded image as the sole reference for the subject. Preserve their recognizable identity, facial structure, hairstyle, skin tone, distinctive features, clothing, and overall pose, translating them naturally into a puppet form.\n\nCreate a soft, tactile fabric-and-felt appearance with expressive oversized eyes, a wide characterful mouth, soft plush textures, visible stitching, subtle fabric fibers, rounded puppet-like forms, exaggerated but friendly facial expressions, and warm studio lighting. Give the character the playful, slightly quirky personality and theatrical charm associated with classic television puppet characters.\n\nMaintain the subject's original clothing and recognizable characteristics. Do not add logos, text, existing Muppet characters, or copyrighted character-specific features. The result should look like an original handcrafted puppet version of the uploaded person.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'oil-paint': {
    id: 'oil-paint',
    label: 'Oil Paint',
    categoryId: 'paintings',
    description: 'Oil-paint cartoon caricature style',
    prompt: 'make this a Oil-paint cartoon caricature',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  lowpoly: {
    id: 'lowpoly',
    label: 'Low Poly',
    categoryId: 'art',
    description: 'Low-poly cartoon with geometric facets and plain-color background',
    prompt: 'make this a low-poly cartoon, make background plain color if none.',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  mural: {
    id: 'mural',
    label: 'Mural',
    categoryId: 'art',
    description: 'Street mural graffiti portrait of the subject',
    prompt: 'make a street mural graffiti of the subject/s',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  illustration: {
    id: 'illustration',
    label: 'Illustration',
    categoryId: 'art',
    description:
      'Whimsical pastel storybook portrait illustration with soft hand-drawn linework and dreamy floral scenes',
    prompt:
      'Using the uploaded image as the visual reference, create a whimsical pastel storybook-style portrait illustration of the same subject while preserving her recognizable facial structure, proportions, hairstyle, expression, and overall youthful appearance. Maintain the soft hand-drawn aesthetic with delicate linework, subtle watercolor-style shading, large expressive eyes, rosy cheeks, and smooth rounded facial features.\n\nThe composition should feel dynamic and varied rather than identical to the reference. Change the pose, head angle, hand placement, outfit details, floral arrangement, background elements, and scene composition creatively while staying faithful to the original artistic style. The subject can be shown interacting naturally with the environment — surrounded by blooming flowers, floating petals, vines, butterflies, seasonal plants, or dreamy decorative elements.\n\nKeep the same muted pastel color palette featuring soft coral pinks, dusty teal greens, warm creams, light peach skin tones, and gentle earthy accents. Preserve the airy, cozy, feminine illustration feel commonly seen in premium nursery art, greeting cards, and modern fairytale illustrations.',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  'pop-art-v1': {
    id: 'pop-art-v1',
    label: 'Pop Art V1',
    categoryId: 'art',
    description: 'Pop art portrait rendered with bold flat colors',
    prompt: 'make this a pop art.',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  'pop-art-v2': {
    id: 'pop-art-v2',
    label: 'Pop Art V2',
    categoryId: 'art',
    description: 'Pop art portrait with vibrant graphic styling',
    prompt: 'make this a pop art.',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  'pop-art-v3': {
    id: 'pop-art-v3',
    label: 'Pop Art V3',
    categoryId: 'art',
    description:
      'Minimalist pop art with bold black-and-white contrast, halftone shading, and a solid pastel background',
    prompt:
      'Convert this portrait photo into a minimalist pop art illustration. Use bold black-and-white contrast with halftone shading on the face. Keep the background a solid pastel color, outlined in black, with clean geometric lines. The overall style should be flat, graphic, and modern, similar to retro comic book art.',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  graffiti: {
    id: 'graffiti',
    label: 'Graffiti',
    categoryId: 'art',
    description: 'Graffiti art portrait with bold street-art styling',
    prompt: 'make this a Graffiti Art.',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  banksy: {
    id: 'banksy',
    label: 'Banksy',
    categoryId: 'art',
    description: 'Banksy-style stencil street art portrait',
    prompt: 'make this a banksy style art',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  mosaic: {
    id: 'mosaic',
    label: 'Mosaic',
    categoryId: 'art',
    description: 'Mosaic installation art portrait with tiled color fragments',
    prompt: 'make this a Mosaic installations art',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  'hexagonal-mosaic': {
    id: 'hexagonal-mosaic',
    label: 'Hexagonal Mosaic',
    categoryId: 'art',
    description: 'Hexagonal mosaic portrait with honeycomb tiles and faceted color blocks',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the portrait into a contemporary geometric artwork composed of interlocking hexagonal mosaic cells across the face while preserving realistic eyes, nose, lips, and facial proportions. Render the hair as flowing topographic contour lines resembling fingerprint ridges or elevation maps. Blend warm amber and orange tones into cool violet, indigo, and cobalt gradients with smooth transitions. Integrate the geometric pattern naturally into the clothing using elongated vertical graphic elements. Maintain a textured off-white paper background with subtle painterly brush textures. High-detail digital illustration, architectural precision, clean composition, elegant modern generative art, crisp edges, premium gallery-quality finish.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  'e-glow': {
    id: 'e-glow',
    label: 'E-Glow',
    categoryId: 'art',
    description: 'Electric glow art portrait with neon luminous highlights',
    prompt: 'make this a Electric Glow art',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  'abstract-v1': {
    id: 'abstract-v1',
    label: 'Abstract V1',
    categoryId: 'art',
    description: 'Abstract art portrait with bold shapes and expressive color',
    prompt: 'Make this an abstract art',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  'abstract-v2': {
    id: 'abstract-v2',
    label: 'Abstract V2',
    categoryId: 'art',
    description: 'Abstract art portrait with layered forms and vivid composition',
    prompt: 'Make this an abstract art',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  geometric: {
    id: 'geometric',
    label: 'Geometric',
    categoryId: 'art',
    description: 'Geometric art portrait with angular shapes and bold color blocks',
    prompt: 'Make this a geometric art',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  'coloured-glass': {
    id: 'coloured-glass',
    label: 'Coloured Glass',
    categoryId: 'art',
    description: 'Colored glass art portrait with luminous stained-glass styling',
    prompt: 'Make this a Colored Glass Art',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  'paste-up': {
    id: 'paste-up',
    label: 'Paste-up',
    categoryId: 'art',
    description: 'Paste-up street art portrait with layered paper collage styling',
    prompt: 'Make this a Paste-up Art',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  'pencil-sketch-v1': {
    id: 'pencil-sketch-v1',
    label: 'Pencil Sketch V1',
    categoryId: 'art',
    description:
      'Childlike crayon caricature on lined notebook paper with messy vibrant strokes',
    prompt:
      'A childlike crayon drawing on blue horizontal lined notebook paper. The drawing is a simplified, slightly exaggerated caricature of the reference image. preserving face shape, skin tone, hairstyle, facial expression, and outfit colors. Features messy, vibrant crayon strokes and bold outlines. Background is simplified and loosely sketched. The overall effect should be an authentic drawing by a child aged 10-6.',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  'pencil-sketch-v2': {
    id: 'pencil-sketch-v2',
    label: 'Pencil Sketch V2',
    categoryId: 'art',
    description:
      'Childlike crayon caricature on lined notebook paper with messy vibrant strokes',
    prompt:
      'A childlike crayon drawing on blue horizontal lined notebook paper. The drawing is a simplified, slightly exaggerated caricature of the reference image. preserving face shape, skin tone, hairstyle, facial expression, and outfit colors. Features messy, vibrant crayon strokes and bold outlines. Background is simplified and loosely sketched. The overall effect should be an authentic drawing by a child aged 10-6.',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'pencil-sketch': {
    id: 'pencil-sketch',
    label: 'Pencil Sketch',
    categoryId: 'drawings-sketches',
    description:
      'Professionally hand-drawn graphite pencil portrait with realistic shading and cross-hatching',
    prompt:
      'Create a detailed hand-drawn pencil sketch of the uploaded subject, using the reference image as the primary guide. Preserve the subject’s identity, facial structure, proportions, hairstyle, expression, and distinctive features with high accuracy. Use realistic graphite pencil strokes, subtle shading, cross-hatching, soft tonal transitions, and fine linework to create natural depth and dimension. Keep the drawing monochrome in shades of graphite gray, with visible pencil texture and slight variations in stroke pressure. Maintain the original pose and composition of the reference image. Clean white or lightly textured paper background, no color, no painting effect, no digital-art appearance, no exaggerated cartoon features, and no unnecessary background elements. The final result should look like a professionally hand-drawn graphite portrait/sketch.',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  charcoal: {
    id: 'charcoal',
    label: 'Charcoal',
    categoryId: 'drawings-sketches',
    description:
      'Professionally hand-drawn charcoal portrait with expressive strokes, soft smudging, and textured shading',
    prompt:
      'Create a detailed hand-drawn charcoal portrait of the uploaded subject, using the reference image as the primary guide. Preserve the subject’s identity, facial structure, proportions, hairstyle, expression, and distinctive features with high accuracy. Use expressive charcoal strokes, rich dark tones, soft smudging, textured shading, subtle highlights, and carefully controlled contrast to create realistic depth and dimension. Maintain the original pose and composition of the reference image. Monochromatic black, gray, and charcoal tones on textured drawing paper, with natural charcoal grain and visible hand-drawn marks. Keep the background minimal and unobtrusive. No color, no painting effect, no digital-art appearance, no exaggerated cartoon features, and no unnecessary background elements. The final result should look like an authentic, professionally hand-drawn charcoal portrait.',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  ink: {
    id: 'ink',
    label: 'Ink',
    categoryId: 'drawings-sketches',
    description:
      'Professionally hand-rendered ink portrait with crisp linework, hatching, and controlled shadow',
    prompt:
      'Create a detailed hand-drawn ink portrait of the uploaded subject, using the reference image as the primary guide. Preserve the subject’s identity, facial structure, proportions, hairstyle, expression, and distinctive features with high accuracy. Use crisp black ink linework, varied line weights, fine hatching, cross-hatching, stippling, and controlled shadow areas to create depth and realistic form. Maintain the original pose and composition of the reference image. Monochromatic black ink on clean white or subtly textured paper, with natural hand-drawn imperfections and an authentic traditional illustration feel. Keep the background minimal and unobtrusive. No color, no watercolor, no pencil or charcoal texture, no digital painting appearance, no exaggerated cartoon features, and no unnecessary background elements. The final result should look like a professionally hand-rendered ink illustration.',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  pen: {
    id: 'pen',
    label: 'Pen',
    categoryId: 'drawings-sketches',
    description:
      'Professionally hand-drawn pen illustration with precise contours, hatching, and technical-pen shading',
    prompt:
      'Create a detailed hand-drawn pen illustration of the uploaded subject, using the reference image as the primary guide. Preserve the subject’s identity, facial structure, proportions, hairstyle, expression, and distinctive features with high accuracy. Use fine ballpoint or technical pen strokes, precise contours, varied line weights, cross-hatching, parallel hatching, and controlled stippling to build realistic shading and depth. Maintain the original pose and composition of the reference image. Use monochromatic black or dark-blue pen ink on clean white paper, with subtle natural pen texture and visible hand-drawn linework. Keep the background minimal and unobtrusive. No color painting, no pencil or charcoal texture, no watercolor effect, no digital painting appearance, no exaggerated cartoon features, and no unnecessary background elements. The final result should resemble a professionally hand-drawn pen illustration created with meticulous traditional pen technique.',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  'cross-hatched': {
    id: 'cross-hatched',
    label: 'Cross-hatched',
    categoryId: 'drawings-sketches',
    description:
      'Meticulously hand-rendered traditional cross-hatched illustration with layered intersecting lines',
    prompt:
      'Create a highly detailed traditional cross-hatched drawing of the uploaded subject, using the reference image as the primary guide. Preserve the subject’s identity, facial structure, proportions, hairstyle, expression, and distinctive features with high accuracy. Build the entire image using carefully layered intersecting lines, with dense cross-hatching in deep shadow areas, lighter single-direction hatching for midtones, and fine sparse lines for highlights. Use varied line density, direction, and thickness to create realistic form, depth, texture, and dimensionality. Maintain the original pose and composition of the reference image. Monochromatic black ink on clean white paper, with authentic hand-drawn imperfections and visible linework. Minimal background. No color, no smooth digital shading, no pencil or charcoal texture, no watercolor, no painting effect, and no exaggerated cartoon features. The final result should look like a meticulously hand-rendered traditional cross-hatched illustration.',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  'line-art': {
    id: 'line-art',
    label: 'Line Art',
    categoryId: 'drawings-sketches',
    description:
      'Polished professional line-art illustration with precise outlines and minimal shading',
    prompt:
      'Create a clean, detailed line-art illustration of the uploaded subject, using the reference image as the primary guide. Preserve the subject’s identity, facial structure, proportions, hairstyle, expression, and distinctive features with high accuracy. Use precise black outlines, smooth controlled contours, varied line weight, and selective fine interior details to clearly define the face, hair, clothing, and important features. Keep the drawing crisp and uncluttered, with minimal or no shading. Maintain the original pose and composition of the reference image. Monochromatic black linework on a clean white background, with a refined hand-drawn illustration quality. No color, no gradients, no cross-hatching, no pencil or charcoal texture, no filled shadows, no painting effect, and no unnecessary background elements. The final result should look like polished professional line art.',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  fashion: {
    id: 'fashion',
    label: 'Fashion',
    categoryId: 'drawings-sketches',
    description:
      'Sophisticated editorial fashion sketch with expressive graphite and ink strokes',
    prompt:
      'Create a sophisticated hand-drawn fashion sketch of the uploaded subject, using the reference image as the primary guide. Preserve the subject’s identity, facial features, hairstyle, proportions, and distinctive characteristics with high accuracy. Render the subject in an elegant fashion-illustration style using expressive graphite and ink strokes, elongated but natural fashion-illustration lines, loose gestural contours, refined garment detailing, and selective soft shading. Preserve the original pose and overall composition while giving the clothing a polished editorial fashion-sketch treatment. Use a predominantly monochromatic palette on textured white sketch paper, with subtle artistic imperfections and visible hand-drawn strokes. Minimal background, clean composition, sophisticated editorial feel. No photorealism, no 3D rendering, no cartoon exaggeration, no heavy digital effects, and no unnecessary background elements.',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  marker: {
    id: 'marker',
    label: 'Marker',
    categoryId: 'drawings-sketches',
    description:
      'Bold hand-rendered marker illustration with expressive strokes, layered fills, and authentic bleed',
    prompt:
      'Create a bold hand-drawn marker illustration of the uploaded subject, using the reference image as the primary guide. Preserve the subject’s identity, facial structure, proportions, hairstyle, expression, and distinctive features with high accuracy. Use expressive marker strokes, confident outlines, visible stroke direction, layered marker fills, and simple overlapping tones to create form, depth, and dimension. Incorporate subtle marker bleed, uneven ink coverage, and natural paper texture for an authentic traditional marker-sketch appearance. Maintain the original pose and composition of the reference image. Use a vibrant but controlled marker color palette, with strong areas of light and shadow and selective highlights. Keep the background clean and minimal. No photorealism, no 3D rendering, no pencil or charcoal texture, no watercolor wash, no glossy digital painting, and no unnecessary background elements. The final result should resemble a professionally hand-rendered fashion or concept illustration created with high-quality art markers.',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  origami: {
    id: 'origami',
    label: 'Origami',
    categoryId: '3d-characters',
    description:
      'Elegant traditional origami sculpture of the subject from folded washi paper with museum-quality craftsmanship',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the person into an elegant traditional origami sculpture, handcrafted entirely from folded paper while maintaining their recognizable facial features, hairstyle, skin tone (represented through carefully chosen paper colours), clothing, accessories, and personality.\n\nConstruct the entire character exclusively from precisely folded sheets of paper, using authentic origami techniques without cutting, tearing, or sculpting. Every part of the figure—including the face, hair, clothing, shoes, and accessories—should be formed through intricate geometric folds, layered paper structures, sharp creases, crisp edges, and carefully engineered paper geometry.\n\nPreserve the person's facial identity by using sophisticated folded forms that suggest the eyes, eyebrows, nose, lips, jawline, hairstyle, and expression while remaining unmistakably handcrafted from paper. Hair should be represented through layered folded strips, pleats, curls, or angular paper sections that mimic the person's hairstyle.\n\nClothing should appear as folded paper garments with realistic collars, sleeves, seams, lapels, pockets, folds, and fabric draping recreated entirely through origami techniques. Accessories should also be folded from paper while remaining clearly recognizable.\n\nUse premium textured Japanese washi paper with subtle fibres, natural matte surfaces, delicate paper grain, and realistic fold stress along the creases. Employ harmonious paper colours with gentle tonal variation while preserving the person's clothing colours and overall appearance.\n\nDisplay the finished origami sculpture on a clean neutral surface with soft studio lighting that highlights the crisp folds, layered construction, realistic paper thickness, and intricate craftsmanship. Subtle contact shadows, shallow depth of field, professional macro photography, museum-quality paper sculpture, ultra-detailed handcrafted artistry, elegant composition, photorealistic materials, 8K quality, no glue, no tape, no text, no watermarks, and no visual defects.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'brick-v1': {
    id: 'brick-v1',
    label: 'Brick V1',
    categoryId: '3d-characters',
    description: 'Lego brick figure of the subject, preserving facial identity, pose, and clothing',
    prompt: 'make the subject/s a lego, maintain subject/s facial identity, pose and clothing.',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'brick-v2': {
    id: 'brick-v2',
    label: 'Brick V2',
    categoryId: '3d-characters',
    description: 'Lego brick figure of the subject, preserving facial identity, pose, and clothing',
    prompt: 'make the subject/s a lego, maintain subject/s facial identity, pose and clothing.',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  professional: {
    id: 'professional',
    label: 'Professional',
    categoryId: 'photography',
    description:
      'Polished professional studio headshot with business attire and clean studio lighting',
    prompt:
      "Create a polished, professional studio headshot of the person in the uploaded photo. Use the uploaded image as the sole reference for the person's identity and preserve their recognizable facial features, facial structure, skin tone, hairstyle, proportions, and natural appearance. Do not alter their identity or make them look like a different person.\n\nFrame the subject from the chest or shoulders upward, facing the camera with a natural, confident, approachable expression. Dress the subject in **professional, sophisticated business-appropriate clothing** suitable for a corporate profile, such as a well-fitted blazer, suit jacket, formal shirt, blouse, or other tasteful professional attire. The clothing should look realistic, clean, well-groomed, and appropriately styled for a professional headshot.\n\n**Do not add jewelry or ornaments that are present in the reference image. Do not add chains, necklaces, earrings, bracelets, piercings, brooches, decorative accessories, or other ornamental items.** Keep accessories minimal and authentic to the uploaded reference.\n\nUse professional portrait photography with flattering soft studio lighting, subtle dimensional shadows, clean natural skin texture, realistic facial detail, sharp focus on the eyes, and natural color grading. Avoid excessive skin smoothing, beauty filters, facial reshaping, or artificial enhancement.\n\nUse a clean, minimal studio background with subtle depth and no distracting objects. Create the appearance of a high-end professional photographer using a premium portrait lens, realistic depth of field, balanced exposure, and refined photographic detail. The final result should look like an authentic professionally photographed corporate headshot rather than an AI-generated image, illustration, or heavily retouched portrait.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  studio: {
    id: 'studio',
    label: 'Studio',
    categoryId: 'photography',
    description:
      'High-end professional studio portrait with elegant clothing and controlled studio lighting',
    prompt:
      "Create a high-end professional studio portrait of the person in the uploaded photo. Use the uploaded image as the sole reference for the person's identity and preserve their recognizable facial features, facial structure, skin tone, hairstyle, proportions, and natural appearance. Do not alter their identity or make them look like a different person.\n\nCreate a polished studio photography aesthetic with carefully controlled professional lighting, soft highlights, natural shadows, realistic skin texture, accurate facial detail, and refined color grading. The subject should have a confident, natural pose and authentic expression, photographed with the quality and precision of a professional portrait photographer.\n\nDress the subject in **elegant, professional, and sophisticated clothing** appropriate for a premium studio portrait. Clothing should be realistic, tasteful, well-fitted, and visually refined. **Do not add jewelry or ornaments that are not present in the reference image. Do not add chains, necklaces, earrings, bracelets, piercings, brooches, or decorative accessories.**\n\nUse a clean, sophisticated studio environment with a simple seamless or subtly textured background. Keep the composition focused entirely on the subject, with no distracting objects or props. Use realistic professional photography characteristics such as controlled studio lighting, natural depth of field, sharp facial focus, balanced exposure, subtle background separation, and premium camera detail.\n\nThe final image should look like a **genuine professionally photographed studio portrait**, not an illustration, CGI render, beauty filter, or obviously AI-generated image. Avoid excessive retouching, artificial skin smoothing, facial reshaping, or changing the person's natural appearance.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  corporate: {
    id: 'corporate',
    label: 'Corporate',
    categoryId: 'photography',
    description:
      'Polished high-end corporate portrait with business attire and a clean professional backdrop',
    prompt:
      "Create a polished, high-end corporate portrait of the person in the uploaded photo. Use the uploaded image as the sole reference for the person's identity. Preserve their recognizable facial features, facial structure, skin tone, hairstyle, proportions, and natural appearance with high likeness accuracy. Do not change their identity or make them look like a different person.\n\nDress the subject in **professional corporate attire** appropriate for a modern business environment, such as a tailored suit, blazer, formal shirt, blouse, or other sophisticated business clothing. Clothing should be clean, well-fitted, realistic, understated, and appropriate for a corporate professional profile.\n\n**Do not add jewelry or ornaments that are not present in the reference image. Do not add chains, necklaces, earrings, bracelets, piercings, brooches, decorative accessories, or other ornamental items.**\n\nUse a confident, approachable, professional expression with natural posture and relaxed body language. Frame the subject as a professional corporate portrait, typically from the chest or waist upward, with the face clearly visible and naturally positioned.\n\nUse sophisticated professional photography with soft, controlled studio lighting, subtle dimensional shadows, realistic skin texture, sharp facial detail, natural color grading, balanced exposure, and gentle background separation. The background should be clean and minimal, such as a refined neutral studio backdrop or a softly blurred modern office environment, without distracting objects.\n\nMaintain realistic photographic proportions and natural facial texture. Avoid excessive skin smoothing, beauty filters, facial reshaping, unrealistic perfection, or artificial glamour.\n\nThe final result should look like an **authentic corporate photograph taken by a professional photographer**, suitable for a company profile, professional website, business profile, or corporate biography—not an illustration, CGI render, or obviously AI-generated image.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  'fashion-editorial': {
    id: 'fashion-editorial',
    label: 'Fashion Editorial',
    categoryId: 'photography',
    description:
      'High-end fashion magazine editorial portrait with sophisticated styling and dramatic lighting',
    prompt:
      "Create a high-end fashion editorial photograph of the person in the uploaded photo. Use the uploaded image as the sole reference for the person's identity and preserve their recognizable facial features, facial structure, skin tone, hairstyle, proportions, and natural appearance with high likeness accuracy. Do not alter their identity or make them look like a different person.\n\nStyle the image as a **professional fashion magazine editorial**, with sophisticated composition, confident presence, refined styling, and an artistic yet realistic photographic aesthetic. Give the subject a stylish, contemporary fashion look with carefully selected **editorial clothing** that feels premium, fashionable, and professionally styled. Clothing may include modern tailoring, designer-inspired silhouettes, elegant dresses, structured jackets, or sophisticated contemporary fashion, while remaining tasteful and realistic.\n\n**Do not add jewelry or ornaments that are not present in the reference image. Do not add chains, necklaces, earrings, bracelets, piercings, brooches, crowns, or decorative accessories unless they are already visible in the uploaded reference.**\n\nUse professional fashion photography with dramatic but controlled lighting, sculpted highlights and shadows, realistic skin texture, crisp facial detail, sophisticated color grading, and natural depth of field. The pose should feel confident and editorial without becoming exaggerated or unnatural.\n\nUse a visually refined studio or fashion-editorial environment with a clean, sophisticated background that complements the subject without distracting from them. Avoid unnecessary props, text, logos, brand names, or recognizable copyrighted fashion branding.\n\nThe final image should look like a **genuine high-end fashion magazine photograph**, combining realistic photography, sophisticated styling, professional lighting, and editorial composition. Avoid cartoon aesthetics, CGI appearance, excessive beauty retouching, artificial skin, facial reshaping, or an obviously AI-generated look.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  cinematic: {
    id: 'cinematic',
    label: 'Cinematic',
    categoryId: 'photography',
    description:
      'High-end cinematic portrait with film-still atmosphere, dramatic lighting, and refined color grading',
    prompt:
      "Create a high-end cinematic portrait photograph of the person in the uploaded photo. Use the uploaded image as the sole reference for the person's identity and preserve their recognizable facial features, facial structure, skin tone, hairstyle, proportions, and natural appearance with high likeness accuracy. Do not alter their identity or make them look like a different person.\n\nStyle the image as a **cinematic professional portrait**, with the visual quality and atmosphere of a carefully composed film still while maintaining realistic photography. Give the subject a natural, confident, expressive presence and an authentic cinematic pose.\n\nDress the subject in **sophisticated, stylish, and realistic clothing appropriate to a cinematic portrait**. Clothing should complement the mood and feel professionally styled, refined, and visually cohesive without appearing costume-like.\n\n**Do not add jewelry or ornaments that are not present in the reference image. Do not add chains, necklaces, earrings, bracelets, piercings, brooches, decorative accessories, or other ornamental items.**\n\nUse dramatic yet natural cinematic lighting with controlled highlights, soft directional light, subtle shadows, realistic skin texture, detailed facial features, and atmospheric depth. Create gentle separation between the subject and background using realistic depth of field and professional lens characteristics.\n\nUse a visually compelling but uncluttered environment that supports the cinematic mood—such as a sophisticated interior, architectural setting, or softly atmospheric outdoor location. Keep the background secondary to the subject and avoid distracting objects, text, logos, or recognizable brands.\n\nApply refined cinematic color grading, balanced contrast, subtle tonal depth, realistic exposure, and natural photographic detail. Avoid excessive color effects, artificial glow, plastic-looking skin, facial reshaping, or exaggerated beauty retouching.\n\nThe final result should look like a **genuine professionally photographed cinematic portrait**, resembling a premium film still captured by a professional cinematographer and photographer—not an illustration, CGI render, or obviously AI-generated image.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  model: {
    id: 'model',
    label: 'Model',
    categoryId: 'photography',
    description:
      'Clean professional model portfolio photograph with contemporary fashion and studio lighting',
    prompt:
      "Create a high-end professional model portfolio photograph of the person in the uploaded photo. Use the uploaded image as the sole reference for the person's identity and preserve their recognizable facial features, facial structure, skin tone, hairstyle, proportions, and natural appearance with high likeness accuracy. Do not alter their identity or make them look like a different person.\n\nPresent the subject with a **clean, polished modeling aesthetic** designed to showcase their natural appearance, facial features, and overall presence. Use a confident but natural expression and an effortless professional pose. Keep the composition refined and visually balanced, similar to a professionally produced modeling portfolio or agency test shoot.\n\nDress the subject in **modern, sophisticated fashion suitable for a professional model portfolio**. Clothing should be stylish, well-fitted, realistic, tasteful, and appropriate for showcasing the subject rather than overpowering them. Favor clean silhouettes, contemporary fashion, and neutral or refined styling.\n\n**Do not add jewelry or ornaments that are not present in the reference image. Do not add chains, necklaces, earrings, bracelets, piercings, brooches, watches, crowns, or decorative accessories unless they are already visible in the uploaded reference.**\n\nUse professional fashion photography with clean, controlled lighting, realistic skin texture, sharp facial detail, natural proportions, subtle shadows, balanced exposure, and refined color grading. Lighting should clearly reveal the subject's face without excessive glamour effects or harsh manipulation.\n\nUse a **simple, uncluttered studio or professional editorial background** that keeps attention on the subject. Avoid distracting props, text, logos, brand names, or elaborate scenery.\n\nMaintain authentic photographic detail and natural skin texture. Avoid excessive beauty retouching, facial reshaping, artificial skin smoothing, exaggerated makeup, unrealistic body modification, or changing the person's natural appearance.\n\nThe final result should look like an **authentic professional model portfolio photograph**, suitable for a modeling agency portfolio or professional casting profile—clean, sophisticated, realistic, and professionally photographed rather than an illustration, CGI render, or obviously AI-generated image.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  outdoor: {
    id: 'outdoor',
    label: 'Outdoor',
    categoryId: 'photography',
    description:
      'High-end professional outdoor portrait with natural light, authentic environment, and realistic bokeh',
    prompt:
      "Create a high-end professional outdoor portrait photograph of the person in the uploaded photo. Use the uploaded image as the sole reference for the person's identity and preserve their recognizable facial features, facial structure, skin tone, hairstyle, proportions, and natural appearance with high likeness accuracy. Do not alter their identity or make them look like a different person.\n\nPlace the subject in a **beautiful, natural outdoor environment** such as a sophisticated urban setting, landscaped garden, park, architectural location, or scenic outdoor space. The environment should complement the subject while remaining secondary to them. Keep the composition clean, intentional, and professionally photographed.\n\nDress the subject in **stylish, polished, and appropriate clothing suited to a professional outdoor portrait**. Clothing should look realistic, well-fitted, sophisticated, and naturally coordinated with the setting. Avoid costumes, overly flashy outfits, or distracting patterns.\n\n**Do not add jewelry or ornaments that are not present in the reference image. Do not add chains, necklaces, earrings, bracelets, piercings, brooches, watches, or other decorative accessories unless they are already visible in the uploaded reference.**\n\nUse **natural professional portrait lighting**, preferably soft directional sunlight, golden-hour illumination, or diffused daylight. Create realistic highlights and shadows across the face, natural skin texture, sharp facial detail, accurate exposure, and subtle depth of field.\n\nUse a professional portrait lens aesthetic with **natural background separation and realistic bokeh**, keeping the subject sharply focused while allowing the environment to fall gently out of focus. The background should feel authentic and photographic rather than artificially generated.\n\nApply refined, natural color grading with realistic skin tones, balanced contrast, subtle warmth, and professional photographic detail. Avoid excessive HDR, artificial glow, heavy filters, excessive skin smoothing, facial reshaping, or unrealistic enhancement.\n\nThe final result should look like an **authentic professionally photographed outdoor portrait**, captured by an experienced portrait photographer using professional camera equipment—not an illustration, CGI render, or obviously AI-generated image.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  passport: {
    id: 'passport',
    label: 'Passport',
    categoryId: 'photography',
    description:
      'Realistic official passport photograph with plain white background, neutral expression, and compliant framing',
    prompt:
      "Create a realistic, official-looking passport photograph of the uploaded person, preserving their true identity, natural facial structure, skin tone, hairstyle, and recognizable features. The photograph must look like a genuine passport/official identification photo, not a portrait or stylized image.\n\n**Appearance and composition requirements:**\n\n* Plain white background.\n* Background must be completely clean and uniform, with no patterns, textures, objects, gradients, or visible shadows.\n* Straight-on camera view with the person's face centered.\n* Head must be upright and perfectly level; no tilting, rotation, or angled pose.\n* Neutral facial expression: mouth closed naturally, no smiling, frowning, exaggerated expression, or posing.\n* Both eyes fully open and looking directly at the camera.\n* Face evenly and clearly illuminated with natural-looking lighting.\n* No harsh shadows across the face or background.\n* Frame the head and upper shoulders appropriately for a standard passport photograph, with sufficient space around the head.\n* Maintain the person's current appearance and age; do not beautify, reshape, de-age, age, or alter their facial features.\n* The photograph should represent the person's appearance as it would be if taken within the last 6 months.\n* **No eyeglasses**, sunglasses, tinted glasses, or other eyewear.\n* **No headgear**, hats, caps, or coverings unless the uploaded person is clearly wearing religious or medically required headgear. If headgear is present for those reasons, it must not obscure the eyes, eyebrows, nose, mouth, facial outline, or other identifying facial features.\n* Do not add jewelry, accessories, props, text, logos, borders, watermarks, or decorative elements.\n* Preserve natural skin texture without excessive retouching or artificial smoothing.\n\nThe final result must have the clean, standardized appearance of a compliant passport photograph, with the person's identity and natural appearance preserved accurately.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  child: {
    id: 'child',
    label: 'Child',
    categoryId: 'age-transformation',
    description:
      'Realistic 8-year-old version of the same person, preserving identity, clothing, pose, and original photograph',
    prompt:
      "Transform the person in the uploaded photo into a realistic **8-year-old version of the same person**.\n\nUse the uploaded image as the sole identity reference. Preserve the person's recognizable facial characteristics, underlying facial structure, distinctive features, skin tone, eye shape, nose shape, mouth shape, and overall identity while naturally adapting the face to childhood.\n\n**Do not change the subject's clothing, clothing colors, hairstyle unless required for natural age adaptation, accessories, posture, body position, hand position, camera angle, framing, facial orientation, expression, lighting, background, or composition. Preserve the original photograph exactly in these respects. The only intended transformation is the subject's apparent age.**\n\nNaturally create age-appropriate youthful facial proportions, softer facial features, and smooth natural skin texture. Do not simply shrink the adult face or create a generic child.\n\n**Do not add or remove jewelry, chains, necklaces, earrings, bracelets, piercings, watches, or decorative accessories.**\n\nThe result should look like the **same photograph featuring the same person at approximately 8 years old**, with only the person's age naturally transformed.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  teenager: {
    id: 'teenager',
    label: 'Teenager',
    categoryId: 'age-transformation',
    description:
      'Realistic 15-year-old version of the same person, preserving identity, clothing, pose, and original photograph',
    prompt:
      "Transform the person in the uploaded photo into a realistic **15-year-old version of the same person**.\n\nUse the uploaded image as the sole identity reference. Preserve the person's recognizable facial characteristics, underlying facial structure, distinctive features, skin tone, eye shape, nose shape, mouth shape, and overall identity while naturally adapting the face to adolescence.\n\n**Do not change the subject's clothing, clothing colors, hairstyle unless required for natural age adaptation, accessories, posture, body position, hand position, camera angle, framing, facial orientation, expression, lighting, background, or composition. Preserve the original photograph exactly in these respects. The only intended transformation is the subject's apparent age.**\n\nNaturally create realistic teenage facial development, with youthful skin texture and age-appropriate facial proportions. Maintain strong visual continuity with the original person.\n\n**Do not add or remove jewelry, chains, necklaces, earrings, bracelets, piercings, watches, or decorative accessories.**\n\nThe result should look like the **same photograph featuring the same person at approximately 15 years old**, with only the person's age naturally transformed.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'young-adult': {
    id: 'young-adult',
    label: 'Young Adult',
    categoryId: 'age-transformation',
    description:
      'Realistic 25-year-old version of the same person, preserving identity, clothing, pose, and original photograph',
    prompt:
      "Transform the person in the uploaded photo into a realistic **25-year-old version of the same person**.\n\nUse the uploaded image as the sole identity reference. Preserve the person's recognizable facial features, facial structure, skin tone, hairstyle characteristics, proportions, and distinctive identifying features.\n\n**Do not change the subject's clothing, clothing colors, hairstyle unless required for natural age adaptation, accessories, posture, body position, hand position, camera angle, framing, facial orientation, expression, lighting, background, or composition. Preserve the original photograph exactly in these respects. The only intended transformation is the subject's apparent age.**\n\nNaturally adapt the person's facial appearance to their mid-twenties with realistic youthful skin texture and mature young-adult facial definition. Do not over-beautify, reshape, or alter the person's identity.\n\n**Do not add or remove jewelry, chains, necklaces, earrings, bracelets, piercings, watches, or decorative accessories.**\n\nThe result should look like the **same photograph featuring the same person at approximately 25 years old**, with only the person's age naturally transformed.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'middle-age': {
    id: 'middle-age',
    label: 'Middle Age',
    categoryId: 'age-transformation',
    description:
      'Realistic 45-year-old version of the same person, preserving identity, clothing, pose, and original photograph',
    prompt:
      "Transform the person in the uploaded photo into a realistic **45-year-old version of the same person**.\n\nUse the uploaded image as the sole identity reference. Preserve the person's recognizable facial features, facial structure, skin tone, hairstyle characteristics, proportions, and distinctive identifying features.\n\n**Do not change the subject's clothing, clothing colors, hairstyle unless required for natural age adaptation, accessories, posture, body position, hand position, camera angle, framing, facial orientation, expression, lighting, background, or composition. Preserve the original photograph exactly in these respects. The only intended transformation is the subject's apparent age.**\n\nIntroduce subtle, realistic signs of middle age such as naturally developing facial lines, mature skin texture, and gradual changes in facial fullness. Keep the aging restrained and believable. Do not exaggerate wrinkles, sagging, or other aging characteristics.\n\n**Do not add or remove jewelry, chains, necklaces, earrings, bracelets, piercings, watches, or decorative accessories.**\n\nThe result should look like the **same photograph featuring the same person at approximately 45 years old**, with only the person's age naturally transformed.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  elderly: {
    id: 'elderly',
    label: 'Elderly',
    categoryId: 'age-transformation',
    description:
      'Realistic 70-year-old version of the same person, preserving identity, clothing, pose, and original photograph',
    prompt:
      "Transform the person in the uploaded photo into a realistic **70-year-old version of the same person**.\n\nUse the uploaded image as the **sole identity reference**. Preserve the person's recognizable facial structure, distinctive facial features, eye shape, nose shape, mouth shape, skin tone, hairstyle, proportions, and overall identity.\n\n**The subject's age is the ONLY element that should change.** Preserve the original photograph exactly in every other respect.\n\nDo not change the **clothing, clothing colors, clothing style, accessories, posture, body position, hand position, head position, facial orientation, facial expression, camera angle, perspective, framing, background, lighting, shadows, or composition**.\n\nNaturally introduce only the facial characteristics associated with approximately 70 years of age. Add realistic age-related facial lines, mature skin texture, subtle changes in facial fullness, and naturally appropriate hair aging where necessary.\n\nKeep the aging **realistic and restrained**. Do not exaggerate wrinkles, sagging, hair loss, or other elderly characteristics. Do not distort the person's facial structure.\n\n**Do not add, remove, or modify any accessories. Do not add chains, necklaces, earrings, bracelets, piercings, watches, brooches, or decorative ornaments.**\n\nThe final result should look like the **same person in the same photograph at approximately 70 years old**, with the clothing, pose, composition, and environment remaining unchanged.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  progressive: {
    id: 'progressive',
    label: 'Progressive',
    categoryId: 'age-transformation',
    description:
      'Five-stage photographic age progression from childhood to old age, preserving identity, clothing, pose, and composition',
    prompt:
      "Create a realistic **age progression portrait** of the person in the uploaded photo, showing the same individual at five distinct stages of life:\n\n**8 years old → 15 years old → 25 years old → 45 years old → 70 years old**\n\nUse the uploaded photo as the **sole identity reference**. Preserve the person's recognizable facial structure, distinctive facial features, skin tone, eye shape, nose shape, mouth shape, and overall identity consistently across every age.\n\nShow a believable natural progression from childhood to old age. Each stage should progressively reflect appropriate age-related facial development, including changes in facial proportions, maturity, skin texture, facial lines, facial fullness, and hair characteristics.\n\n**The person's identity must remain consistent throughout the entire progression.** Each portrait should clearly look like the same individual at a different age.\n\nKeep the **same clothing, clothing colors, posture, body position, hand position, facial orientation, facial expression, camera angle, framing, lighting, background, and overall composition** across all five stages. The subject's clothing and pose must not be redesigned or changed between ages. **The only intended variation is the person's apparent age and naturally associated age-related facial and hair characteristics.**\n\nDo not add, remove, or modify accessories. **Do not add chains, necklaces, earrings, bracelets, piercings, watches, brooches, or decorative ornaments.**\n\nArrange the five portraits in a clean chronological sequence from **youngest on the left to oldest on the right**, with consistent spacing, scale, and framing.\n\nUse realistic professional photography, natural skin texture, accurate facial detail, consistent lighting, realistic color grading, and seamless visual continuity.\n\n**Do not add text, age labels, numbers, borders, logos, props, or decorative graphics.**\n\nThe final image should look like a **professional photographic age-progression study of one person**, not a collage of unrelated faces, illustration, cartoon, or CGI render.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  regressive: {
    id: 'regressive',
    label: 'Regressive',
    categoryId: 'age-transformation',
    description:
      'Five-stage photographic age regression from old age to childhood, preserving identity, clothing, pose, and composition',
    prompt:
      "Create a realistic **age regression portrait** of the person in the uploaded photo, showing the same individual at five distinct stages of life:\n\n**70 years old → 45 years old → 25 years old → 15 years old → 8 years old**\n\nUse the uploaded photo as the **sole identity reference**. Preserve the person's recognizable facial structure, distinctive facial features, skin tone, eye shape, nose shape, mouth shape, and overall identity consistently across every age.\n\nShow a believable natural regression from old age to childhood. Each stage should progressively reverse age-related characteristics, including facial lines, skin texture, facial fullness, facial maturity, and hair characteristics.\n\n**The person's identity must remain consistent throughout the entire regression.** Each portrait should clearly look like the same individual at a different age.\n\nKeep the **same clothing, clothing colors, posture, body position, hand position, facial orientation, facial expression, camera angle, framing, lighting, background, and overall composition** across all five stages. The subject's clothing and pose must not be redesigned or changed between ages. **The only intended variation is the person's apparent age and naturally associated age-related facial and hair characteristics.**\n\nDo not add, remove, or modify accessories. **Do not add chains, necklaces, earrings, bracelets, piercings, watches, brooches, or decorative ornaments.**\n\nArrange the five portraits in a clean chronological sequence from **oldest on the left to youngest on the right**, with consistent spacing, scale, and framing.\n\nUse realistic professional photography, natural skin texture, accurate facial detail, consistent lighting, realistic color grading, and seamless visual continuity.\n\n**Do not add text, age labels, numbers, borders, logos, props, or decorative graphics.**\n\nThe final image should look like a **professional photographic age-regression study of one person**, not a collage of unrelated faces, illustration, cartoon, or CGI render.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  '1960s': {
    id: '1960s',
    label: '1960s',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic mid-to-late 1960s retro photograph with colorful fashion and analog film look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic mid-to-late 1960s retro photograph, with a distinctive 1965–1969 fashion and visual aesthetic.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age, and overall likeness. The subject must remain clearly recognizable as the same person.\n\nGive the subject authentic mid-to-late 1960s fashion with a bold, colorful, youthful and visually distinctive appearance. Use era-appropriate clothing such as vivid geometric or psychedelic patterns, colorful stripes, contrasting color combinations, patterned shirts and blouses, mod-inspired dresses, mini dresses, fitted tops, high-waisted trousers, flared or slightly flared trousers, colorful skirts, cropped jackets, turtlenecks, statement collars, and other recognizable late-1960s fashion elements. For men, use colorful patterned shirts, bold printed fabrics, fitted jackets, flared or straight-leg trousers, distinctive collars, colorful knitwear, and period-appropriate footwear.\n\nUse saturated period colors such as orange, mustard yellow, red, turquoise, blue, green, purple, cream, brown and combinations of contrasting colors. Incorporate bold geometric, floral, psychedelic, optical and abstract patterns where appropriate.\n\nAdapt the clothing naturally to the subject's gender, age and body proportions. Do not force the same outfit or fashion style onto every subject. The clothing should feel fashionable and authentic to the late 1960s rather than like a theatrical costume.\n\nInclude appropriate period styling such as era-appropriate hairstyles, grooming, accessories, jewelry, sunglasses, boots or shoes when suitable. Keep these details believable and coordinated with the clothing.\n\nThe photographic treatment should also feel authentically vintage: analog film photography, natural film grain, subtle film softness, slightly imperfect exposure, realistic photographic texture, gentle contrast, period-appropriate color reproduction and the characteristic look of photographs produced with 1960s film cameras and lenses.\n\nPreserve the original subject's general pose, body position, composition and framing unless minor adjustments are necessary to accommodate the period styling. Do not turn the image into an illustration or fashion drawing.\n\nThe final result should look like a genuine photograph taken during the late 1960s, featuring unmistakable colorful and expressive 1960s fashion — not a modern photograph with a simple vintage filter.\n\nAvoid overly formal business suits, conservative modern clothing, generic old-fashioned clothing, modern fashion trends, contemporary hairstyles, modern fabrics, excessive luxury styling, costume-like outfits, exaggerated bell-bottoms associated primarily with the 1970s, caricature, illustration, plastic skin, excessive beauty retouching, or loss of facial identity.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  '1970s': {
    id: '1970s',
    label: '1970s',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic 1970s retro photograph with bold period fashion and analog film look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic 1970s retro photograph with a distinctive 1970–1979 fashion and photographic aesthetic.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age, and overall likeness. The subject must remain clearly recognizable as the same person.\n\nDress the subject in authentic 1970s fashion with a bold, expressive and unmistakably period-specific appearance. Use characteristic 1970s clothing such as wide-leg and bell-bottom trousers, high-waisted flared pants, denim, suede jackets, fringe, fitted shirts, wide pointed collars, turtlenecks, patterned blouses, wrap dresses, maxi dresses, jumpsuits, knitwear, vests, flared sleeves, colorful jackets, and other recognizable 1970s styles.\n\nUse a rich 1970s color palette including burnt orange, mustard yellow, avocado green, brown, rust, cream, burgundy, gold, deep red, earthy tones and warm contrasting colors. Incorporate authentic period patterns such as floral prints, paisley, geometric patterns, stripes, swirls and bold psychedelic-inspired prints.\n\nAllow the styling to naturally represent different parts of the 1970s. It may lean toward early-70s bohemian fashion, colorful casual fashion, or mid-to-late-70s disco-inspired fashion depending on what best suits the subject. For disco-inspired styling, use glamorous fitted clothing, wide collars, jumpsuits, metallic or shimmering fabrics, platform footwear and expressive accessories. For casual styling, use denim, suede, patterned shirts, flared trousers, knitwear and layered clothing.\n\nAdapt the clothing naturally to the subject's gender, age and proportions. Do not force the same outfit onto every subject. Include appropriate 1970s hairstyles, grooming, jewelry, sunglasses, scarves, belts, boots, platform shoes and other accessories when suitable.\n\nThe photographic treatment should look authentically analog and period-specific: 1970s film photography, warm film tones, natural grain, subtle film softness, slightly faded or warm color reproduction, realistic skin texture, gentle imperfections, authentic exposure and the characteristic look of photographs taken with 1970s film cameras.\n\nPreserve the subject's original general pose, body position, composition and framing unless minor adjustments are necessary to accommodate the period styling.\n\nThe final image should look like a genuine photograph originally taken during the 1970s, with unmistakable 1970s fashion and atmosphere rather than a modern photograph with a vintage filter.\n\nAvoid modern clothing, contemporary hairstyles, conservative business attire, generic \"old-fashioned\" clothing, excessive formalwear, modern fabrics or styling, costume-like outfits, exaggerated caricature, illustration, plastic-looking skin, excessive beauty retouching, or alteration of the subject's identity.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  '1980s': {
    id: '1980s',
    label: '1980s',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic 1980s retro photograph with bold neon fashion and analog film look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic 1980s retro photograph with a distinctive 1980–1989 fashion and photographic aesthetic.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age, and overall likeness. The subject must remain clearly recognizable as the same person.\n\nDress the subject in unmistakable 1980s fashion with a bold, energetic and visually distinctive appearance. Use characteristic 1980s clothing such as oversized jackets, structured blazers, strong shoulders, denim jackets, acid-wash denim, leather jackets, high-waisted jeans, tapered trousers, leggings, colorful tracksuits, graphic T-shirts, oversized shirts, sweaters, knitwear, bomber jackets, mini skirts, fitted dresses, bold suits, and layered streetwear.\n\nUse vivid 1980s colors and strong color combinations such as neon pink, electric blue, bright yellow, vivid red, purple, turquoise, white and black. Incorporate recognizable 1980s patterns and graphics including geometric prints, color blocking, bold stripes, abstract patterns and large graphic designs.\n\nAllow the styling to naturally represent different parts of the 1980s. It may lean toward colorful 1980s casual fashion, athletic-inspired fashion, glamorous evening fashion, bold professional fashion, or late-1980s streetwear depending on what best suits the subject.\n\nFor women, incorporate appropriate 1980s elements such as voluminous hairstyles, big curls, teased hair, colorful accessories, statement earrings, bold belts, oversized jackets, shoulder-enhanced silhouettes, leggings, skirts and bright dresses when suitable.\n\nFor men, incorporate appropriate 1980s elements such as voluminous or styled hair, mustaches when naturally appropriate, oversized jackets, denim, leather, colorful shirts, graphic patterns, high-waisted trousers, athletic-inspired clothing and bold casualwear.\n\nAdapt the clothing naturally to the subject's gender, age and proportions. Do not force the same outfit onto every subject. The styling should look like authentic everyday or fashionable 1980s clothing rather than a Halloween costume or exaggerated caricature.\n\nInclude appropriate 1980s accessories such as large sunglasses, statement jewelry, watches, belts, colorful sneakers, boots or period-appropriate footwear when suitable.\n\nThe photographic treatment should look authentically analog and period-specific: 1980s film photography, realistic film grain, slightly soft lens rendering, warm or slightly faded film colors, natural exposure imperfections, subtle photographic texture, realistic skin and the characteristic color and contrast of photographs taken with 1980s film cameras.\n\nPreserve the subject's original general pose, body position, composition and framing unless minor adjustments are necessary to accommodate the period styling.\n\nThe final image should look like a genuine photograph originally taken during the 1980s, with unmistakable 1980s fashion, styling and photographic characteristics rather than a modern photograph with a vintage filter.\n\nAvoid modern clothing, contemporary hairstyles, minimalist modern fashion, conservative generic clothing, generic \"old-fashioned\" styling, excessive formalwear unless appropriate to the 1980s setting, costume-like outfits, exaggerated caricature, illustration, plastic-looking skin, excessive beauty retouching, or alteration of the subject's identity.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  '80s-hip-hop': {
    id: '80s-hip-hop',
    label: '80s Hip-hop',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic late-1980s hip-hop portrait with colorful streetwear and analog film look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic late-1980s hip-hop portrait with the distinctive fashion, styling and photographic character of 1980s hip-hop culture.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age and overall likeness. The subject must remain clearly recognizable as the same person.\n\nDress the subject in unmistakable 1980s hip-hop fashion. Use bold, youthful streetwear such as oversized tracksuits, colorful shell suits, bomber jackets, varsity-style jackets, denim jackets, oversized denim, graphic sweatshirts, hoodies, loose-fitting trousers, athletic jackets, colorful windbreakers, matching sportswear sets and layered streetwear.\n\nUse strong 1980s color combinations including red, royal blue, yellow, green, orange, purple, white and black. Incorporate bold color blocking, geometric patterns, stripes, graphic designs and contrasting panels characteristic of 1980s street fashion.\n\nInclude authentic period accessories when appropriate, such as bucket hats, Kangol-style caps, baseball caps, thick gold-tone chains, medallions, bracelets, watches, bold sunglasses and other distinctive 1980s streetwear accessories. Use period-appropriate high-top sneakers or classic athletic footwear.\n\nGive the subject an authentic 1980s hip-hop hairstyle and grooming appropriate to their gender, age and natural features. Do not impose a single hairstyle on every subject.\n\nThe clothing should feel relaxed, oversized, expressive and street-oriented rather than formal or tailored. Adapt the styling naturally to the subject's gender, age and proportions. Do not make the outfit look like a costume or a modern interpretation of hip-hop fashion.\n\nCreate an authentic 1980s urban photographic atmosphere. Use analog film photography, realistic film grain, slightly soft lens rendering, subtle color imperfections, natural film texture, moderate contrast and the characteristic look of photographs taken with 1980s consumer and professional film cameras.\n\nThe setting may resemble an authentic 1980s urban environment, neighborhood street, brick wall, basketball court, record-store area, studio backdrop or simple street-fashion portrait setting, while keeping the subject as the primary focus.\n\nPreserve the subject's general pose, body position and recognizable physical characteristics unless minor adjustments are necessary to accommodate the new styling.\n\nThe final image should look like a genuine photograph from the 1980s hip-hop era — colorful, confident, youthful, expressive and unmistakably period-specific — rather than a modern photograph with a vintage filter.\n\nAvoid modern streetwear, modern sneakers, contemporary hairstyles, modern luxury fashion, modern rap aesthetics, generic vintage clothing, formal business attire, excessive 1990s styling, costume-like outfits, caricature, illustration, plastic-looking skin, excessive beauty retouching or alteration of the subject's identity.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  '80s-pop': {
    id: '80s-pop',
    label: '80s Pop',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic 1980s pop portrait with glamorous music-video fashion and analog film look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic 1980s pop portrait with a distinctive 1980–1989 pop-music, fashion and photographic aesthetic.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age and overall likeness. The subject must remain clearly recognizable as the same individual.\n\nDress the subject in unmistakable 1980s pop fashion with a bold, glamorous, colorful and expressive appearance inspired by the fashion and visual style of 1980s pop music and music videos.\n\nUse characteristic 1980s pop clothing such as structured jackets, oversized blazers, strong-shouldered jackets, cropped jackets, leather jackets, fitted tops, graphic T-shirts, off-the-shoulder tops, mini skirts, fitted trousers, high-waisted pants, colorful dresses, jumpsuits, sequined garments, metallic fabrics, shiny materials, layered clothing and dramatic statement pieces.\n\nEmphasize the distinctive 1980s silhouette with strong shoulders, structured shapes, fitted and oversized contrasts, dramatic sleeves, bold collars and expressive proportions.\n\nUse vivid 1980s colors such as electric blue, hot pink, purple, bright red, neon yellow, turquoise, black, white and metallic silver or gold. Incorporate authentic period details such as geometric patterns, bold stripes, color blocking, abstract graphics, sequins, glitter, metallic accents, contrasting fabrics and large graphic designs.\n\nCreate a glamorous and energetic pop aesthetic rather than ordinary everyday clothing. The styling may range from colorful dance-pop fashion to glamorous stage-inspired fashion, rock-influenced pop fashion or polished 1980s music-video styling, while remaining believable as clothing from the decade.\n\nInclude appropriate 1980s accessories such as oversized sunglasses, statement earrings, layered necklaces, chunky bracelets, bold belts, colorful hair accessories and period-appropriate footwear when suitable.\n\nGive the subject an authentic 1980s hairstyle and grooming appropriate to their gender, age and natural features. Allow hairstyles to include natural volume, curls, waves, teased or layered hair, while avoiding an identical hairstyle for every subject.\n\nAdapt the clothing, hairstyle and styling naturally to the subject's gender, age and proportions. Do not force the same outfit onto every subject. Preserve the person's identity rather than making them resemble a specific celebrity or pop star.\n\nCreate an authentic 1980s photographic atmosphere. Use analog film photography, realistic film grain, slightly soft lens rendering, subtle film imperfections, natural skin texture, moderate contrast and vivid but believable film colors characteristic of 1980s photography.\n\nThe setting may resemble a colorful music-video set, recording studio, stage-inspired backdrop, nightclub environment, rehearsal space, colorful studio portrait or dramatic 1980s fashion setting. Keep the subject as the primary focus.\n\nPreserve the subject's general pose, body position, composition and framing unless minor adjustments are necessary to accommodate the new styling.\n\nThe final image should look like a genuine photograph from the 1980s pop era — bold, glamorous, colorful, energetic and unmistakably 1980s — rather than a modern photograph with a vintage filter.\n\nAvoid modern clothing, contemporary hairstyles, modern minimalist fashion, current sneakers, 1990s fashion, 2000s/Y2K styling, excessive futuristic sci-fi styling, generic vintage clothing, overly conservative formalwear, costume-like outfits, caricature, illustration, plastic-looking skin, excessive beauty retouching or alteration of the subject's identity.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  '90s': {
    id: '90s',
    label: '90s',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic 1990s retro photograph with relaxed period fashion and analog film look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic 1990s retro photograph with a distinctive 1990–1999 fashion and photographic aesthetic.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age and overall likeness. The subject must remain clearly recognizable as the same person.\n\nDress the subject in authentic 1990s fashion with a relaxed, youthful and unmistakably period-specific appearance. Use characteristic 1990s clothing such as loose-fitting jeans, high-waisted jeans, denim jackets, oversized shirts, graphic T-shirts, flannel shirts, bomber jackets, windbreakers, sweatshirts, hoodies, tracksuits, cargo trousers, casual dresses, slip dresses, crop tops, knitwear, leather jackets and relaxed streetwear.\n\nUse recognizable 1990s color palettes and styling, including denim blue, black, white, gray, burgundy, forest green, muted red, brown and occasional bright accent colors. Incorporate authentic period patterns such as plaid, stripes, simple geometric graphics, bold logos and graphic prints.\n\nAllow the styling to naturally represent different parts of 1990s fashion. It may lean toward casual streetwear, hip-hop-inspired fashion, grunge, sporty fashion, R&B-inspired fashion, minimalist fashion or colorful late-1990s youth fashion depending on what best suits the subject.\n\nFor women, incorporate appropriate 1990s elements such as relaxed denim, slip dresses, fitted tops, cardigans, crop tops, denim jackets, simple skirts, platform footwear, chokers, hair clips and period-appropriate hairstyles when suitable.\n\nFor men, incorporate appropriate 1990s elements such as loose jeans, oversized graphic shirts, flannel shirts, bomber jackets, tracksuits, denim jackets, hoodies, casual sneakers and period-appropriate hairstyles when suitable.\n\nAdapt clothing naturally to the subject's gender, age and proportions. Do not force the same outfit onto every subject. The styling should look like authentic everyday 1990s fashion rather than a costume or exaggerated caricature.\n\nInclude appropriate 1990s accessories such as baseball caps, bucket hats, sunglasses, watches, simple jewelry, backpacks and period-appropriate sneakers when suitable.\n\nThe photographic treatment should look authentically analog and period-specific: 1990s film photography, realistic film grain, slightly soft consumer-camera rendering, natural skin texture, subtle flash photography where appropriate, slightly imperfect exposure, muted or warm film colors and authentic 1990s photographic texture.\n\nThe setting may remain similar to the original photograph, but may naturally evoke a 1990s environment such as a suburban street, school setting, bedroom, shopping area, basketball court, urban street or simple studio portrait.\n\nPreserve the subject's general pose, body position, composition and framing unless minor adjustments are necessary to accommodate the period styling.\n\nThe final image should look like a genuine photograph originally taken during the 1990s, with unmistakable 1990s fashion and photographic characteristics rather than a modern photograph with a vintage filter.\n\nAvoid modern clothing, contemporary hairstyles, modern luxury fashion, overly polished digital photography, excessive 1980s styling, excessive 2000s/Y2K styling, generic \"old-fashioned\" clothing, costume-like outfits, caricature, illustration, plastic-looking skin, excessive beauty retouching or alteration of the subject's identity.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  '90s-hip-hop': {
    id: '90s-hip-hop',
    label: '90s Hip-hop',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic 1990s hip-hop portrait with oversized streetwear and analog film look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic 1990s hip-hop portrait with the distinctive fashion, styling and photographic character of 1990s hip-hop culture.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age and overall likeness. The subject must remain clearly recognizable as the same person.\n\nDress the subject in unmistakable 1990s hip-hop fashion with a relaxed, oversized and expressive streetwear aesthetic. Use characteristic clothing such as baggy jeans, oversized denim jackets, loose graphic T-shirts, oversized sweatshirts, hoodies, varsity jackets, bomber jackets, leather jackets, tracksuits, sports jerseys, basketball-inspired tops, cargo trousers, workwear-style jackets, flannel shirts and layered streetwear.\n\nUse bold but authentic 1990s colors including denim blue, black, white, red, forest green, burgundy, mustard, cream and deep purple. Incorporate large graphic prints, bold lettering-style graphics, color blocking, sports-inspired designs, plaid and other recognizable 1990s patterns.\n\nCreate a relaxed oversized silhouette with loose-fitting clothing, layered garments and authentic 1990s proportions. The clothing should feel naturally worn and street-oriented rather than tailored, polished or contemporary.\n\nInclude appropriate 1990s hip-hop accessories such as baseball caps, snapback-style caps, bucket hats, beanies, sunglasses, watches, thick chains, medallions, bracelets and other period-appropriate accessories when suitable. Use authentic 1990s athletic sneakers and high-top footwear.\n\nAdapt the styling naturally to the subject's gender, age and proportions. Do not force the same outfit or hairstyle onto every subject. Hairstyles and grooming should be appropriate to the 1990s and naturally suited to the subject.\n\nAllow the overall styling to draw from the different visual influences of 1990s hip-hop fashion, including streetwear, sportswear, East Coast and West Coast-inspired styles, urban casualwear and the fashion of the golden era of hip-hop, without reproducing the identity or appearance of any specific celebrity.\n\nCreate an authentic 1990s photographic atmosphere. Use analog film photography, realistic film grain, slightly soft consumer-camera rendering, natural skin texture, subtle flash photography, imperfect exposure, slightly muted film colors and authentic 1990s photographic texture.\n\nThe setting may naturally resemble a 1990s urban street, basketball court, neighborhood, record store, brick-wall backdrop, street corner, studio portrait or other period-appropriate environment. Keep the subject as the primary focus.\n\nPreserve the subject's general pose, body position, composition and framing unless minor adjustments are necessary to accommodate the new styling.\n\nThe final image should look like a genuine photograph taken during the 1990s hip-hop era — authentic, relaxed, oversized, confident and unmistakably 1990s — rather than a modern photograph with a vintage filter.\n\nAvoid modern streetwear, contemporary sneakers, modern hairstyles, modern luxury fashion, 2000s/Y2K aesthetics, futuristic styling, extremely skinny clothing, overly polished digital photography, generic vintage clothing, costume-like outfits, caricature, illustration, plastic-looking skin, excessive beauty retouching or alteration of the subject's identity.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  '90s-pop': {
    id: '90s-pop',
    label: '90s Pop',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic 1990s pop portrait with colorful music-video fashion and analog film look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic 1990s pop portrait with a distinctive 1990–1999 pop-culture, fashion and photographic aesthetic.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age and overall likeness. The subject must remain clearly recognizable as the same person.\n\nDress the subject in unmistakable 1990s pop fashion with a youthful, colorful, stylish and playful appearance. Use period-appropriate clothing such as fitted colorful tops, crop tops, denim jackets, denim skirts, high-waisted jeans, mini skirts, colorful dresses, slip dresses, fitted cardigans, cropped jackets, matching two-piece outfits, patterned shirts, lightweight knitwear and coordinated casual fashion.\n\nUse vibrant 1990s colors including pink, turquoise, purple, red, yellow, white, black, pastel blue and lime green. Incorporate authentic period patterns such as colorful stripes, floral prints, small geometric patterns, playful graphics, color blocking and simple 1990s fashion prints.\n\nAllow the styling to reflect the polished and playful fashion associated with 1990s pop music and music-video culture. Create coordinated outfits with fashionable layering, colorful accessories and expressive styling while keeping the appearance believable for the decade.\n\nFor women, incorporate appropriate 1990s pop-fashion elements such as colorful mini skirts, fitted tops, crop tops, slip dresses, denim, cardigans, hair clips, colorful accessories, small handbags and period-appropriate hairstyles.\n\nFor men, incorporate appropriate 1990s pop-fashion elements such as fitted or relaxed colorful shirts, denim jackets, graphic T-shirts, coordinated jackets, colorful knitwear, casual trousers and period-appropriate hairstyles.\n\nAdapt the clothing naturally to the subject's gender, age and proportions. Do not force the same outfit or hairstyle onto every subject. The styling should look like authentic 1990s pop fashion rather than a costume.\n\nInclude appropriate 1990s accessories such as colorful sunglasses, chokers, simple jewelry, hair accessories, watches, small bags, belts and period-appropriate sneakers or footwear when suitable.\n\nCreate a polished but authentic 1990s photographic appearance. Use analog film photography, realistic film grain, slightly soft film rendering, natural skin texture, subtle flash photography, moderate contrast, slightly warm or pastel film colors and authentic 1990s studio or music-video photography characteristics.\n\nThe setting may naturally resemble a colorful 1990s studio, music-video set, bedroom, recording environment, colorful backdrop, shopping area or simple fashion portrait setting. Keep the subject as the primary focus.\n\nPreserve the subject's general pose, body position, composition and framing unless minor adjustments are necessary to accommodate the period styling.\n\nThe final image should look like a genuine 1990s pop photograph — colorful, youthful, fashionable and unmistakably 1990s — rather than a modern photograph with a vintage filter.\n\nAvoid modern fashion, contemporary hairstyles, obvious Y2K styling, futuristic metallic clothing, excessive chrome, overly futuristic sunglasses, 2000s fashion, modern digital photography, generic vintage clothing, costume-like outfits, caricature, illustration, plastic-looking skin, excessive beauty retouching or alteration of the subject's identity.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  '2000s': {
    id: '2000s',
    label: '2000s',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic early-2000s Y2K photograph with youthful fashion and early digital-camera look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic early-to-mid 2000s retro photograph with a distinctive 2000–2009 fashion and photographic aesthetic.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age and overall likeness. The subject must remain clearly recognizable as the same person.\n\nDress the subject in unmistakable early-2000s fashion with a fashionable, youthful and visually distinctive Y2K-era appearance. Use characteristic clothing such as low-rise or mid-rise jeans, bootcut or flared jeans, cargo trousers, denim skirts, baby tees, fitted graphic T-shirts, cropped tops, camisoles, halter tops, fitted jackets, zip-up hoodies, velour tracksuits, denim jackets, leather jackets, mini skirts, coordinated two-piece outfits and layered casualwear.\n\nUse authentic early-2000s colors and materials including denim blue, pink, white, black, silver, metallic tones, baby blue, lavender, lime green and other bright accent colors. Incorporate period-specific details such as rhinestones, glitter accents, metallic fabrics, glossy materials, embroidered graphics, visible stitching, decorative belts, small logos and playful graphic designs.\n\nInclude recognizable 2000s accessories such as small tinted sunglasses, chunky jewelry, hoop earrings, charm bracelets, decorative belts, small shoulder bags, trucker-style caps, hair accessories and chunky or platform footwear when appropriate.\n\nFor women, allow styling such as low-rise jeans with fitted tops, baby tees, camisoles, cropped jackets, mini skirts, velour tracksuits, colorful accessories and period-appropriate hairstyles.\n\nFor men, use appropriate early-2000s fashion such as loose or relaxed jeans, cargo trousers, graphic T-shirts, tracksuits, zip-up jackets, denim jackets, oversized or fitted casual shirts, sporty clothing and period-appropriate accessories.\n\nAdapt the clothing naturally to the subject's gender, age and proportions. Do not force the same outfit or styling onto every subject. The fashion should feel like authentic early-2000s everyday or pop-culture fashion rather than an exaggerated costume.\n\nCreate an authentic early-2000s photographic appearance. Use consumer digital-camera or early digital photography characteristics, subtle flash, slightly harsh direct lighting where appropriate, realistic skin texture, mild digital noise, slightly imperfect exposure, modest image softness and the characteristic look of photographs taken with early-2000s digital cameras.\n\nThe setting may naturally resemble a shopping mall, bedroom, urban street, party, school environment, colorful studio, music-video setting or casual social photograph from the early 2000s. Keep the subject as the primary focus.\n\nPreserve the subject's general pose, body position, composition and framing unless minor adjustments are necessary to accommodate the new styling.\n\nThe final image should look like a genuine photograph taken during the early 2000s, with unmistakable Y2K/early-2000s fashion and photographic characteristics rather than a modern photograph with a retro filter.\n\nAvoid modern fashion, contemporary minimalist styling, current sneakers, modern smartphones, modern digital photography, 2010s or 2020s fashion, excessive futuristic sci-fi styling, excessive chrome, overly polished editorial photography, generic vintage clothing, costume-like outfits, caricature, illustration, plastic-looking skin, excessive beauty retouching or alteration of the subject's identity.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  '2000s-hip-hop': {
    id: '2000s-hip-hop',
    label: '2000s Hip-hop',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic early-2000s hip-hop portrait with polished streetwear and early digital-camera look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic early-to-mid 2000s hip-hop portrait with the distinctive fashion, styling and photographic character of 2000–2007 hip-hop culture.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age and overall likeness. The subject must remain clearly recognizable as the same person.\n\nDress the subject in unmistakable early-2000s hip-hop fashion with a confident, stylish and expressive streetwear aesthetic. Use characteristic clothing such as oversized or wide-leg jeans, baggy denim, cargo trousers, oversized graphic T-shirts, oversized hoodies, sports jerseys, basketball jerseys, varsity jackets, bomber jackets, leather jackets, tracksuits, velour tracksuits, zip-up jackets, denim jackets and layered streetwear.\n\nIncorporate the more polished and fashion-conscious side of early-2000s hip-hop. Use coordinated outfits, premium-looking streetwear, bold graphic designs, sports-inspired clothing, decorative stitching, embroidered details, contrasting fabrics and statement pieces.\n\nUse authentic 2000s colors including white, black, denim blue, red, navy, gray, brown, gold, silver and occasional bright colors. Incorporate period-specific details such as large graphic prints, bold lettering-style graphics, decorative stitching, camouflage patterns, pinstripes and athletic-inspired designs.\n\nInclude recognizable early-2000s hip-hop accessories such as fitted baseball caps, trucker-style caps, bandanas, oversized sunglasses, large watches, thick chains, pendants, bracelets, rings and other statement jewelry when appropriate. Use period-appropriate basketball sneakers, high-top sneakers, chunky athletic footwear or clean white sneakers.\n\nFor men, allow styling such as oversized jerseys, baggy or wide-leg jeans, fitted caps, oversized graphic shirts, tracksuits, varsity jackets, large chains and athletic sneakers.\n\nFor women, allow styling such as fitted or cropped tops, low-rise or wide-leg jeans, velour tracksuits, denim, fitted jackets, hoop earrings, statement jewelry, small shoulder bags and fashionable early-2000s streetwear.\n\nAdapt clothing naturally to the subject's gender, age and proportions. Do not force the same outfit or hairstyle onto every subject. Hairstyles and grooming should be appropriate to the early 2000s and naturally suited to the subject.\n\nCreate an authentic early-2000s photographic atmosphere. Use consumer digital-camera photography with direct on-camera flash, realistic early digital image quality, subtle digital noise, slightly harsh highlights, natural skin texture, mild image softness and the characteristic look of photographs and music-video promotional images from the early 2000s.\n\nThe setting may naturally resemble an urban street, recording studio, basketball court, nightclub-style backdrop, apartment, parking area, street corner, music-video location or simple studio portrait. Keep the subject as the primary focus.\n\nPreserve the subject's general pose, body position, composition and framing unless minor adjustments are necessary to accommodate the new styling.\n\nThe final image should look like a genuine photograph taken during the early 2000s hip-hop era — confident, stylish, street-oriented and unmistakably 2000s — rather than a modern photograph with a vintage filter.\n\nAvoid modern streetwear, contemporary sneakers, modern hairstyles, current luxury fashion, 2010s or 2020s aesthetics, excessive futuristic styling, excessive metallic sci-fi elements, generic 1990s hip-hop fashion, modern digital-camera quality, costume-like outfits, caricature, illustration, plastic-looking skin, excessive beauty retouching or alteration of the subject's identity.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  '2000s-pop': {
    id: '2000s-pop',
    label: '2000s Pop',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic early-2000s Y2K pop portrait with glossy music-video fashion and early digital-camera look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic early-to-mid 2000s pop portrait with a distinctive 2000–2007 Y2K pop-culture, fashion and photographic aesthetic.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age and overall likeness. The subject must remain clearly recognizable as the same individual.\n\nDress the subject in unmistakable early-2000s pop fashion with a youthful, glamorous, playful and fashion-forward appearance. Use characteristic Y2K pop clothing such as low-rise jeans, bootcut or flared jeans, denim skirts, mini skirts, fitted tops, baby tees, cropped tops, camisoles, halter tops, tube tops, fitted jackets, cropped denim jackets, velour tracksuits, coordinated two-piece outfits, fitted dresses and glossy or satin-like clothing.\n\nUse vibrant Y2K colors such as hot pink, baby blue, lavender, turquoise, white, silver, metallic gold, lime green, bright red and glossy black. Incorporate period-specific details such as rhinestones, glitter, sequins, metallic accents, glossy fabrics, decorative stitching, embroidered designs, playful graphics, small logos, sparkle details and colorful patterns.\n\nCreate coordinated and visually polished outfits inspired by early-2000s pop music and music-video fashion. The styling should feel glamorous and youthful without becoming a costume. Allow the model to naturally select different combinations of clothing, colors and accessories rather than repeating one standardized outfit.\n\nInclude appropriate Y2K accessories such as tiny tinted sunglasses, rhinestone jewelry, hoop earrings, charm bracelets, layered necklaces, decorative belts, small shoulder bags, hair clips, butterfly-style hair accessories and platform or chunky footwear when appropriate.\n\nFor women, allow authentic early-2000s pop styling such as low-rise jeans with fitted tops, coordinated two-piece outfits, mini skirts, cropped jackets, glossy fabrics, rhinestone details, colorful accessories and period-appropriate hairstyles.\n\nFor men, use authentic early-2000s pop fashion such as fitted or relaxed graphic shirts, denim, coordinated jackets, sporty casualwear, layered tops, statement accessories and period-appropriate hairstyles.\n\nAdapt the clothing naturally to the subject's gender, age and proportions. Do not force the same outfit, hairstyle or accessories onto every subject. Preserve the person's identity rather than altering their facial appearance to resemble a celebrity or pop star.\n\nCreate an authentic early-2000s photographic appearance using early digital-camera aesthetics: direct on-camera flash, slightly harsh highlights, realistic digital noise, mild image softness, subtle exposure imperfections, natural skin texture and the characteristic look of early-2000s personal photographs and pop-culture promotional photography.\n\nThe setting may resemble a colorful music-video set, bedroom, shopping mall, backstage area, studio backdrop, party environment or glossy early-2000s pop photoshoot. Keep the subject as the primary focus.\n\nPreserve the subject's general pose, body position, composition and framing unless minor adjustments are necessary to accommodate the new styling.\n\nThe final image should look like a genuine early-2000s pop photograph — glossy, colorful, youthful, playful and unmistakably Y2K — rather than a modern photograph with a retro filter.\n\nAvoid modern fashion, contemporary minimalist styling, current sneakers, modern hairstyles, 2010s or 2020s aesthetics, excessive futuristic sci-fi styling, excessive chrome, modern digital photography, generic vintage clothing, costume-like outfits, caricature, illustration, plastic-looking skin, excessive beauty retouching or alteration of the subject's identity.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'rock-n-roll': {
    id: 'rock-n-roll',
    label: 'Rock n Roll',
    categoryId: 'retro-nostalgia',
    description:
      'Authentic classic rock-and-roll portrait with rebellious leather-and-denim styling and analog film look',
    prompt:
      "Using the uploaded image as the only reference for the subject, transform the photograph into an authentic classic Rock & Roll portrait with a timeless rebellious rock aesthetic.\n\nPreserve the subject's exact identity and recognizable facial characteristics. Maintain their facial structure, proportions, skin tone, eyes, nose, lips, distinctive features, natural age and overall likeness. The subject must remain clearly recognizable as the same individual.\n\nDress the subject in authentic Rock & Roll fashion with a confident, rebellious and effortlessly cool appearance. Use characteristic rock styling such as leather jackets, denim jackets, distressed denim, fitted jeans, graphic or vintage-style band-inspired T-shirts, dark shirts, boots, flannel layers, vests, fitted jackets and other classic rock clothing.\n\nUse a strong palette of black, dark denim, charcoal, deep red, white, brown and muted earth tones, with occasional bold accents. Incorporate authentic rock-inspired details such as patches, studs, metal hardware, belts, chains, bracelets, rings, sunglasses and other understated statement accessories where appropriate.\n\nAdapt the clothing naturally to the subject's gender, age and proportions. The styling should feel authentic and effortlessly worn rather than like a theatrical costume. Do not force the same outfit or hairstyle onto every subject.\n\nGive the subject an appropriate rock-inspired hairstyle and grooming while preserving their natural identity and recognizable features. Hairstyles may range from longer textured hair and loose waves to classic short rock hairstyles, depending on what naturally suits the subject.\n\nCreate a timeless rock-and-roll photographic atmosphere using authentic analog photography, realistic film grain, natural skin texture, slightly imperfect exposure, atmospheric lighting, subtle film softness and rich photographic contrast.\n\nThe setting may naturally resemble a rehearsal studio, backstage area, recording studio, concert venue, garage, brick-wall location, street setting or simple dark studio backdrop. Keep the subject as the primary focus.\n\nPreserve the subject's general pose, body position, facial expression, composition and framing unless minor adjustments are necessary to accommodate the new styling.\n\nThe final image should look like a genuine rock-and-roll photograph with an authentic rebellious, confident and timeless character rather than a modern photograph with a simple vintage filter.\n\nAvoid modern fashion trends, futuristic styling, overly polished fashion-editorial aesthetics, excessive glamour, bright neon styling, formal business clothing, costume-like outfits, exaggerated hairstyles, caricature, illustration, plastic-looking skin, excessive beauty retouching or alteration of the subject's identity.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  'paper-cut': {
    id: 'paper-cut',
    label: 'Paper Cut',
    categoryId: 'art',
    description:
      'Exquisite layered paper cut artwork with die-cut cardstock depth and handcrafted diorama look',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into an exquisite layered paper cut artwork, preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics while recreating the entire scene exclusively from intricately cut sheets of colored paper.\n\nEvery visible element—including the person, clothing, hair, skin, accessories, background, ground, buildings, trees, sky, clouds, furniture, shadows, and every object in the composition—must be constructed entirely from layered paper cutouts. Nothing should appear painted, illustrated, photographed, or three-dimensional beyond the depth created by stacked paper layers.\n\nThe person's facial identity should be recreated using precisely cut paper shapes with smooth flowing curves, crisp edges, layered contours, and carefully arranged color pieces that preserve their recognizable features. Hair should consist of individually cut layered paper sections that follow the natural hairstyle while maintaining the handcrafted paper aesthetic.\n\nRecreate the person's original clothing entirely from layered colored paper, preserving the realistic design, fit, tailoring, folds, seams, collars, buttons, pockets, wrinkles, layered garments, and accessories. Every garment should clearly appear handcrafted from precisely cut paper with visible stacked layers and clean die-cut edges.\n\nConstruct the entire environment from multiple layers of colored cardstock with varying depths that create a rich dimensional effect. Buildings, trees, rocks, water, furniture, vehicles, plants, and every background element should all be assembled from stacked paper pieces with visible layer separation, creating a handcrafted diorama appearance.\n\nUse premium textured cardstock and craft paper with subtle paper fibers, matte surfaces, crisp cut edges, clean silhouettes, and realistic paper thickness. Layer the paper to create natural depth, soft paper shadows, and a convincing handcrafted composition while maintaining a cohesive color palette.\n\nIlluminate the artwork with soft studio lighting that enhances the paper textures, layered construction, delicate shadows between paper layers, and handcrafted craftsmanship. Use a top-down or slightly angled perspective, realistic contact shadows, premium macro photography, shallow depth of field, and a clean composition.\n\nHyper-realistic layered paper cut artwork, handcrafted papercraft, premium cardstock, intricate die-cut details, visible paper layers, authentic paper textures, dimensional paper relief, exceptional craftsmanship, faithful identity preservation, elegant composition, professional studio photography, every subject and object made entirely from paper, no paint, no plastic, no fabric, no wood, no metal, no realistic materials, no text, no logos, no watermarks, and no visual defects.",
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  'water-color': {
    id: 'water-color',
    label: 'Water Color',
    categoryId: 'paintings',
    description: 'Water color cartoon caricature style',
    prompt: 'make this a water color cartoon caricature',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  acrylic: {
    id: 'acrylic',
    label: 'Acrylic',
    categoryId: 'paintings',
    description: 'Acrylic painting portrait with bold brushstrokes and vibrant color',
    prompt: 'Make this an Acrylic Painting',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  gouache: {
    id: 'gouache',
    label: 'Gouache',
    categoryId: 'paintings',
    description: 'Gouache painting portrait with matte opaque washes and rich color',
    prompt: 'Make this a Gouache Painting',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  expressionist: {
    id: 'expressionist',
    label: 'Expressionist',
    categoryId: 'paintings',
    description: 'Expressionist painting portrait with bold brushwork and emotional color',
    prompt: 'make this an Expressionist painting',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  impressionist: {
    id: 'impressionist',
    label: 'Impressionist',
    categoryId: 'paintings',
    description: 'Impressionist painting portrait with soft brushstrokes and luminous color',
    prompt: 'make this an Impressionist painting',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  baroque: {
    id: 'baroque',
    label: 'Baroque',
    categoryId: 'paintings',
    description: 'Baroque portrait painting with dramatic lighting and rich classical detail',
    prompt: 'make this a Baroque Portrait painting',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  'van-gogh': {
    id: 'van-gogh',
    label: 'Van Gogh',
    categoryId: 'paintings',
    description: 'Van Gogh style painting with expressive brushstrokes and vivid swirling color',
    prompt:
      'An expressive Post-Impressionist oil painting featuring thick impasto brushstrokes, swirling directional paint strokes, vibrant complementary colors, textured canvas, energetic movement, dramatic lighting, bold painterly texture. Preserve the uploaded person\'s exact facial identity, age, hairstyle, facial structure, expression, and clothing. Transform only the artistic rendering, not the person\'s identity.',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  'expressive-impasto': {
    id: 'expressive-impasto',
    label: 'Expressive Impasto V1',
    categoryId: 'paintings',
    description: 'Expressive impasto oil painting with thick brushstrokes, vivid color, and dramatic post-impressionist texture',
    prompt:
      'An expressive Post-Impressionist oil painting featuring thick impasto brushstrokes, swirling directional paint strokes, vibrant complementary colors, textured canvas, energetic movement, dramatic lighting, bold painterly texture. Preserve the uploaded person\'s exact facial identity, age, hairstyle, facial structure, expression, and clothing. Transform only the artistic rendering, not the person\'s identity.',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'expressive-impasto-v2': {
    id: 'expressive-impasto-v2',
    label: 'Expressive Impasto V2',
    categoryId: 'paintings',
    description: 'Expressive impasto oil painting with thick brushstrokes, vivid color, and dramatic post-impressionist texture',
    prompt:
      'An expressive Post-Impressionist oil painting featuring thick impasto brushstrokes, swirling directional paint strokes, vibrant complementary colors, textured canvas, energetic movement, dramatic lighting, bold painterly texture. Preserve the uploaded person\'s exact facial identity, age, hairstyle, facial structure, expression, and clothing. Transform only the artistic rendering, not the person\'s identity.',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  monet: {
    id: 'monet',
    label: 'Monet',
    categoryId: 'paintings',
    description: 'Monet style painting with soft impressionist light and delicate color',
    prompt: 'using this pic make this a monet style Painting',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  renoir: {
    id: 'renoir',
    label: 'Renoir',
    categoryId: 'paintings',
    description: 'Renoir inspired painting with warm impressionist tones and soft brushwork',
    prompt: 'using this pic make this a Renoir Inspired Painting',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  cezanne: {
    id: 'cezanne',
    label: 'Cézanne',
    categoryId: 'paintings',
    description: 'Cézanne inspired painting with structured forms and post-impressionist color',
    prompt: 'using this pic make this a Cézanne Inspired Painting',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  gauguin: {
    id: 'gauguin',
    label: 'Gauguin',
    categoryId: 'paintings',
    description: 'Gauguin inspired painting with bold color and post-impressionist tropical mood',
    prompt: 'using this pic make this a Gauguin Inspired Painting',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  matisse: {
    id: 'matisse',
    label: 'Matisse',
    categoryId: 'paintings',
    description: 'Matisse inspired painting with bold flat color and expressive fauvist forms',
    prompt: 'using this pic make this a Matisse Inspired Painting',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  seurat: {
    id: 'seurat',
    label: 'Seurat',
    categoryId: 'paintings',
    description: 'Seurat inspired painting with pointillist dots and luminous neo-impressionist color',
    prompt: 'using this pic make this a Seurat Inspired Painting',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'ink-wash': {
    id: 'ink-wash',
    label: 'Ink-Wash',
    categoryId: 'paintings',
    description: 'Ink wash painting with fluid brushstrokes and delicate tonal washes',
    prompt: 'using this pic make this a Ink Wash Painting',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  impasto: {
    id: 'impasto',
    label: 'Impasto',
    categoryId: 'paintings',
    description: 'Impasto painting with thick textured brushstrokes and rich layered paint',
    prompt: 'using this pic make all subjects as an Impasto Painting',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'hokusai-v1': {
    id: 'hokusai-v1',
    label: 'Hokusai V1',
    categoryId: 'paintings',
    description: 'Hokusai inspired painting with bold ukiyo-e lines and dramatic composition',
    prompt: 'using this pic make all subjects as a Hokusai Inspired Painting',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'hokusai-v2': {
    id: 'hokusai-v2',
    label: 'Hokusai V2',
    categoryId: 'paintings',
    description: 'Hokusai inspired painting with vivid woodblock color and expressive brushwork',
    prompt: 'using this pic make all subjects as a Hokusai Inspired Painting',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  hiroshige: {
    id: 'hiroshige',
    label: 'Hiroshige',
    categoryId: 'paintings',
    description: 'Hiroshige inspired painting with elegant ukiyo-e landscapes and refined color',
    prompt: 'using this pic make all subjects as a Hiroshige Inspired Painting, no extra text, no change of clothing, no background change.',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  sesshu: {
    id: 'sesshu',
    label: 'Sesshū',
    categoryId: 'paintings',
    description: 'Sesshū inspired painting with ink-wash landscapes and meditative composition',
    prompt: 'using this pic make all subjects as a Sesshū Inspired Painting in color, no extra text',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'wc-marker': {
    id: 'wc-marker',
    label: 'Watercolor Marker',
    categoryId: 'paintings',
    description: 'Watercolor marker portrait with loose washes and crisp ink-marker edges',
    prompt: "Using the attached image as a reference create stylish dynamic stylized portrait of a person head, drawn with art watercolor markers. Use only one [color] color family in contrasting shades: a bright vivid shade for the crucial contour lines and details, a very light pastel shade for soft volume and shadows. Maximize the use of white paper (negative space). No dark colors. Marker strokes do not overlap, use long smooth dynamic lines where possible. Stylish perspective and camera angle. Only essential details. Slight paper texture is visible under the strokes, the rest is clean white. Bold, graphic, juicy",
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  'pixar-like': {
    id: 'pixar-like',
    label: 'Pixar-like',
    categoryId: '3d-characters',
    description: 'Pixar-like cartoon style including background',
    prompt: 'make this a pixar-like cartoon including the background',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  'funko-pop': {
    id: 'funko-pop',
    label: 'Funko Pop',
    categoryId: '3d-characters',
    description:
      'Premium vinyl Funko Pop–style collectible figure with oversized head and commercial product photography',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the person into a premium vinyl collectible figure inspired by the iconic Funko Pop aesthetic while maintaining their recognizable facial features, hairstyle, skin tone, facial hair (if applicable), clothing, accessories, and overall personality.\n\nThe character has the classic collectible proportions: an oversized rounded head occupying approximately half the figure's total height, a compact simplified body, short limbs, and slightly enlarged hands and feet. The face features large glossy solid-black circular eyes without visible pupils, simplified eyebrows, a minimal nose, and a subtle stylized smile or neutral expression while preserving the person's unique likeness. The figure has a smooth matte vinyl finish with subtle satin highlights and finely sculpted details.\n\nFaithfully recreate the person's hairstyle with simplified sculpted strands and clean vinyl contours. Reproduce all distinctive clothing, shoes, jewellery, glasses, watches, hats, or accessories in miniature collectible form using simplified yet highly recognizable sculpting. Preserve colour accuracy while slightly simplifying textures to resemble moulded vinyl.\n\nThe figure stands confidently on a transparent round display base with balanced proportions and museum-quality craftsmanship. Every detail resembles a professionally manufactured designer vinyl collectible, including clean seam lines, crisp paint application, smooth rounded edges, premium mould quality, realistic vinyl materials, subtle surface reflections, and highly detailed sculpting.\n\nThe scene is photographed as premium commercial product photography on a clean tabletop or studio surface with soft diffused lighting, realistic contact shadows, gentle reflections, shallow depth of field, and a professional 85mm product lens. Ultra-photorealistic, 8K quality, sharp focus on the figure, commercial advertising aesthetic, realistic materials and textures, clean composition, no packaging, no logos, no text, no watermarks, and no visual defects.",
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  aardman: {
    id: 'aardman',
    label: 'Aardman',
    categoryId: '3d-characters',
    description:
      'Grotesque humorous Aardman-style claymation 3D scene preserving original composition',
    prompt:
      'Create a highly detailed 3D interpretation of the reference image while **strictly preserving the exact spatial arrangement of all objects, their scale, rotations, positions, and the overall structural composition.**\n\n**Do not move, add, or remove any elements.** Instead, translate the entire image into a grotesque, humorous clay world while preserving the original scene and its visual logic.\n\n### Style\n\nThe style should be **extremely caricatured**, reminiscent of **Aardman Animations**, with an absurdist tone.\n\nThe characters should appear deliberately ridiculous, featuring:\n\n* Wildly disproportionate bodies\n* Rubbery, noodle-like limbs\n* Bulging "ping-pong ball" eyes, slightly pointing in different directions\n* Huge toothy smiles with unnaturally large rectangular teeth\n* Clearly visible pink gums\n\nEach character should look intentionally comical.\n\n### Texture & Aesthetic\n\nEverything should appear to be sculpted from **heavy, matte modeling clay (plasticine).**\n\nThe geometry should be intentionally uneven and imperfect:\n\n* No straight lines\n* No perfectly sharp edges\n* No sterile smoothness\n\nEvery surface should feel hand-sculpted, with visible waviness and rough, organic forms.\n\nThe material should display pronounced tactile imperfections, including:\n\n* Deep dirty fingerprints\n* Random fingernail scratches\n* Rough seams\n* Fine cracks\n* Tiny dust particles\n* Lint fibers\n* Small bits of debris stuck to the clay surface\n\n### Overall Feel\n\nThe final result should evoke a **funny, bizarre, slightly unsettling, yet vibrant and tangible claymation world**, rendered as a richly detailed 3D image with maximum visual detail.',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'modern-animation': {
    id: 'modern-animation',
    label: 'Modern Animation',
    categoryId: '3d-characters',
    description:
      'Warm high-end modern animated feature-film character with soft stylization and cinematic lighting',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into a charming high-end animated feature film character, preserving their recognizable facial features, hairstyle, beard, skin tone, eye colour, clothing, accessories, and personality.\n\nReimagine the character with warm, appealing proportions: a slightly oversized head, expressive large eyes with natural irises, softly rounded cheeks, a friendly smile, simplified facial anatomy, and subtle stylization while maintaining the person's unmistakable identity. Avoid caricature-like distortion or exaggerated facial features.\n\nSculpt the hair as soft, flowing strands with layered volume, natural movement, and silky textures. Facial hair should appear neatly groomed with stylized yet realistic individual strands that blend seamlessly into the character's face.\n\nThe clothing should retain its original design while being recreated with premium animated-film quality, featuring soft fabrics, clean stitching, subtle wrinkles, realistic cloth simulation, and vibrant colours.\n\nRender the character as a premium stylized 3D model with smooth topology, high-quality skin shaders, subtle subsurface scattering, realistic fabric materials, soft global illumination, ambient occlusion, cinematic rim lighting, and polished studio-quality rendering.\n\nThe overall aesthetic should feel warm, inviting, expressive, and emotionally engaging, with rounded forms, appealing silhouettes, and elegant proportions typical of modern family animated feature films.\n\nPlace the character against a clean softly blurred gradient background with warm cinematic lighting, shallow depth of field, soft shadows, premium colour grading, ultra-clean composition, commercial-quality character render, highly detailed textures, photorealistic 3D materials, 8K quality, no text, no logos, no watermarks, and no visual defects.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'carved-stone': {
    id: 'carved-stone',
    label: 'Carved Stone',
    categoryId: 'sculptures',
    description:
      'Museum-quality carved white marble portrait sculpture with authentic stone texture and classical craftsmanship',
    prompt:
      "Preserve the uploaded person's identity exactly. Create a 64K ultra-DSLR museum-quality carved stone portrait of the uploaded person, shown from the chest up with a calm, dignified, and serene expression. Maintain their exact facial features, hairstyle, skin tone (translated naturally into stone form), facial structure, age, and any distinctive characteristics, ensuring they remain instantly recognizable.\n\nSculpt the entire portrait from premium white marble or finely carved natural stone, featuring authentic marble veining, realistic stone grain, subtle mineral variations, delicate surface cracks, gentle weathering, smooth chisel marks, and expertly polished planes. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, earrings, hats, or jewelry—should be faithfully recreated as beautifully hand-carved stone elements that integrate seamlessly into the sculpture.\n\nIlluminate the sculpture with soft museum-quality lighting that accentuates the marble veins, carved details, polished surfaces, and subtle textures. Use gentle rim lighting, realistic ambient shadows, shallow depth of field, and a clean gallery-style background to create a timeless, majestic atmosphere.\n\nHyper-realistic stone sculpture, masterful classical craftsmanship, Renaissance-inspired marble artistry, ultra-detailed textures, photorealistic museum photography, premium sculptural quality, cinematic lighting, extraordinary realism, 64K resolution, no text, no logos, no watermarks, and no visual defects.",
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  marble: {
    id: 'marble',
    label: 'Marble',
    categoryId: 'sculptures',
    description:
      'Museum-quality white marble statue portrait with authentic veining and classical Renaissance craftsmanship',
    prompt:
      "Preserve the uploaded person's identity exactly. Create a 64K ultra-DSLR museum-quality Marble Statue portrait of the uploaded person, shown from the chest up with a calm, dignified, and serene expression. Maintain their exact facial features, hairstyle, skin tone (translated naturally into stone form), facial structure, age, and any distinctive characteristics, ensuring they remain instantly recognizable.\n\nSculpt the entire portrait from premium white marble or finely carved natural stone, featuring authentic marble veining, realistic stone grain, subtle mineral variations, delicate surface cracks, gentle weathering, smooth chisel marks, and expertly polished planes. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, earrings, hats, or jewelry—should be faithfully recreated as beautifully hand-carved stone elements that integrate seamlessly into the sculpture.\n\nIlluminate the sculpture with soft museum-quality lighting that accentuates the marble veins, carved details, polished surfaces, and subtle textures. Use gentle rim lighting, realistic ambient shadows, shallow depth of field, and a clean gallery-style background to create a timeless, majestic atmosphere.\n\nHyper-realistic stone sculpture, masterful classical craftsmanship, Renaissance-inspired marble artistry, ultra-detailed textures, photorealistic museum photography, premium sculptural quality, cinematic lighting, extraordinary realism, 64K resolution, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'black-granite': {
    id: 'black-granite',
    label: 'Black Granite',
    categoryId: 'sculptures',
    description:
      'Museum-quality black granite portrait sculpture with polished stone texture and classical craftsmanship',
    prompt:
      "Preserve the uploaded person's identity exactly. Create a 64K ultra-DSLR museum-quality Black granite portrait sculpture of the uploaded person, shown from the chest up with a calm, dignified, and serene expression. Maintain their exact facial features, hairstyle, skin tone (translated naturally into stone form), facial structure, age, and any distinctive characteristics, ensuring they remain instantly recognizable.\n\nSculpt the entire portrait from premium white marble or finely carved natural stone, featuring authentic marble veining, realistic stone grain, subtle mineral variations, delicate surface cracks, gentle weathering, smooth chisel marks, and expertly polished planes. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, earrings, hats, or jewelry—should be faithfully recreated as beautifully hand-carved stone elements that integrate seamlessly into the sculpture.\n\nIlluminate the sculpture with soft museum-quality lighting that accentuates the marble veins, carved details, polished surfaces, and subtle textures. Use gentle rim lighting, realistic ambient shadows, shallow depth of field, and a clean gallery-style background to create a timeless, majestic atmosphere.\n\nHyper-realistic stone sculpture, masterful classical craftsmanship, Renaissance-inspired marble artistry, ultra-detailed textures, photorealistic museum photography, premium sculptural quality, cinematic lighting, extraordinary realism, 64K resolution, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'weathered-limestone': {
    id: 'weathered-limestone',
    label: 'Weathered Limestone',
    categoryId: 'sculptures',
    description:
      'Majestic weathered limestone sculpture with porous ivory stone texture and refined museum display',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into a majestic weathered limestone sculpture, preserving their recognizable facial features, hairstyle, facial structure, expression, age, and distinctive characteristics while faithfully translating them into expertly carved limestone.\n\nSculpt the entire figure from authentic weathered limestone with warm ivory, cream, and pale beige tones. The stone should display realistic limestone grain, natural mineral deposits, porous textures, subtle fossil-like inclusions, gentle colour variation, and authentic surface weathering. Include fine hairline cracks, softened edges, tiny chips, shallow pitting, delicate erosion, subtle tool marks, and naturally aged patina while keeping the sculpture elegant and highly detailed.\n\nCarefully sculpt every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses or jewellery—using refined hand-carved stone craftsmanship. Preserve the person's identity with realistic sculptural precision while giving the surface the appearance of centuries-old limestone.\n\nClothing should faithfully preserve the person's original outfit, recreated entirely as carved limestone with realistic folds, layered fabric textures, decorative details, crisp chisel work, and naturally weathered edges.\n\nPresent the sculpture on a simple stone pedestal in a clean, minimalist gallery or museum display with an uncluttered neutral background. The environment should remain subtle and unobtrusive, ensuring the sculpture is the sole focus of the composition.\n\nIlluminate the sculpture with soft diffused museum lighting that accentuates the limestone's porous texture, mineral veins, weathered surfaces, carved details, and natural depth. Use realistic contact shadows, shallow depth of field, premium product-style photography, and a clean composition.\n\nHyper-realistic weathered limestone sculpture, masterful stone craftsmanship, authentic porous limestone, elegant natural ageing, refined sculptural detail, premium museum photography, cinematic lighting, ultra-detailed textures, extraordinary realism, 64K resolution, no ancient ruins, no Roman architecture, no Greek columns, no temples, no outdoor scenery, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  sandstone: {
    id: 'sandstone',
    label: 'Sand Stone',
    categoryId: 'sculptures',
    description:
      'Warm golden sandstone portrait sculpture with sedimentary grain and museum-quality craftsmanship',
    prompt:
      "Preserve the uploaded person's identity exactly. Create a 64K ultra-DSLR museum-quality sandstone sculpture of the uploaded person, shown from the chest up with a calm, dignified, and serene expression. Maintain their exact facial features, hairstyle, facial structure, age, and distinctive characteristics, ensuring they remain instantly recognizable.\n\nSculpt the entire portrait from authentic natural sandstone featuring warm golden, tan, ochre, and light amber tones. The stone should display realistic sandstone grain, fine sedimentary layers, natural mineral banding, subtle colour variations, and a slightly rough matte texture. Include delicate chisel marks, crisp carved edges, soft weathering, tiny surface pits, fine hairline cracks, and gently worn details that reflect masterful stone craftsmanship while preserving the sculpture's elegance.\n\nEvery facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, earrings, hats, or jewellery—should be meticulously hand-carved from sandstone, maintaining the person's unique identity. Hair should appear as carefully sculpted layered stone strands with realistic carved texture, while facial hair should be represented through refined stone detailing.\n\nClothing should faithfully preserve the person's original outfit while transforming every fabric fold, seam, collar, button, accessory, and decorative element into beautifully carved sandstone with layered relief, crisp chiselling, and natural stone texture.\n\nPresent the sculpture on a simple sandstone pedestal against a clean neutral studio or museum-style background that keeps the focus entirely on the artwork. Avoid historical ruins, temples, columns, or elaborate scenery.\n\nIlluminate the sculpture with soft museum-quality lighting that enhances the warm earthy colours, sedimentary layers, carved details, natural stone grain, and realistic textures. Use gentle rim lighting, realistic contact shadows, shallow depth of field, premium gallery photography, and a clean minimalist composition.\n\nHyper-realistic sandstone sculpture, masterful stone carving, authentic sedimentary stone textures, warm natural earth tones, refined sculptural craftsmanship, museum-quality photography, cinematic lighting, ultra-detailed realism, premium gallery presentation, 64K resolution, no ancient ruins, no Roman architecture, no Greek columns, no temples, no outdoor scenery, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'sand-sculpture': {
    id: 'sand-sculpture',
    label: 'Sand',
    categoryId: 'sculptures',
    description:
      'Life-sized golden beach sand sculpture with intricate carving and shoreline setting',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into an extraordinary life-sized sand sculpture, faithfully preserving their recognizable facial features, hairstyle, facial structure, age, expression, clothing, accessories, and distinctive characteristics.\n\nSculpt the entire figure from finely compacted golden beach sand with exceptional realism and masterful craftsmanship. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, hats, jewellery, or watches—should be intricately carved from sand while maintaining the person's unmistakable identity.\n\nRecreate the person's original clothing entirely in sculpted sand, capturing realistic fabric folds, seams, collars, buttons, pockets, wrinkles, layered garments, and accessories with precise hand-carved detail. The sculpture should exhibit crisp edges, delicate relief work, and finely sculpted textures that demonstrate the skill of a world-class sand artist.\n\nThe sand should display authentic granular texture, compacted sculpting, subtle colour variation, tiny grains, soft natural imperfections, and realistic moisture that helps hold the sculpture together. Include finely carved details, gentle tool marks, sharp contours, and intricate surface textures while avoiding excessive erosion or damage.\n\nPosition the sculpture naturally on smooth beach sand near the shoreline, with the ocean and sky softly blurred in the background so they complement rather than dominate the composition. The environment should remain clean and uncluttered, ensuring the sculpture is the primary focus.\n\nIlluminate the sculpture with warm natural sunlight that enhances the sand's texture, depth, and intricate carvings. Soft directional lighting should create realistic highlights and shadows that emphasize the fine sculptural detail. Use shallow depth of field, premium outdoor photography, natural colour grading, and a clean composition.\n\nHyper-realistic professional sand sculpture, authentic beach sand textures, world-class sand art craftsmanship, ultra-detailed carving, realistic granular materials, museum-quality artistic presentation, exceptional realism, soft natural lighting, premium photography, faithful identity preservation, clean composition, no crowds, no beach umbrellas, no distractions, no text, no logos, no watermarks, and no visual defects.",
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  'bronze-cast': {
    id: 'bronze-cast',
    label: 'Bronze',
    categoryId: 'sculptures',
    description:
      'Magnificent cast bronze sculpture with warm metallic tones, aged patina, and museum display',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into a magnificent cast bronze sculpture, preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural accuracy.\n\nRender the entire figure as expertly cast solid bronze, showcasing authentic metallic surfaces with rich warm bronze tones, subtle golden highlights, natural oxidation, and realistic aged patina. The sculpture should display intricate cast-metal details, delicate surface variations, fine tooling marks, and the refined craftsmanship of a master bronze sculptor.\n\nFaithfully recreate every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, jewellery, hats, or watches—as beautifully sculpted bronze elements while maintaining the person's unmistakable identity. Hair should appear as individually sculpted flowing bronze strands with elegant metallic texture and depth.\n\nTransform the person's original clothing into cast bronze while preserving every fold, seam, button, collar, pocket, and accessory with remarkable sculptural precision. The fabric should appear translated into flowing bronze drapery with crisp edges, realistic relief, and subtle casting details.\n\nThe bronze surface should exhibit authentic foundry craftsmanship, including a smooth polished finish on prominent surfaces, slightly textured recessed areas, delicate cast-metal grain, realistic oxidation, soft verdigris accents in deep crevices, and gentle wear that enhances realism without obscuring detail.\n\nPresent the sculpture on a simple dark stone pedestal against a clean, neutral museum or gallery background that keeps the artwork as the sole focus.\n\nIlluminate the sculpture with soft museum-quality lighting that enhances the bronze's rich metallic reflections, polished highlights, aged patina, and intricate sculptural details. Use realistic contact shadows, subtle rim lighting, shallow depth of field, premium gallery photography, and a clean, elegant composition.\n\nHyper-realistic cast bronze sculpture, authentic metallic materials, masterful foundry craftsmanship, refined sculptural detail, realistic bronze patina, subtle verdigris oxidation, museum-quality professional photography, premium artistic presentation, exceptional realism, faithful identity preservation, clean composition, no historical monuments, no outdoor statues, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  jade: {
    id: 'jade',
    label: 'Jade',
    categoryId: 'sculptures',
    description:
      'Exquisite hand-carved jade sculpture with polished translucency, mineral inclusions, and museum display',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into an exquisite hand-carved jade sculpture, preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.\n\nSculpt the entire figure from a single piece of authentic natural jade, showcasing smooth polished surfaces, subtle translucency, realistic mineral inclusions, delicate colour gradients, and natural stone variations. The jade should exhibit rich emerald green, soft celadon, white, or pale green tones with authentic marbling, cloudy inclusions, and crystalline depth characteristic of premium jade.\n\nFaithfully recreate every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, jewellery, hats, or watches—as finely carved jade while maintaining the person's unmistakable identity. Hair should be elegantly sculpted with flowing carved strands and smooth polished contours, reflecting the meticulous craftsmanship of a master jade artisan.\n\nTransform the person's original clothing into beautifully carved jade, preserving every fold, seam, collar, button, pocket, and accessory. The garments should appear delicately sculpted with graceful flowing lines, crisp relief, and refined ornamental detail, while retaining the clean polished finish characteristic of hand-finished jade carvings.\n\nThe jade should display authentic mineral veining, subtle translucency around thinner carved sections, natural crystalline depth, smooth rounded edges, flawless polishing, and intricate hand-carved details. The sculpture should convey elegance, luxury, and timeless artistry while remaining completely faithful to the person's identity.\n\nPresent the sculpture on a simple polished black stone pedestal against a clean, neutral museum or gallery background, allowing the jade carving to remain the sole focus of the composition.\n\nIlluminate the sculpture with soft museum-quality lighting that gently passes through the thinner edges of the jade, revealing its natural translucency, internal mineral structure, and polished surfaces. Use subtle rim lighting, realistic contact shadows, shallow depth of field, premium gallery photography, and a refined minimalist composition.\n\nHyper-realistic jade carving, authentic nephrite or jadeite material, masterful gemstone craftsmanship, premium polished finish, realistic translucency, natural mineral inclusions, luxurious sculptural artistry, museum-quality professional photography, exceptional realism, faithful identity preservation, clean composition, no historical temples, no ornate backgrounds, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  ivory: {
    id: 'ivory',
    label: 'Ivory',
    categoryId: 'sculptures',
    description:
      'Exquisite ivory-inspired carved sculpture with creamy faux ivory finish and museum display',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into an exquisite ivory-inspired carved sculpture, preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.\n\nSculpt the entire figure from luxurious faux ivory, featuring a warm creamy-white colour with subtle ivory tones, a smooth satin finish, delicate natural-looking grain, gentle ageing, and soft lustre. The material should resemble finely carved antique ivory while clearly appearing as an artistic, non-animal material.\n\nFaithfully recreate every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, jewellery, hats, or watches—as beautifully hand-carved ivory-inspired elements while maintaining the person's unmistakable identity. Hair should consist of elegant flowing carved strands with refined detailing and polished contours.\n\nTransform the person's original clothing into intricately carved faux ivory, preserving every fold, seam, collar, button, pocket, and decorative element with exceptional craftsmanship. The garments should display graceful relief carving, crisp detailing, and refined ornamental textures while maintaining a smooth polished finish.\n\nThe sculpture should exhibit master artisan craftsmanship with delicate relief work, refined carving depth, smooth rounded edges, subtle engraved details, and a premium polished surface. The material should possess a gentle translucent quality under light, adding depth and elegance without appearing like plastic or stone.\n\nPresent the sculpture on a simple dark wooden or black stone pedestal against a clean neutral museum-style background that keeps the sculpture as the sole focus.\n\nIlluminate the sculpture with soft museum-quality lighting that enhances the warm creamy tones, polished surfaces, delicate carved details, and subtle translucency of the faux ivory. Use gentle rim lighting, realistic contact shadows, shallow depth of field, premium gallery photography, and a refined minimalist composition.\n\nHyper-realistic ivory-inspired sculpture, masterful artisan carving, luxurious faux ivory material, elegant polished finish, refined ornamental craftsmanship, museum-quality professional photography, exceptional realism, faithful identity preservation, clean composition, no real animal ivory, no ornate historical backgrounds, no text, no logos, no watermarks, and no visual defects.",
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  crystal: {
    id: 'crystal',
    label: 'Crystal',
    categoryId: 'sculptures',
    description:
      'Hand-carved colored crystal sculpture with transparency, refraction, and gemstone-inspired brilliance',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into a breathtaking hand-carved crystal sculpture, preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.\n\nSculpt the entire figure from a single block of premium colored crystal, faithfully recreating every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—while maintaining the person's unmistakable identity. Every detail should be expertly carved with crisp precision and elegant craftsmanship.\n\nThe sculpture should be carved from a single piece of premium crystal in a randomly selected gemstone-inspired color. Each generation should use a unique crystal color while maintaining realistic transparency, subtle natural color variation, internal refractions, crystalline depth, brilliant reflections, delicate light dispersion, and flawlessly polished surfaces.\n\nRecreate the person's original clothing entirely in crystal while preserving every fold, seam, collar, button, pocket, wrinkle, layered garment, and accessory. The flowing forms should appear elegantly sculpted with refined contours, polished surfaces, and intricate craftsmanship that captures the beauty of precision crystal carving.\n\nThe sculpture should display authentic crystal characteristics, including brilliant reflections, realistic optical distortion through thicker sections, subtle internal inclusions, sparkling highlights, finely beveled edges, smooth polished contours, and natural light refraction that enhances the richness of the colored crystal.\n\nPresent the sculpture against a clean, minimalist background that keeps the crystal artwork as the sole focus. The composition should be elegant and uncluttered, allowing the crystal's transparency, color, and brilliance to dominate the image.\n\nIlluminate the sculpture with carefully positioned studio lighting that maximizes realistic reflections, refractions, color brilliance, internal sparkle, and shimmering highlights throughout the crystal. Use realistic contact shadows, shallow depth of field, premium professional photography, elegant composition, and photorealistic rendering that showcases the crystal's extraordinary optical beauty.\n\nHyper-realistic colored crystal sculpture, authentic transparent crystal material, masterful crystal craftsmanship, vibrant gemstone-inspired colors, exceptional optical realism, polished crystal surfaces, realistic light refraction, brilliant reflections, sparkling highlights, luxurious artistic presentation, premium studio photography, faithful identity preservation, clean minimalist composition, no fantasy magic, no glowing energy effects, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  ice: {
    id: 'ice',
    label: 'Ice',
    categoryId: 'sculptures',
    description:
      'Life-sized hand-carved ice sculpture with crystal-clear frozen texture and winter setting',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into a breathtaking hand-carved ice sculpture, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.\n\nSculpt the entire person as a magnificent life-sized ice sculpture in a natural standing, sitting, walking, or expressive pose that complements their appearance. Faithfully recreate every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—while maintaining the person's unmistakable identity.\n\nThe sculpture should be carved from a single block of pristine crystal-clear ice or naturally tinted ice, with the ice color chosen randomly for each generation. Each image should feature a unique icy hue, such as crystal clear, icy blue, frosted white, turquoise, pale emerald, lavender, soft pink, golden champagne, or other realistic frozen tones. The ice should exhibit exceptional transparency, subtle translucency, delicate internal frost patterns, trapped air bubbles, natural crystalline textures, and beautifully polished carved surfaces.\n\nRecreate the person's original clothing entirely in ice while preserving every fold, seam, collar, button, pocket, wrinkle, layered garment, and accessory with remarkable sculptural detail. Clothing should appear elegantly carved with flowing contours and crisp edges while retaining the unmistakable appearance of solid ice.\n\nThe sculpture should display authentic ice characteristics, including razor-sharp carved edges, smooth polished surfaces, realistic frozen textures, subtle internal cracks, delicate frost along selected edges, naturally trapped bubbles, intricate crystalline formations, and convincing light refraction through thicker sections. The sculpture should appear freshly carved, perfectly preserved, and remarkably lifelike.\n\nPosition the sculpture outdoors on a clean snow-covered surface or a simple ice pedestal with a softly blurred winter landscape in the background. The environment should remain uncluttered so the sculpture is the unmistakable focal point.\n\nIlluminate the sculpture with soft natural winter light or cool studio lighting that enhances transparency, reflections, internal refractions, shimmering highlights, and crystalline detail. Use realistic contact shadows, shallow depth of field, premium professional photography, elegant composition, and photorealistic rendering that emphasizes the beauty of carved ice.\n\nHyper-realistic hand-carved ice sculpture, authentic frozen materials, exceptional ice carving craftsmanship, realistic crystalline textures, polished transparent ice, subtle frost patterns, natural light refraction, premium professional photography, faithful identity preservation, elegant composition, no fantasy magic, no glowing energy effects, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  metal: {
    id: 'metal',
    label: 'Metal',
    categoryId: 'sculptures',
    description:
      'Life-sized handcrafted metal sculpture with random premium finishes and realistic reflections',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into an extraordinary handcrafted metal sculpture, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.\n\nSculpt the entire person as a life-sized metal artwork in a natural standing, sitting, walking, or expressive pose that complements their appearance. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—should be meticulously sculpted while maintaining the person's unmistakable identity.\n\nThe sculpture should be crafted from a randomly selected premium metal, with each generation featuring a different realistic metal finish. Materials may include polished stainless steel, brushed aluminum, forged iron, polished chrome, titanium, copper, brass, blackened steel, weathered steel, gunmetal, or other authentic metals. The surface should display realistic metallic reflections, subtle natural imperfections, machining marks, brushed grain, polished finishes, oxidation where appropriate, and exceptional craftsmanship.\n\nRecreate the person's original clothing entirely in metal while preserving every fold, seam, collar, button, pocket, wrinkle, layered garment, and accessory with remarkable sculptural detail. Flowing garments should appear elegantly formed from solid metal while maintaining realistic contours and intricate craftsmanship.\n\nThe sculpture should exhibit authentic metal characteristics, including crisp edges, precision detailing, smooth polished surfaces, brushed textures, realistic welds or cast details where appropriate, subtle surface wear, fine machining marks, and convincing metallic reflections. The chosen metal should appear solid, weighty, and expertly crafted.\n\nPresent the sculpture in a clean, minimalist environment that keeps the artwork as the unmistakable focal point. The background should remain simple and uncluttered.\n\nIlluminate the sculpture with professional studio lighting that enhances metallic reflections, surface texture, polished highlights, and realistic shadows. Use shallow depth of field, elegant composition, premium professional photography, and photorealistic rendering that showcases the beauty of the chosen metal.\n\nHyper-realistic handcrafted metal sculpture, authentic metallic materials, master artisan craftsmanship, realistic reflections, polished and brushed metal finishes, exceptional sculptural detail, premium professional photography, faithful identity preservation, elegant minimalist composition, no fantasy materials, no glowing effects, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  chrome: {
    id: 'chrome',
    label: 'Chrome',
    categoryId: 'sculptures',
    description:
      'Polished mirror-chrome sculpture with ultra-smooth reflective surfaces and photorealistic CGI finish',
    prompt:
      'Transform the uploaded subject into a polished mirror-chrome sculpture while preserving their identity and facial proportions. Render the entire subject as if sculpted from flawless reflective chrome with ultra-smooth surfaces, seamless contours, crisp specular highlights, and realistic mirror reflections. The metallic material should appear highly polished with no paint or texture, emphasizing elegant sculptural forms and a futuristic contemporary-art aesthetic. Ultra-detailed, photorealistic CGI, premium product-render quality. Chrome effect includes hair and beard.',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  mountain: {
    id: 'mountain',
    label: 'Mountain',
    categoryId: 'sculptures',
    description:
      'Colossal original granite mountain monument carved with the uploaded subject(s) only, in a national-park setting',
    prompt:
      "Preserve the uploaded person's identity exactly. If multiple people are uploaded, preserve each person's identity exactly. Transform the uploaded subject(s) into a colossal granite mountain monument inspired by the monumental rock-carving style of a colossal American-style granite mountain monument with monumental rock-carved portraits, but create an entirely original monument. The uploaded subject(s) must be the ONLY faces carved into the mountain. Completely replace any existing or recognizable mountain carvings. Do not include George Washington, Thomas Jefferson, Theodore Roosevelt, Abraham Lincoln, or any historical figures. Do not recreate the real Mount Rushmore monument. Instead, carve only the uploaded subject(s) into a massive natural granite cliff, faithfully preserving their facial features, hairstyles, expressions, and proportions. The carvings should appear expertly sculpted from solid granite with realistic chisel marks, weathering, cracks, layered rock formations, and natural stone textures. The mountain should exist in a beautiful national-park landscape with pine trees, rocky cliffs, and dramatic blue skies. At the base of the monument, include a large scenic viewing plaza filled with tourists taking photos, pointing, walking, and admiring the monument to emphasize its immense scale. Include observation decks, railings, pathways, park signage, and natural surroundings. Cinematic wide-angle composition, ultra-photorealistic, highly detailed, realistic daylight, epic scale, clean composition, no text, no logos, no watermarks.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  wood: {
    id: 'wood',
    label: 'Wood',
    categoryId: 'sculptures',
    description:
      'Life-sized hand-carved wooden sculpture with random hardwood grain and artisan finish',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into an extraordinary hand-carved wooden sculpture, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.\n\nSculpt the entire person as a life-sized wooden artwork in a natural standing, sitting, walking, or expressive pose that complements their appearance. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—should be meticulously carved while maintaining the person's unmistakable identity.\n\nThe sculpture should be carved from a randomly selected premium hardwood, with each generation featuring a different authentic wood species. Materials may include rich walnut, golden oak, mahogany, teak, maple, cherry, ebony, cedar, olive wood, rosewood, or other realistic hardwoods. The wood should display beautiful natural grain patterns, subtle color variations, growth rings, knots where appropriate, and the unique character of genuine timber.\n\nRecreate the person's original clothing entirely in carved wood while preserving the realistic design, fit, tailoring, and construction of the garments. Every fold, seam, collar, button, zipper, pocket, cuff, wrinkle, layered garment, and accessory should be faithfully reproduced with exceptional sculptural precision. The clothing should retain the appearance of real garments while clearly being carved from solid wood, displaying continuous natural wood grain, subtle chisel marks, refined carved textures, and master artisan craftsmanship.\n\nThe sculpture should exhibit authentic wood carving characteristics, including finely carved details, realistic wood grain flowing naturally across the form, subtle chisel marks, delicate gouge textures, smooth hand-sanded surfaces, gently rounded edges, and a premium hand-finished appearance. The wood should look solid, warm, and expertly crafted, with a soft satin or lightly polished finish that enhances its natural beauty.\n\nPresent the sculpture in a clean, minimalist setting that keeps the artwork as the unmistakable focal point. The background should remain simple and uncluttered.\n\nIlluminate the sculpture with soft natural or studio lighting that enhances the wood grain, carved textures, warm tones, and sculptural depth. Use realistic contact shadows, shallow depth of field, elegant composition, premium professional photography, and photorealistic rendering that highlights the craftsmanship and organic beauty of the wood.\n\nHyper-realistic hand-carved wooden sculpture, authentic natural hardwood, master woodcarving craftsmanship, realistic wood grain, intricate carved details, subtle chisel marks, premium hand-finished surface, exceptional realism, professional photography, faithful identity preservation, elegant minimalist composition, no painted wood, no fantasy materials, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  gold: {
    id: 'gold',
    label: 'Gold',
    categoryId: 'sculptures',
    description:
      'Life-sized solid 24-karat gold sculpture with warm metallic reflections and goldsmith finish',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into an extraordinary solid gold sculpture, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.\n\nSculpt the entire person as a life-sized gold artwork in a natural standing, sitting, walking, or expressive pose that complements their appearance. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—should be meticulously sculpted while maintaining the person's unmistakable identity.\n\nThe sculpture should be crafted entirely from solid 24-karat gold, featuring a rich, warm golden color with realistic metallic reflections, soft mirror-like highlights, subtle brushed and polished finishes, delicate casting details, fine surface textures, and exceptional artisan craftsmanship. The gold should appear dense, luxurious, and substantial, with authentic metallic depth and natural luster.\n\nRecreate the person's original clothing entirely in solid gold while preserving the realistic design, fit, tailoring, and construction of the garments. Every fold, seam, collar, button, zipper, pocket, cuff, wrinkle, layered garment, and accessory should be faithfully reproduced with exceptional sculptural precision. The clothing should retain the appearance of real garments while clearly being sculpted from solid gold, displaying refined metallic textures, crisp sculpted details, and master goldsmith craftsmanship.\n\nThe sculpture should exhibit authentic gold characteristics, including smooth polished surfaces, subtle hammered textures in selected areas, finely engraved details, realistic metallic reflections, soft edge highlights, and delicate craftsmanship. The gold should appear flawless, valuable, and exquisitely finished without appearing painted or artificial.\n\nPresent the sculpture against a clean, minimalist background that keeps the artwork as the unmistakable focal point. The composition should be elegant, luxurious, and uncluttered.\n\nIlluminate the sculpture with professional studio lighting that enhances the gold's warm metallic reflections, rich color, polished surfaces, and intricate sculptural details. Use realistic contact shadows, shallow depth of field, premium professional photography, elegant composition, and photorealistic rendering that showcases the brilliance and craftsmanship of solid gold.\n\nHyper-realistic solid gold sculpture, authentic precious metal, master goldsmith craftsmanship, realistic metallic reflections, luxurious polished finish, intricate sculptural detail, exceptional realism, premium professional photography, faithful identity preservation, elegant minimalist composition, no fantasy effects, no glowing magic, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  porcelain: {
    id: 'porcelain',
    label: 'Porcelain',
    categoryId: 'sculptures',
    description:
      'Exquisite handcrafted porcelain sculpture with random elegant glaze finishes and ceramic sheen',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into an exquisite handcrafted porcelain sculpture, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.\n\nSculpt the entire person as an elegant porcelain figure in a natural standing, sitting, walking, or expressive pose that complements their appearance. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—should be meticulously sculpted while maintaining the person's unmistakable identity.\n\nThe sculpture should be crafted from fine porcelain featuring a smooth glazed finish, subtle translucency around thinner edges, delicate ceramic depth, and an immaculate handcrafted appearance. For each generation, the porcelain should feature a randomly selected elegant finish, such as classic white porcelain, soft ivory, celadon, cobalt blue and white, floral hand-painted porcelain, pastel porcelain, black porcelain, or other refined porcelain styles. The finish should remain tasteful, elegant, and consistent across the entire sculpture.\n\nRecreate the person's original clothing entirely in porcelain while preserving the realistic design, fit, tailoring, folds, seams, collars, buttons, zippers, pockets, cuffs, wrinkles, layered garments, shoes, and accessories. The clothing should retain the appearance of real garments while clearly being sculpted from porcelain, with graceful flowing forms, crisp sculptural detailing, and beautifully glazed surfaces.\n\nThe sculpture should exhibit authentic porcelain characteristics, including flawless glazing, smooth reflective surfaces, subtle ceramic sheen, refined hand-finished details, delicate relief work, elegant contours, and exceptional artisan craftsmanship. Where appropriate, include tasteful hand-painted decorative patterns or fine gold accents that complement the chosen porcelain style without obscuring the person's identity.\n\nPresent the sculpture against a clean, minimalist background that keeps the artwork as the unmistakable focal point. The composition should be elegant, refined, and uncluttered.\n\nIlluminate the sculpture with soft professional studio lighting that enhances the glazed porcelain surface, delicate reflections, subtle translucency, intricate sculptural details, and premium craftsmanship. Use realistic contact shadows, shallow depth of field, elegant composition, premium professional photography, and photorealistic rendering.\n\nHyper-realistic handcrafted porcelain sculpture, authentic fine porcelain, luxurious glazed ceramic finish, subtle translucency, exceptional sculptural craftsmanship, refined artisan detailing, premium professional photography, faithful identity preservation, elegant minimalist composition, no cracks unless naturally decorative, no fantasy materials, no text, no logos, no watermarks, and no visual defects.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'voxel-block': {
    id: 'voxel-block',
    label: 'Voxel Block',
    categoryId: '3d-characters',
    description:
      'Extraordinary voxel block character built entirely from precisely aligned colored cubic voxels',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into an extraordinary voxel block character, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics while recreating the entire figure entirely from precisely arranged colored cubic voxels.\n\nConstruct the entire person using thousands of perfectly aligned three-dimensional cubes of uniform size. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—should be recreated entirely from colored voxel blocks while maintaining the person's unmistakable identity.\n\nRecreate the person's original clothing exactly, preserving the realistic design, fit, tailoring, folds, seams, collars, buttons, zippers, pockets, cuffs, wrinkles, layered garments, shoes, and accessories. Every garment should be constructed entirely from colored voxel cubes, using carefully arranged blocks to represent fabric textures, folds, and contours while maintaining the unmistakable voxel aesthetic.\n\nEvery visible element in the composition—including the ground, trees, buildings, furniture, vehicles, sky, clouds, rocks, water, shadows, and all surrounding objects—should also be constructed entirely from voxel cubes. Nothing should appear smooth, organic, painted, or realistically sculpted. The entire world should share a consistent voxel construction.\n\nUse a rich color palette with subtle gradients achieved through carefully arranged colored cubes rather than smooth shading. The voxel structure should remain clearly visible, with crisp cube edges, perfectly aligned geometry, and authentic block-based construction throughout the entire scene.\n\nPosition the character naturally within a fully voxel-built environment that complements the subject while keeping them as the primary focus. The composition should feel like a handcrafted digital voxel world rather than a realistic environment.\n\nIlluminate the scene with soft directional lighting that creates realistic shadows between individual cubes, subtle ambient occlusion, crisp edge highlights, and believable depth. Use shallow depth of field, premium digital rendering, elegant composition, and exceptional attention to voxel detail.\n\nHyper-realistic voxel artwork, premium block-based construction, thousands of precisely aligned cubic voxels, authentic digital voxel aesthetic, crisp cube geometry, exceptional craftsmanship, faithful identity preservation, fully voxelized environment, premium 3D rendering, clean composition, every subject and object made entirely from voxel cubes, no smooth surfaces, no rounded geometry, no LEGO studs, no fantasy effects, no text, no logos, no watermarks, and no visual defects.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  '3d-portrait-v1': {
    id: '3d-portrait-v1',
    label: '3D Portrait V1',
    categoryId: '3d-characters',
    description: 'Stylized 3D portrait with exaggerated cartoon proportions and semi-realistic skin texture',
    prompt:
      'A stylized 3D portrait that transforms the person in the photo into a character with exaggerated proportions, like a cartoon. The skin is textured with realistic pores, subtle wrinkles, and expressive features, just like in the photo.  A discreet signature is added in the lower left corner in a contrasting color: The lighting is warm and soft, with a plain beige studio background. High-quality 3D rendering with semi-realistic shading, sculpted facial features, and high-quality materials.',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  '3d-portrait-v2': {
    id: '3d-portrait-v2',
    label: '3D Portrait V2',
    categoryId: '3d-characters',
    description: 'Stylized 3D portrait with exaggerated cartoon proportions and semi-realistic skin texture',
    prompt:
      'A stylized 3D portrait that transforms the person in the photo into a character with exaggerated proportions, like a cartoon. The skin is textured with realistic pores, subtle wrinkles, and expressive features, just like in the photo.  A discreet signature is added in the lower left corner in a contrasting color: The lighting is warm and soft, with a plain beige studio background. High-quality 3D rendering with semi-realistic shading, sculpted facial features, and high-quality materials.',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  minime: {
    id: 'minime',
    label: 'Minime',
    categoryId: '3d-characters',
    description:
      'Premium studio portrait pairing a photoreal subject with a stylized mini 3D version of the same person',
    prompt:
      "Use the uploaded reference image as an immutable source of identity for both subjects. IDENTITY FIXED - NOT ALTERABLE Preserve the exact facial structure, facial proportions, skin tone, eye shape, nose shape, lips, hairstyle, hair color, visual age, body proportions, and all recognizable personality traits from the reference image. The real person and the stylized character must clearly represent the same person. Do not create a different face, hairstyle, ethnicity, age, or body type. Do not embellish, alter, or reinterpret the person's identity. COMPOSITION AND FRAMMENT Create a premium studio portrait in a vertical 4:5 composition. Full-length shot. The real person stands on the right side of the frame. A stylized 3D version of the same person stands on the left side. The 3D character should be approximately 50-60% the height of a real person and reach approximately to waist level. The real subject casually rests one elbow on the character's large head. The interaction should appear natural, relaxed, and believable. Maintain a balanced distance between objects and a clean, centered composition. REAL SUBJECT - PHOTOREALISM Create an ultra-realistic, professional, commercial-quality studio photograph. Skin texture, natural pores, realistic hair strands, realistic fabric detail, and physically accurate lighting should be visible. The facial expression should be warm, inviting, confident, and relaxed. Avoid overly wide smiles, artificial beauty filters, plastic skin, and unrealistic retouching. POSE DIRECTION The pose should appear natural, stylish, and relaxed. Weight slightly shifted to one leg. Slight asymmetry in posture. Relaxed shoulders. Natural body language. The hand resting on the character should appear casual and relaxed, not staged. Avoid stiff, standing poses. CLOTHING PRESERVATION Accurately recreate the clothing from the reference image. Preserve the clothing colors, fit, silhouette, fabric characteristics, stitching, folds, seams, cuffs, hems, logos, accessories, shoes, and overall style. Do not alter or replace clothing elements. 3D CHARACTER VERSION Create a premium animated 3D character inspired by the aesthetics of high-end cinematic animation. The character should remain clearly recognizable as the same person. Large, expressive head. Smaller, stylized body proportions. More expressive facial expressions while maintaining accurate character. Slightly enlarged eyes. Softer facial contours. A friendly, animated smile. Sophisticated, high-quality character modeling. Avoid a toy-like, cheap, plastic, low-detail, or rigid figurine look. CHARACTER AND MOVEMENT The character should appear alive and expressive. Subtle body movement. Natural stance. Playful personality. Animated facial expression. Confident and charming presence. The pose should look like a still from an animated film, not like a static collectible figurine. MATERIALS AND DETAILS High-quality physically based rendering. Premium cloth simulation. Soft, realistic folds in clothing. Accurate surface reflections. Natural skin shading and lighting. Detailed hair rendering. Professional character texturing. LIGHTING AND STUDIO ENVIRONMENT Soft, diffuse studio lighting from the top left. Clean highlight transitions. Natural, soft shadows. Premium commercial studio lighting scheme. The background should be a seamless light gray studio gradient, slightly brighter in the center. Both subjects should cast realistic shadows, securely anchored to the surface.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'dancing-3d': {
    id: 'dancing-3d',
    label: 'Dancing',
    categoryId: '3d-characters',
    description:
      'Exaggerated hybrid 3D-illustration dancing character with dynamic motion and painterly textures',
    prompt:
      "An exaggerated hybrid cartoon character combining sculpted 3D volume with expressive painted illustration style, featuring distorted stylized proportions and artistic facial deformation, freely adapting the person's appearance without realistic facial accuracy while keeping recognizable traits such as skin tone and hairstyle, the character captured in a dynamic dance pos full of motion and rhythm, flowing body ges and expressive posture, visible brush strok painted shadows and graphic textures layer over soft 3D forms, contemporary animated illustration aesthetic, solid blue studio background, stylized studio lighting translated into painterly highlights and shadows, energetic composition, textured paint surfaces and high-end hybrid 3D illustration render",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  yarn: {
    id: 'yarn',
    label: 'Yarn',
    categoryId: '3d-characters',
    description:
      'Charming handcrafted yarn artwork with knitted, crocheted, and textile materials throughout the scene',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into a charming handcrafted yarn artwork, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics while recreating the entire scene exclusively from yarn, knitted fabric, crochet, and textile materials.\n\nEvery visible element—including the person, clothing, hair, skin, accessories, background, ground, buildings, trees, sky, clouds, furniture, vehicles, plants, animals, shadows, and every object in the composition—must be constructed entirely from yarn and textile materials. Nothing should appear as real skin, plastic, metal, stone, wood, or painted surfaces.\n\nThe person's face should be recreated using carefully stitched yarn with soft knitted textures, embroidered facial details, layered wool fibers, and subtle fabric contours that preserve their recognizable identity. Hair should be formed from realistic strands of yarn, braided wool, knitted loops, crocheted curls, or woven textile fibers that naturally follow the person's hairstyle.\n\nRecreate the person's original clothing entirely from knitted or crocheted fabric while preserving the realistic design, fit, tailoring, seams, collars, buttons, pockets, wrinkles, layered garments, and accessories. Every garment should clearly appear handcrafted from yarn with visible stitches, woven fibers, knitted patterns, crochet loops, ribbing, cable knit textures, and soft fabric folds.\n\nConstruct the entire environment from yarn and textile materials. Trees should have knitted trunks and pom-pom foliage, clouds should be fluffy wool, buildings should resemble stitched fabric structures, flowers should be crocheted, grass should consist of loose yarn fibers, rocks should be felted wool, and every background object should maintain the handcrafted textile aesthetic.\n\nUse premium wool, cotton yarn, felt, crochet, embroidery, knitted fabric, woven textiles, and soft fiber materials throughout the scene. Showcase realistic yarn fibers, stitch patterns, fabric weave, knitted loops, crochet detailing, embroidery thread, felt textures, and handcrafted imperfections that celebrate traditional textile craftsmanship.\n\nIlluminate the artwork with soft diffused lighting that enhances the rich textile textures, soft fibers, knitted depth, and handcrafted details. Use realistic contact shadows, shallow depth of field, premium studio photography, elegant composition, and photorealistic rendering that emphasizes the warmth and tactile beauty of yarn art.\n\nHyper-realistic handcrafted yarn artwork, knitted and crocheted craftsmanship, authentic wool fibers, embroidered details, premium textile materials, visible stitches, woven textures, felted surfaces, layered fabric construction, exceptional realism, faithful identity preservation, cozy handcrafted aesthetic, professional studio photography, every subject and object made entirely from yarn and textile materials, no plastic, no metal, no wood, no stone, no paper, no painted surfaces, no text, no logos, no watermarks, and no visual defects.",
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  vinyl: {
    id: 'vinyl',
    label: 'Vinyl',
    categoryId: '3d-characters',
    description:
      'Premium designer vinyl figurine collectible with stylized proportions and studio product photography',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into a premium designer vinyl figurine, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics while reimagining them as a high-end collectible art toy.\n\nSculpt the entire figure with elegant stylized proportions typical of premium designer vinyl collectibles. The head should be slightly enlarged, the body simplified yet well-balanced, and the limbs smoothly proportioned while maintaining the person's unmistakable identity. The overall appearance should be charming, expressive, and collectible without becoming cartoonishly exaggerated.\n\nFaithfully recreate every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, hats, jewellery, or watches—with clean sculpted forms and smooth vinyl contours. Preserve the person's unique likeness while subtly simplifying small details into premium toy-quality sculpting.\n\nRecreate the person's original clothing exactly, preserving the realistic design, fit, tailoring, folds, seams, collars, buttons, zippers, pockets, layered garments, shoes, and accessories. Every garment should be expertly sculpted as molded vinyl while retaining the appearance of real clothing through refined sculptural detail.\n\nThe figurine should be manufactured from premium vinyl with smooth molded surfaces, subtle satin and semi-gloss finishes, realistic injection-molded construction, crisp sculpted details, clean part separation lines, precision paint application, and exceptional craftsmanship. The figure should resemble a genuine limited-edition designer collectible sold in premium art toy galleries.\n\nPosition the figurine standing naturally on a simple round display base that complements the figure without distracting from it. The pose should feel balanced, confident, and display-ready.\n\nPresent the figurine in a clean minimalist studio environment that keeps the collectible as the unmistakable focal point. The background should remain simple and uncluttered.\n\nIlluminate the figurine with soft professional studio lighting that enhances the vinyl material, subtle reflections, sculpted details, realistic paint finish, and premium craftsmanship. Use realistic contact shadows, shallow depth of field, premium commercial product photography, elegant composition, and photorealistic rendering.\n\nHyper-realistic designer vinyl collectible, premium art toy, authentic vinyl materials, smooth molded surfaces, precision paint application, realistic manufacturing quality, exceptional sculptural craftsmanship, faithful identity preservation, luxury collectible photography, clean minimalist composition, no packaging, no branding, no logos, no text, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  plush: {
    id: 'plush',
    label: 'Plush',
    categoryId: '3d-characters',
    description:
      'Adorable handcrafted plush toy with soft stuffed fabrics and a cozy textile world',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into an adorable handcrafted plush toy, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics while recreating the entire figure as a premium stuffed plush collectible.\n\nConstruct the entire person from soft plush fabrics filled with realistic stuffing, giving the figure a cuddly, rounded appearance with gentle proportions and a huggable feel. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—should be recreated using embroidered stitching, appliqué fabric, plush textures, and carefully sewn construction while maintaining the person's unmistakable identity.\n\nRecreate the person's original clothing exactly, preserving the realistic design, fit, tailoring, seams, collars, buttons, zippers, pockets, cuffs, wrinkles, layered garments, shoes, and accessories. Every garment should be handcrafted from soft fabric, felt, fleece, velvet, or plush textiles, with visible stitching, embroidered details, quilted textures, and realistic fabric construction while remaining unmistakably soft and stuffed.\n\nEvery visible element in the composition—including furniture, plants, buildings, trees, clouds, ground, and all surrounding objects—should also be made entirely from plush fabrics, felt, stuffing, and stitched textiles. Nothing should appear as plastic, metal, wood, stone, paper, or realistic natural materials. The entire world should share a consistent handcrafted plush aesthetic.\n\nUse premium soft fabrics with realistic fleece, velvet, felt, microfiber, cotton, and plush textures. Include visible stitched seams, embroidered details, fabric grain, soft wrinkles, padded contours, quilted sections, plush pile, and gentle handcrafted imperfections that enhance realism.\n\nPosition the plush character naturally within a fully plush-crafted environment that complements the subject while keeping them as the primary focus. The composition should feel warm, cozy, playful, and handcrafted.\n\nIlluminate the scene with soft diffused studio lighting that enhances the fabric textures, stitched details, fluffy surfaces, and soft rounded forms. Use realistic contact shadows, shallow depth of field, premium professional photography, elegant composition, and photorealistic rendering that emphasizes the tactile beauty of plush materials.\n\nHyper-realistic handcrafted plush toy, authentic stuffed fabric construction, premium plush materials, realistic embroidered details, visible stitched seams, soft padded textures, exceptional craftsmanship, faithful identity preservation, cozy handcrafted aesthetic, premium studio photography, every subject and object made entirely from plush fabric and textile materials, no plastic, no metal, no wood, no stone, no paper, no rigid materials, no text, no logos, no watermarks, and no visual defects.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  bobblehead: {
    id: 'bobblehead',
    label: 'Bobblehead',
    categoryId: '3d-characters',
    description:
      'Premium bobblehead collectible with oversized spring-mounted head and hand-painted finish',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the uploaded person into a premium bobblehead collectible figurine, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics while reimagining them as a professionally manufactured collectible.\n\nSculpt the figure with classic bobblehead proportions, featuring an oversized head approximately two to three times larger than natural proportion, mounted on a visible spring or hidden bobble mechanism above a compact, realistically proportioned body. The head should appear slightly heavier than the body, emphasizing the iconic bobblehead aesthetic while maintaining perfect balance.\n\nFaithfully recreate every facial feature—including the eyes, eyebrows, nose, lips, ears, hairstyle, facial hair (if present), glasses, hats, jewellery, and accessories—with exceptional sculptural accuracy. Preserve the person's identity with remarkable realism while subtly simplifying fine details to resemble a premium hand-painted collectible. The face should remain expressive, lifelike, and instantly recognizable.\n\nRecreate the person's original clothing exactly, preserving the realistic design, fit, tailoring, folds, seams, collars, buttons, zippers, pockets, cuffs, wrinkles, layered garments, shoes, and accessories. Every garment should be expertly sculpted with crisp details and professionally hand-painted finishes while retaining the appearance of real clothing.\n\nThe figurine should be manufactured from premium resin or vinyl with smooth molded surfaces, precise sculptural detailing, subtle satin finishes, realistic paint application, clean part lines, and exceptional collectible quality. The head should clearly appear capable of bobbling while remaining securely attached to the body.\n\nPosition the figure standing naturally on a premium display base that complements the subject without distracting from the collectible. The base should feel professionally designed and suitable for display.\n\nPresent the bobblehead in a clean minimalist studio environment that keeps the collectible as the unmistakable focal point.\n\nIlluminate the figurine with soft professional studio lighting that enhances the sculpted details, painted surfaces, realistic materials, and premium craftsmanship. Use realistic contact shadows, shallow depth of field, premium commercial product photography, elegant composition, and photorealistic rendering.\n\nHyper-realistic premium bobblehead collectible, oversized spring-mounted head, authentic collectible craftsmanship, realistic sculpted likeness, premium hand-painted finish, professional manufacturing quality, faithful identity preservation, luxury product photography, elegant minimalist composition, no packaging, no branding, no logos, no text, no watermarks, and no visual defects.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  miniature: {
    id: 'miniature',
    label: 'Miniature',
    categoryId: '3d-characters',
    description:
      'Hyperrealistic miniature caricature sitting in giant hands with oversized head and photoreal detail',
    prompt:
      "Use the attached photo as the primary reference for appearance and clothing. Maintain the person's individuality as accurately as possible: recognizable facial features, head shape, hairstyle, hairline, age, skin tone and natural texture, and the shape of the eyes, nose, lips, and chin. Transfer clothing, shoes, accessories, colors, materials, and small details entirely from the attached reference—don't replace or invent anything. Create the effect of a hyperrealistic, humorous caricature: an adult is transformed into a tiny, miniature version of themselves with a deliberately exaggerated, disproportionately large head and a very small body. The head should appear massive and expressive, but the face remains anatomically realistic and easily recognizable. This is a living, breathing miniature person, not a child, a toy, or a plastic doll. The character sits on the open palm of a huge human hand, crossing their legs in a confident, slightly demonstrative pose. The character's arms are tightly folded over their chest. The facial expression is serious, sullen, and slightly displeased: furrowed brows, an intense gaze, and barely noticeable pursed lips. The emotion is expressive but natural, without being overly grotesque. The enormous lower palm gently supports the miniature character and takes up a noticeable portion of the foreground. A second, gigantic hand enters the frame from above and gently touches the top of the character's head, as if gently supporting a small, lifelike figure between its palms. Both hands must appear as realistic as possible: correct anatomy and proportions of the fingers, natural skin, pores, fine wrinkles, knuckle creases, nails, translucent areas of skin, and soft, natural highlights. The contrast between the enormous hands and the tiny body should create a convincing illusion of scale. Vertical portrait composition 9:16. The camera is positioned approximately at face level, at a slight three-quarter angle. The face is the main focal point of the image, with perfectly sharp eyes and facial features. Both large hands beautifully frame the character, creating the impression that he is nestled between them. The head, petite body, crossed legs, clothing, and key parts of both hands are fully visible in the frame. The composition is dense, expressive, and visually balanced. Cinematic studio lighting: soft, directional key light on the face, subtle shadows, delicate backlighting along the edges of the head and clothing, and natural reflections on the skin. Realistic depth of field with a slight blur in the background without losing important details. The background is a bright blue-blue radial gradient, more luminous and saturated in the center behind the character and gradually fading to a deep blue at the edges. 8K, extreme detail, hyperrealism, photorealistic, cinematic quality, ultra-detailed skin, realistic fabric texture, physically accurate lighting, natural color grading, HDR, sharp facial details, professional studio photography, premium advertising aesthetics, high-end collectible miniature effect, no text.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'plastic-toy-v1': {
    id: 'plastic-toy-v1',
    label: 'Plastic Toy V1',
    categoryId: '3d-characters',
    description:
      'Premium stylized plastic toy render preserving the original scene, pose, and composition',
    prompt:
      "Using the uploaded image as your ONLY reference, transform it into a high-quality stylized 3D render of a plastic toy, STRICTLY preserving the original scene without any changes: same object, same pose, same camera angle, same framing, same proportions, same lighting direction, same shadows, and same composition. The final image should look like an exact copy of the original photograph, transformed into a toy version, not a reimagining of it. Transform all characters and objects into the aesthetics of a premium collectible toy made of molded plastic. Surfaces should be exceptionally smooth, clean, and glossy, with controlled specular highlights, like those found in high-end designer toys or luxury collectible figurines. Add realistic structural details to the toy: visible hinge joints at the shoulders, elbows, hips, and knees (neat round or segmented hinges); subtle joint lines along the limbs and body parts; if necessary, minimal facial segmentation lines (very subtle, like those on premium action figures, no exaggeration); hinges should appear naturally integrated into the design and not interfere with the anatomy. The skin should be transformed into a smooth synthetic plastic (without pores or any imperfections), while fully preserving the character's personality and facial structure. Eyes should have a slight glossy sheen, like the painted eyes of the toy. Clothing should be transformed into plastic-coated materials (latex, rubberized surfaces, molded plastic, etc.), while maintaining the exact same design, folds, and construction - without any redesign.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'plastic-toy-v2': {
    id: 'plastic-toy-v2',
    label: 'Plastic Toy V2',
    categoryId: '3d-characters',
    description:
      'Premium stylized plastic toy render preserving the original scene, pose, and composition',
    prompt:
      "Using the uploaded image as your ONLY reference, transform it into a high-quality stylized 3D render of a plastic toy, STRICTLY preserving the original scene without any changes: same object, same pose, same camera angle, same framing, same proportions, same lighting direction, same shadows, and same composition. The final image should look like an exact copy of the original photograph, transformed into a toy version, not a reimagining of it. Transform all characters and objects into the aesthetics of a premium collectible toy made of molded plastic. Surfaces should be exceptionally smooth, clean, and glossy, with controlled specular highlights, like those found in high-end designer toys or luxury collectible figurines. Add realistic structural details to the toy: visible hinge joints at the shoulders, elbows, hips, and knees (neat round or segmented hinges); subtle joint lines along the limbs and body parts; if necessary, minimal facial segmentation lines (very subtle, like those on premium action figures, no exaggeration); hinges should appear naturally integrated into the design and not interfere with the anatomy. The skin should be transformed into a smooth synthetic plastic (without pores or any imperfections), while fully preserving the character's personality and facial structure. Eyes should have a slight glossy sheen, like the painted eyes of the toy. Clothing should be transformed into plastic-coated materials (latex, rubberized surfaces, molded plastic, etc.), while maintaining the exact same design, folds, and construction - without any redesign.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'figurine-v1': {
    id: 'figurine-v1',
    label: 'Figurine V1',
    categoryId: '3d-characters',
    description:
      'Hyper-realistic commercial scene with a 1/7th-scale collectible figurine beside the real subject',
    prompt:
      "Use a reference photo to create a hyper-realistic commercial scene featuring a 1/7th scale collectible action figure based on the uploaded image. The main subject is a realistic miniature figurine of the same man from the reference photo, accurately reproducing his appearance, facial features, hairstyle, body proportions, pose, and clothing. The figurine stands on a round, clear acrylic base and is placed on a computer desk in a modern studio space. The figurine's materials should look premium and realistic: detailed skin, natural fabric texture, accurate paintwork, and clear, fine details, without a plastic or toy-like appearance. Next to the table is a real-life version of the same man, wearing the same clothing as in the reference photo. He carefully cleans the figurine with a fine brush, leaning slightly toward it, with an attentive and focused expression. The composition should emphasize the contrast between the real man and his miniature commercial figurine. The setting is a stylish, modern studio room with bright, soft lighting. In the background, shelves displaying a collection of toys, figurines, and decorative items are visible. The background is slightly blurred to keep the main focus on the figurine and the man. The atmosphere is premium, creative, and collectible, reminiscent of a professional advertising shoot for a brand of designer figurines. Ultra-realistic texture, highly detailed, 8K, cinematic soft light, realistic shadows, professional product photography, no plastic textures, no CGI",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'figurine-v2': {
    id: 'figurine-v2',
    label: 'Figurine V2',
    categoryId: '3d-characters',
    description:
      'Hyper-realistic commercial scene with a 1/7th-scale collectible figurine beside the real subject',
    prompt:
      "Use a reference photo to create a hyper-realistic commercial scene featuring a 1/7th scale collectible action figure based on the uploaded image. The main subject is a realistic miniature figurine of the same man from the reference photo, accurately reproducing his appearance, facial features, hairstyle, body proportions, pose, and clothing. The figurine stands on a round, clear acrylic base and is placed on a computer desk in a modern studio space. The figurine's materials should look premium and realistic: detailed skin, natural fabric texture, accurate paintwork, and clear, fine details, without a plastic or toy-like appearance. Next to the table is a real-life version of the same man, wearing the same clothing as in the reference photo. He carefully cleans the figurine with a fine brush, leaning slightly toward it, with an attentive and focused expression. The composition should emphasize the contrast between the real man and his miniature commercial figurine. The setting is a stylish, modern studio room with bright, soft lighting. In the background, shelves displaying a collection of toys, figurines, and decorative items are visible. The background is slightly blurred to keep the main focus on the figurine and the man. The atmosphere is premium, creative, and collectible, reminiscent of a professional advertising shoot for a brand of designer figurines. Ultra-realistic texture, highly detailed, 8K, cinematic soft light, realistic shadows, professional product photography, no plastic textures, no CGI",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  'figurine-v3': {
    id: 'figurine-v3',
    label: 'Figurine V3',
    categoryId: '3d-characters',
    description:
      'Hyper-realistic chibi collectible figurine product photo on a wooden table with graffiti backdrop',
    prompt:
      'A hyper-realistic promotional product photo of a small collectible figurine, positioned vertically on a wooden table with a distinctive natural texture. The figurine is fully visible and central to the composition. The figurine is based on the character from the attached image and is executed in a charming chibi style: an enlarged head, compact body proportions, expressive facial features, and a recognizable appearance. The character is depicted in a dynamic pose against a brick wall covered in colorful graffiti.\n\nThe figurine accurately replicates the appearance, pose, clothing, hairstyle, and key features of the character from the attached image. The detailed plastic figurine looks like a genuine premium collectible souvenir with its precise paint job and matte and slightly glossy surfaces.\n\nThe composition is reminiscent of a professional advertising shoot for a limited edition collection. The figurine is the main focus of the shot. A blurred brick wall with bright street graffiti elements is visible in the background.\n\nSoft natural lighting from the side, subtle highlights on the figurine, realistic contact shadows on the table, a warm, cozy atmosphere. Shallow depth of field, sharp focus on the figurine, smooth artistic background blur, the effect of a professional 50mm lens. Maximum photorealism, realistic materials and textures, high detail, commercial product photography, 8K quality, no unnecessary objects, text, watermarks, or visual defects.',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'figurine-v4': {
    id: 'figurine-v4',
    label: 'Figurine V4',
    categoryId: '3d-characters',
    description:
      'Hyper-realistic chibi collectible figurine product photo on a wooden table with graffiti backdrop',
    prompt:
      'A hyper-realistic promotional product photo of a small collectible figurine, positioned vertically on a wooden table with a distinctive natural texture. The figurine is fully visible and central to the composition. The figurine is based on the character from the attached image and is executed in a charming chibi style: an enlarged head, compact body proportions, expressive facial features, and a recognizable appearance. The character is depicted in a dynamic pose against a brick wall covered in colorful graffiti.\n\nThe figurine accurately replicates the appearance, pose, clothing, hairstyle, and key features of the character from the attached image. The detailed plastic figurine looks like a genuine premium collectible souvenir with its precise paint job and matte and slightly glossy surfaces.\n\nThe composition is reminiscent of a professional advertising shoot for a limited edition collection. The figurine is the main focus of the shot. A blurred brick wall with bright street graffiti elements is visible in the background.\n\nSoft natural lighting from the side, subtle highlights on the figurine, realistic contact shadows on the table, a warm, cozy atmosphere. Shallow depth of field, sharp focus on the figurine, smooth artistic background blur, the effect of a professional 50mm lens. Maximum photorealism, realistic materials and textures, high detail, commercial product photography, 8K quality, no unnecessary objects, text, watermarks, or visual defects.',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  handd: {
    id: 'handd',
    label: 'Hand-Drawn',
    categoryId: 'caricatures',
    description: 'Traditional hand-drawn editorial caricature with colored-pencil and ink illustration style',
    prompt:
      "Using the uploaded photo as the visual reference, create a hand-drawn editorial caricature of the subject. The caricature should feature a very large, exaggerated head and a small, simplified body, preserving the subject's core facial likeness while emphasizing distinctive features. Strongly exaggerate: Head size and facial proportions, Nose, cheeks, jaw, and brow, Eye spacing and expression. Style: Traditional colored-pencil and ink illustration, Visible pencil strokes, Cross-hatching and line shading, Slightly uneven, hand-drawn outlines, Subtle paper texture. Shading should be: Built with layered pencil tones, Warm, earthy colors, No smooth digital gradients. Facial expression should be expressive and characterful, leaning slightly humorous or serious depending on the reference photo. Clothing should be simplified and secondary, drawn with minimal detail to keep focus on the face. Background: Plain, light, off-white or beige, Minimal texture only, No scenery, no environment. Overall look: Classic newspaper / magazine caricature, Hand-drawn, imperfect, human, Exaggerated but recognizable. Full-bleed illustration. No borders. Avoid 3D, avoid painterly styles, avoid realism.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    categoryId: 'art',
    description:
      'Sophisticated magazine editorial caricature with ink linework and watercolor washes',
    prompt:
      'Create a sophisticated editorial caricature of the provided subject while faithfully preserving their identity, facial structure, age, ethnicity, hairstyle, expression, clothing, and pose. Exaggerate the defining facial characteristics in a tasteful editorial manner—slightly enlarge the head, emphasize the forehead, eyebrows, eyes, nose, ears, cheek lines, smile lines, and wrinkles to communicate wisdom and character without becoming grotesque. Maintain realistic facial proportions despite the stylization. Render in a premium newspaper/magazine editorial illustration style using expressive black ink linework, fine cross-hatching, loose pen strokes, and layered watercolor washes. Use warm, earthy tones with subtle texture from watercolor paper. Employ confident contour lines, varied line weights, and painterly shading to create depth while retaining a handcrafted appearance. Preserve the library setting with bookshelves and the armchair, but simplify the background into soft watercolor shapes and sketch-like details so it supports rather than competes with the subject. Use soft natural window lighting, gentle shadows, and a muted, elegant color palette. The overall mood should be thoughtful, distinguished, intellectual, and timeless—resembling a high-end editorial portrait published in The New Yorker, The Economist, Financial Times, or a literary magazine. No typography, captions, speech bubbles, logos, signatures, watermarks, borders, decorative frames, or graphic elements. Background should remain clean and uncluttered, with the subject as the clear focal point.',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  exaggerated: {
    id: 'exaggerated',
    label: 'Exaggerated',
    categoryId: 'caricatures',
    description: 'Exaggerated 3D cartoon caricature with playful proportions',
    prompt: 'Make this an Exaggerated 3d cartoon caricature',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  coloured_pencil: {
    id: 'coloured_pencil',
    label: 'Coloured Pencil',
    categoryId: 'caricatures',
    description: 'Colored pencil caricature rendered with premium stylized shading',
    prompt: 'Make this an Exaggerated 3d cartoon caricature',
    model: SEEDREAM_4,
    enabled: false, // re-enable after apps/mobile/assets/comparisons/after/caricature/colouredp.jpg is added
    premium: false,
  },
  watercolor: {
    id: 'watercolor',
    label: 'Watercolor',
    categoryId: 'cartoons',
    description: 'Watercolor caricature with soft painterly washes and stylized shading',
    prompt: 'Make this a Watercolor caricature',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  carc1: {
    id: 'carc1',
    label: 'Caricature 1',
    categoryId: 'caricatures',
    description:
      'Full-body stylized 3D caricature with oversized head, slim proportions, and premium character shading',
    prompt:
      'Using the uploaded photo as the sole identity reference, create a full-body stylized 3D caricature that faithfully preserves the person\'s recognizable facial features, body type, skin tone, ethnicity, hairstyle, facial hair, clothing, footwear, and accessories. The character should unmistakably resemble the person in the reference photo. Maintain a clean studio composition with the character standing upright in a relaxed pose, facing forward, with the entire body visible from head to toe. Apply a cohesive stylized character design with: An oversized head (approximately 1.8–2.2× realistic size), A very long, slim neck, A smaller, simplified torso, Long, thin arms and legs, Large expressive hands, Slightly oversized shoes, Gentle exaggeration of the person\'s natural facial features (nose, ears, jawline, cheeks, eyes, lips, eyebrows) while preserving identity, Expressive but believable proportions. Preserve the person\'s actual: race and skin tone, facial structure, hairstyle, facial hair, age appearance, body build (slim, average, muscular, heavy-set, etc.), clothing style, colors, textures and logos (unless copyright-safe replacements are required), accessories. Render using premium stylized 3D character artwork with: physically based materials, soft cinematic lighting, subtle skin texture, realistic fabric folds, clean matte surfaces, high-quality sculpted details, smooth stylized anatomy, slightly enlarged eyes with expressive brows. The expression should be natural and personality-driven rather than exaggerated into comedy. Keep the background completely transparent with no floor, shadows, props, or scenery. The final image should resemble a collectible animated film character or high-end stylized game character while remaining an unmistakable caricature of the person in the uploaded photograph.',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  carc2: {
    id: 'carc2',
    label: 'Caricature 2',
    categoryId: 'caricatures',
    description: 'Hilarious caricature with exaggerated facial features',
    prompt: 'create a hilarious caricature of the subject, exaggerated facial features',
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  carc3: {
    id: 'carc3',
    label: 'Caricature 3',
    categoryId: 'caricatures',
    description:
      'Hilarious caricature that exaggerates the subject’s most distinctive facial proportions',
    prompt:
      "create a hilarious caricature of the subject, Analyze the subject's naturally distinctive facial proportions and exaggerate their unique characteristics rather than applying generic oversized eyes or a uniformly enlarged head. Preserve identity while amplifying the person's most recognizable features in a humorous, flattering, and expressive way.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  carc4: {
    id: 'carc4',
    label: 'Caricature 4',
    categoryId: 'caricatures',
    description:
      'Hilarious caricature that exaggerates the subject’s most distinctive facial proportions',
    prompt:
      "create a hilarious caricature of the subject, Analyze the subject's naturally distinctive facial proportions and exaggerate their unique characteristics rather than applying generic oversized eyes or a uniformly enlarged head. Preserve identity while amplifying the person's most recognizable features in a humorous, flattering, and expressive way.",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  carc5: {
    id: 'carc5',
    label: 'Caricature 5',
    categoryId: 'caricatures',
    description: 'Hilarious caricature with exaggerated facial features',
    prompt: 'create a hilarious caricature of the subject, exaggerated facial features',
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  carc6: {
    id: 'carc6',
    label: 'Caricature 6',
    categoryId: 'caricatures',
    description: 'Hilarious caricature with exaggerated facial features',
    prompt: 'create a hilarious caricature of the subject, exaggerated facial features',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  carc7: {
    id: 'carc7',
    label: 'Caricature 7',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature face transfer — applies a cartoon template look while keeping race, sex, and facial identity',
    prompt:
      "Using the 1st picture as a style reference and the 2nd picture as the subject: switch the face treatment of the 2nd picture's subject to duplicate the overall caricature style of the 1st picture. Caricaturize the subject's face to match the style of the 1st picture while maintaining the 2nd subject's overall facial features, race, and sex. Maintain the caricature cartoon style.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc7.webp',
    enabled: true,
    premium: false,
  },
  carc8: {
    id: 'carc8',
    label: 'Caricature 8',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature face transfer — applies a cartoon template look while keeping race, sex, and facial identity',
    prompt:
      "Using the 1st picture as a style reference and the 2nd picture as the subject: switch the face treatment of the 2nd picture's subject to duplicate the overall caricature style of the 1st picture. Caricaturize the subject's face to match the style of the 1st picture while maintaining the 2nd subject's overall facial features, race, and sex. Maintain the caricature cartoon style.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc8.jpg',
    enabled: true,
    premium: false,
  },
  carc9: {
    id: 'carc9',
    label: 'Caricature 9',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature face transfer — applies a cartoon template look while keeping race, sex, and facial identity',
    prompt:
      "Using the 1st picture as a style reference and the 2nd picture as the subject: switch the face treatment of the 2nd picture's subject to duplicate the overall caricature style of the 1st picture. Caricaturize the subject's face to match the style of the 1st picture while maintaining the 2nd subject's overall facial features, race, and sex. Maintain the caricature cartoon style. No text.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc9.jpg',
    enabled: true,
    premium: false,
  },
  carc10: {
    id: 'carc10',
    label: 'Caricature 10',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature into a template scene — keeps the reference background and artistic expression while preserving subject identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st picture. If the subject is solo on the 2nd picture, do not add any other characters. No text.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc10.jpg',
    enabled: true,
    premium: false,
  },
  carc11: {
    id: 'carc11',
    label: 'Caricature 11',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature into a template scene — keeps the reference background and artistic expression while preserving subject facial identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st picture. If the subject is solo on the 2nd picture, do not add any other characters. No text. Try as much as possible to maintain facial identity of the 2nd picture's subject(s) facial features.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc11.png',
    enabled: true,
    premium: false,
  },
  carc12: {
    id: 'carc12',
    label: 'Caricature 12',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature face transfer — applies a cartoon template look while keeping race, sex, and facial identity',
    prompt:
      "Using the 1st picture as a style reference and the 2nd picture as the subject: switch the face treatment of the 2nd picture's subject to duplicate the overall caricature style of the 1st picture. Caricaturize the subject's face to match the style of the 1st picture while maintaining the 2nd subject's overall facial features, race, and sex. Maintain the caricature cartoon style.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc12.png',
    enabled: true,
    premium: false,
  },
  carc13: {
    id: 'carc13',
    label: 'Caricature 13',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature face transfer — applies a cartoon template look while keeping race, sex, clothing, and facial identity',
    prompt:
      "Using the 1st picture as a style reference and the 2nd picture as the subject: switch the face treatment of the 2nd picture's subject to duplicate the overall caricature style of the 1st picture. Caricaturize the subject's face to match the style of the 1st picture while maintaining the 2nd subject's overall facial features, race, and sex. Maintain the caricature cartoon style. Maintain the 2nd subject's clothing. Use a solid colorful background.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc13.png',
    enabled: true,
    premium: false,
  },
  carc14: {
    id: 'carc14',
    label: 'Caricature 14',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature into a template scene — keeps the reference background and exaggerated features while preserving subject identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st picture. If the subject is solo on the 2nd picture, do not add any other characters. No text. Don't add the rings. Maintain the 1st picture's exaggerated features.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc14.webp',
    enabled: true,
    premium: false,
  },
  carc15: {
    id: 'carc15',
    label: 'Caricature 15',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature into a template scene — keeps the reference background and exaggerated features while preserving subject identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st picture. If the subject is solo on the 2nd picture, do not add any other characters. No text. Don't add the rings. Maintain the 1st picture's exaggerated features.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc15.jpg',
    enabled: true,
    premium: false,
  },
  carc17: {
    id: 'carc17',
    label: 'Caricature 17',
    categoryId: 'caricatures',
    description:
      'Roman caricature style transfer — keeps subject identity, expression, clothing, and sex while applying the reference scene style',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st picture. If the subject is solo on the 2nd picture, do not add any other characters. No text. Maintain the 2nd subject's facial features and expressions while transferring the 1st picture's overall style. Keep the 2nd subject's clothes if they have any, including pants. Keep in mind the 2nd subject(s) sex. The 1st image is a Roman caricature and not an NSFW photo. Remove the club.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc17.jpg',
    enabled: true,
    premium: false,
  },
  carc18: {
    id: 'carc18',
    label: 'Caricature 18',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature into a template scene — keeps the reference background and exaggerated features while preserving subject identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st photo. If the subject is solo on the 2nd picture, do not add any other characters. No text. Don't add the earrings. Maintain the 1st picture's exaggerated features.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc18.jpg',
    enabled: true,
    premium: false,
  },
  carc19: {
    id: 'carc19',
    label: 'Caricature 19',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature into a template scene — keeps the reference background, clothing, and exaggerated features while preserving subject identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st photo. If the subject is solo on the 2nd picture, do not add any other characters. Keep the 2nd subject's clothes if they have any, including pants. No text. Don't add the basketball. Maintain the 1st picture's exaggerated features.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc19.webp',
    enabled: true,
    premium: false,
  },
  carc20: {
    id: 'carc20',
    label: 'Caricature 20',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature into a template scene — keeps reference background and exaggeration, subject clothes, face and body identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st photo. If the subject is solo on the 2nd picture, do not add any other characters. Keep the 2nd subject's clothes if they have any, include pants. No text. Maintain the 1st picture's exaggerated features. Maintain the 2nd picture's facial and body features. Keep gender on the 2nd picture in mind. do not transfer any facial and body likeness of the 1st pic.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc20.jpg',
    enabled: true,
    premium: false,
  },
  carc21: {
    id: 'carc21',
    label: 'Caricature 21',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature with solid colorful background — keeps exaggerated features, clothing, and facial identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Set a solid colorful background. If the subject is solo on the 2nd picture, do not add any other characters. Keep the 2nd subject's clothes if they have any, include pants. No text. Maintain the 1st picture's exaggerated features. Maintain the 2nd picture's facial features. Keep gender on the 2nd picture in mind. Don't add the chain and ring. Don't copy the left hand gesture.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc21.jpg',
    enabled: true,
    premium: false,
  },
  carc22: {
    id: 'carc22',
    label: 'Caricature 22',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature with solid colorful background — keeps exaggerated features, clothing, and facial identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Set a solid colorful background. If the subject is solo on the 2nd picture, do not add any other characters. Keep the 2nd subject's clothes if they have any, include pants. No text. Maintain the 1st picture's exaggerated features. Maintain the 2nd picture's facial features. Keep gender on the 2nd picture in mind. Don't add the tattoo, glasses and chain.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc22.jpg',
    enabled: true,
    premium: false,
  },
  '3d-bd': {
    id: '3d-bd',
    label: '3D BD',
    categoryId: 'caricatures',
    description: 'Ultra-realistic premium BD caricature with exaggerated features and cinematic lighting',
    prompt:
      "Transform the person in the original photograph into an ultra-realistic, highly detailed premium-quality BD caricature. Preserve the recognizability, facial features, head shape, hairstyle, clothing, pose, personality, and overall mood of the original photo. Exaggerate characteristic facial features to the extreme: enlarge the head relative to the body, make the character more expressive, but do not distort the person beyond recognition. Emphasize the shape of the eyes (make them huge), eyebrows, nose (make it big), lips, cheekbones, and jawline, while maintaining natural proportions and visual similarity to the reference. Add realistic skin microtexture: pores, expression lines, fine lines, natural folds, subtle imperfections, and smooth color transitions. The look should be vibrant and natural, without the effects of plastic, wax, or excessive ironing. Detail the hair, eyelashes, boots, and clothing textures: individual fibers, seams, folds, and natural light reflections. Use cinematic lighting, flickering volumetric shadows, expressive highlights, and realistic rendering. The final result should resemble a character from an expensive full-length animated film: stylized, charismatic, emotional, and distinctly... High-quality digitalization, professional",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  '3d': {
    id: '3d',
    label: '3D',
    categoryId: 'caricatures',
    description:
      'Ultra-realistic premium 3D caricature with exaggerated features and cinematic film-style rendering',
    prompt:
      "Transform a person in a source photo into an ultra-realistic, highly detailed premium 3D caricature. Preserve the recognizability, individual facial features, head shape, hairstyle, clothing, pose, emotion, and overall mood of the original photo. Exaggerate characteristic facial features to the extreme: enlarge the head relative to the body, make facial expressions more expressive, but don't distort the person beyond recognition. Emphasize the shape of the eyes (make them huge), eyebrows, nose (make it big), lips, cheekbones, and jawline, while maintaining natural proportions and visual similarity to the reference. Add realistic skin microtexture: pores, expression lines, fine wrinkles, natural folds, subtle imperfections, and smooth tonal transitions. The skin should look alive and natural, without the effect of plastic, wax, or excessive smoothing. Detail the hair, eyelashes, eyebrows, and clothing textures: individual fibers, seams, folds, and natural light reflections. Use cinematic lighting, soft volumetric shadows, expressive highlights, and realistic rendering. The final result should resemble a character from an expensive full-length animated film: stylized, charismatic, emotional, and photorealistic at the same time. Highly detailed, professional 3D rendering, ultra-realistic, cinematic lighting, 8K, no text, logos, or extraneous elements.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'dancing-carc': {
    id: 'dancing-carc',
    label: 'Dancing',
    categoryId: 'caricatures',
    description:
      'Exaggerated hybrid 3D-illustration dancing caricature with dynamic motion and painterly textures',
    prompt:
      "An exaggerated hybrid cartoon character combining sculpted 3D volume with expressive painted illustration style, featuring distorted stylized proportions and artistic facial deformation, freely adapting the person's appearance without realistic facial accuracy while keeping recognizable traits such as skin tone and hairstyle, the character captured in a dynamic dance pos full of motion and rhythm, flowing body ges and expressive posture, visible brush strok painted shadows and graphic textures layer over soft 3D forms, contemporary animated illustration aesthetic, solid blue studio background, stylized studio lighting translated into painterly highlights and shadows, energetic composition, textured paint surfaces and high-end hybrid 3D illustration render",
    model: NANO_BANANA_2,
    enabled: true,
    premium: false,
  },
  mugface: {
    id: 'mugface',
    label: 'Mugface',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature face transfer — applies a mug-style template look while keeping the subject recognizable',
    prompt:
      "Using the 1st picture as a style reference and the 2nd picture as the subject: switch the face treatment of the 2nd picture's subject to duplicate the overall caricature style of the 1st picture. Caricaturize the subject's face to match the style of the 1st picture while maintaining the 2nd subject's facial features and identity. Do not include the hat from the 1st picture.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/mugface.png',
    enabled: true,
    premium: false,
  },
  'tiny-muscle-v1': {
    id: 'tiny-muscle-v1',
    label: 'Tiny Muscle V1',
    categoryId: 'caricatures',
    description:
      'Humorous hyper-muscular cartoon caricature with oversized head and comic-book hero physique',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the person into a humorous hyper-muscular cartoon caricature while maintaining their recognizable face, hairstyle, skin tone, facial hair, and personality.\n\nExaggerate characteristic facial features to the extreme: enlarge the head relative to the body, make facial expressions more expressive, but don't distort the person beyond recognition. Emphasize the shape of the eyes (make them huge), eyebrows, nose (make it big), lips, cheekbones, and jawline, while maintaining natural proportions and visual similarity to the reference.\n\nDramatically exaggerate the physique with enormous rounded shoulders, gigantic biceps, thick forearms, massive chest, oversized trapezius muscles, a powerful V-shaped torso, sculpted eight-pack abs, broad back, muscular thighs, and athletic calves. The proportions should be intentionally exaggerated and cartoonishly powerful while remaining visually appealing and cohesive. The body should look like an impossibly muscular comic-book hero rather than a realistic bodybuilder.\n\nPreserve the person's facial identity, but subtly enhance the expression with a confident grin, determined eyes, and strong jawline without over-distorting their unique facial features.\n\nRender smooth, clean muscle contours with glossy skin highlights, rounded anatomical forms, and premium digital illustration quality. Emphasize heroic proportions, dynamic anatomy, exaggerated strength, and energetic visual appeal. Rich colour gradients, soft studio lighting, subtle ambient occlusion, crisp edges, and high-detail digital painting with a polished commercial illustration finish. Humorous yet impressive, premium character design, ultra-detailed, vibrant, 8K quality.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'tiny-muscle-v2': {
    id: 'tiny-muscle-v2',
    label: 'Tiny Muscle V2',
    categoryId: 'caricatures',
    description:
      'Humorous hyper-muscular cartoon caricature with oversized head and comic-book hero physique',
    prompt:
      "Preserve the uploaded person's identity exactly. Transform the person into a humorous hyper-muscular cartoon caricature while maintaining their recognizable face, hairstyle, skin tone, facial hair, and personality.\n\nExaggerate characteristic facial features to the extreme: enlarge the head relative to the body, make facial expressions more expressive, but don't distort the person beyond recognition. Emphasize the shape of the eyes (make them huge), eyebrows, nose (make it big), lips, cheekbones, and jawline, while maintaining natural proportions and visual similarity to the reference.\n\nDramatically exaggerate the physique with enormous rounded shoulders, gigantic biceps, thick forearms, massive chest, oversized trapezius muscles, a powerful V-shaped torso, sculpted eight-pack abs, broad back, muscular thighs, and athletic calves. The proportions should be intentionally exaggerated and cartoonishly powerful while remaining visually appealing and cohesive. The body should look like an impossibly muscular comic-book hero rather than a realistic bodybuilder.\n\nPreserve the person's facial identity, but subtly enhance the expression with a confident grin, determined eyes, and strong jawline without over-distorting their unique facial features.\n\nRender smooth, clean muscle contours with glossy skin highlights, rounded anatomical forms, and premium digital illustration quality. Emphasize heroic proportions, dynamic anatomy, exaggerated strength, and energetic visual appeal. Rich colour gradients, soft studio lighting, subtle ambient occlusion, crisp edges, and high-detail digital painting with a polished commercial illustration finish. Humorous yet impressive, premium character design, ultra-detailed, vibrant, 8K quality.",
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  'tiny-muscle-v3': {
    id: 'tiny-muscle-v3',
    label: 'Tiny Muscle V3',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature into a template scene — keeps the reference background and exaggerated features while preserving subject clothing and identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st picture. If the subject is solo on the 2nd picture, do not add any other characters. No text. Don't add the rings. Maintain the 1st picture's exaggerated features. Keep the 2nd subject's clothes if they have any. Keep in mind the 2nd subject(s) gender.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/caricatures/carc16.jpg',
    enabled: true,
    premium: false,
  },
  victorian: {
    id: 'victorian',
    label: 'Victorian',
    categoryId: 'caricatures',
    description:
      'Humorous late-Victorian 3D caricature with period fashion, sepia portrait atmosphere, and strong facial likeness',
    prompt:
      "Using the uploaded image as the only facial and identity reference, transform the subject into a humorous, highly recognizable 3D caricature set in the late Victorian era, approximately 1890–1901.\n\nPreserve the subject's identity and distinctive facial characteristics with high likeness accuracy. Retain their recognizable facial structure, eyes, nose, mouth, facial proportions, skin tone, hairstyle characteristics and other unique features. Do not replace the subject's face with a generic historical character.\n\nCreate a polished, high-quality 3D caricature with tasteful exaggeration: a slightly enlarged head, subtly exaggerated facial features, expressive eyes, distinctive facial proportions and a playful caricatured interpretation of the subject while maintaining strong facial likeness.\n\nDress the subject in authentic late-Victorian fashion appropriate to their gender and social setting. Use period-accurate clothing such as formal three-piece suits, waistcoats, high collars, cravats, pocket watches, long coats, Victorian dresses, corsets, skirts, hats, gloves and other appropriate late-19th-century garments.\n\nMake the historical styling visually rich and recognizable. Include authentic Victorian architecture, interiors, streets, furniture, props or environmental details when appropriate to the composition.\n\nAdd subtle humorous character elements that make the image feel like a Funnyfy caricature rather than a serious historical portrait. Give the subject a confident, slightly exaggerated personality and expressive pose while maintaining the dignity and visual language of the Victorian era.\n\nUse realistic 3D materials, detailed fabric, believable skin texture, cinematic lighting, soft depth of field and polished studio-quality rendering. The result should resemble a premium 3D caricature sculpture brought to life as a cinematic historical portrait.\n\nUse an authentic period photographic treatment inspired by late-19th-century portrait photography, including restrained sepia or monochrome tones, subtle film grain, soft contrast and an aged photographic atmosphere.\n\nThe final image should look like a humorous Victorian-era portrait of the actual uploaded person, combining strong facial likeness, tasteful caricature exaggeration and authentic historical styling.\n\nAvoid generic historical faces, changing the person's identity, modern clothing, modern hairstyles, modern objects, contemporary environments, cartoon-flat rendering, excessive facial distortion, grotesque features, photorealistic modern photography, or a simple sepia filter applied to the original image.",
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'monday-mood': {
    id: 'monday-mood',
    label: 'Monday',
    categoryId: 'moods-moments',
    description: 'Humorous Monday Mood cartoon — exhausted, relatable, identity preserved',
    prompt:
      "Preserve the uploaded person's identity exactly. Create a humorous Monday Mood cartoon illustration. The person is exhausted, slouching with a varied mood and expressions Add random scenarios in relation to the illustration. Warm painterly comic illustration, expressive brushwork, clean composition, humorous but relatable, identity preserved..",
    model: SEEDREAM_4_5,
    models: [SEEDREAM_4_5, NANO_BANANA_2, NANO_BANANA],
    enabled: false,
    premium: false,
  },
  'friday-feeling': {
    id: 'friday-feeling',
    label: 'Friday',
    categoryId: 'moods-moments',
    description: 'Humorous Friday Feeling illustration — excited, relaxed, full of energy',
    prompt:
      "Preserve the uploaded person's identity exactly. Create a humorous Friday Feeling illustration. The person is excited, relaxed, smiling, and full of energy with varied moods and expressions. Add random scenarios in relation to the illustration. Warm painterly comic illustration, expressive brushwork, clean composition, humorous but relatable, identity preserved.",
    model: NANO_BANANA_2,
    models: [NANO_BANANA_2, NANO_BANANA],
    enabled: false,
    premium: false,
  },
  payday: {
    id: 'payday',
    label: 'Payday',
    categoryId: 'moods-moments',
    description: 'Payday glow-up caricature — flush, smug, and briefly unstoppable',
    prompt:
      "Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Payday. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating a smug, flush, briefly-unstoppable grin. Scene: playful payday moment — bank notification vibe, shopping bags or coffee treat nearby, soft glamorous lighting. Mood: temporary wealth swagger, light comedy. Style: polished humorous editorial caricature. Full-bleed. No readable text, logos, watermarks, or borders.",
    model: NANO_BANANA,
    enabled: false,
    premium: false,
  },
  'end-of-month': {
    id: 'end-of-month',
    label: 'End of Month',
    categoryId: 'moods-moments',
    description: 'Broke-but-surviving end-of-month caricature — empty wallet energy',
    prompt:
      "Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as End of Month. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating a broke-but-surviving, empty-wallet expression. Scene: end-of-month realism — sparse fridge vibes, empty wallet or nearly empty card, ramen or toast nearby, soft comic lighting. Mood: relatable financial humor, not harsh. Style: polished humorous editorial caricature. Full-bleed. No readable text, logos, watermarks, or borders.",
    model: NANO_BANANA,
    enabled: false,
    premium: false,
  },
  'before-coffee': {
    id: 'before-coffee',
    label: 'Before Coffee',
    categoryId: 'moods-moments',
    description: 'Pre-caffeine zombie caricature — half-awake and unapproachable',
    prompt:
      "Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Before Coffee. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating a half-awake, unapproachable, pre-caffeine zombie expression. Scene: morning kitchen or bathroom — empty mug waiting, dim soft light, bedhead energy. Mood: comic warning label energy. Style: polished humorous editorial caricature. Full-bleed. No text, logos, watermarks, or borders.",
    model: NANO_BANANA,
    enabled: false,
    premium: false,
  },
  'after-coffee': {
    id: 'after-coffee',
    label: 'After Coffee',
    categoryId: 'moods-moments',
    description: 'Post-caffeine glow caricature — alert, caffeinated, and finally human',
    prompt:
      "Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as After Coffee. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating an alert, caffeinated, finally-human expression. Scene: bright morning light, steaming coffee cup in hand or nearby, energetic posture. Mood: revitalized comedy glow-up. Style: polished humorous editorial caricature with crisp lighting. Full-bleed. No text, logos, watermarks, or borders.",
    model: NANO_BANANA,
    enabled: false,
    premium: false,
  },
  'deadline-mode': {
    id: 'deadline-mode',
    label: 'Deadline Mode',
    categoryId: 'moods-moments',
    description: 'Deadline chaos caricature — intense focus, caffeine, and ticking clock energy',
    prompt:
      "Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Deadline Mode. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating intense focus, mild panic, and hyper-productive energy. Scene: desk buried in notes and screens, coffee cups, soft dramatic task lighting, ticking-clock tension without readable text. Mood: stressful comedy. Style: polished humorous editorial caricature. Full-bleed. No logos, watermarks, or borders.",
    model: NANO_BANANA,
    enabled: false,
    premium: false,
  },
  'vacation-mood': {
    id: 'vacation-mood',
    label: 'Vacation Mood',
    categoryId: 'moods-moments',
    description: 'Vacation-brain caricature — sunglasses, sun, and zero responsibilities',
    prompt:
      "Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Vacation Mood. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating a relaxed, sunglasses-optional, zero-responsibilities smile. Scene: sunny vacation setting — beach, pool, or resort lounge with warm sunlight and soft tropical colors. Mood: blissful escape comedy. Style: polished humorous editorial caricature. Full-bleed. No text, logos, watermarks, or borders.",
    model: NANO_BANANA,
    enabled: false,
    premium: false,
  },
  'gym-motivation': {
    id: 'gym-motivation',
    label: 'Gym Motivation',
    categoryId: 'moods-moments',
    description: 'Gym-day caricature — hyped, determined, and slightly overconfident',
    prompt:
      "Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Gym Motivation. Preserve facial likeness, age, ethnicity, hairstyle, and athletic or casual gym clothing while exaggerating a hyped, determined, slightly overconfident expression. Scene: gym or workout setting — weights, water bottle, energetic lighting. Mood: motivational comedy, not body-shaming. Style: polished humorous editorial caricature. Full-bleed. No text, logos, watermarks, or borders.",
    model: NANO_BANANA,
    enabled: false,
    premium: false,
  },
  'forgot-my-password': {
    id: 'forgot-my-password',
    label: 'Forgot My Password',
    categoryId: 'moods-moments',
    description: 'Password-reset rage caricature — staring at a screen in digital despair',
    prompt:
      "Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Forgot My Password. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating digital despair — blank stare, mild rage, forehead-in-hand energy at a laptop or phone. Scene: desk or couch with glowing screen, soft comic lighting. Mood: relatable tech frustration comedy. Style: polished humorous editorial caricature. Full-bleed. No readable UI text, logos, watermarks, or borders.",
    model: NANO_BANANA,
    enabled: false,
    premium: false,
  },
  ...buildStickerStyles(),
  [STICKER_SHEET_STYLE_ID]: STICKER_SHEET_STYLE,
};

export const STYLES_CONFIG: Record<string, StyleConfig> = {
  ...catalogPlaceholders(),
  ...LEGACY_STYLES,
};

export function getStyleById(styleId: string): StyleConfig | null {
  if (styleId === STICKER_SHEET_STYLE_ID) return STICKER_SHEET_STYLE;
  const style = STYLES_CONFIG[styleId];
  if (!style || !style.enabled) {
    return null;
  }
  return style;
}

export function getEnabledStyles(): StyleConfig[] {
  return Object.values(STYLES_CONFIG).filter(
    (style) => style.enabled !== false && style.id !== STICKER_SHEET_STYLE_ID,
  );
}

export function getFreeStyles(): StyleConfig[] {
  return getEnabledStyles().filter((style) => !style.premium);
}
