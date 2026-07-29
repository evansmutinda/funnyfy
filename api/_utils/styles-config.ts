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
  premium?: boolean;
  enabled?: boolean;
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

/** Live styles — not in spreadsheet IDs; kept for backward compatibility with jobs/gallery */
const LEGACY_STYLES: Record<string, StyleConfig> = {
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
    model: DEFAULT_MODEL,
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
  dc: {
    id: 'dc',
    label: 'DC',
    categoryId: 'cartoons',
    description: 'DC style cartoon with bold superhero comic-book character design',
    prompt: 'make this a DC style Cartoon',
    model: DEFAULT_MODEL,
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
    label: 'Disney',
    categoryId: 'cartoons',
    description: 'Disney-style cartoon with soft features and classic animated character charm',
    prompt: 'make this a disney style cartoon, no extra text',
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
    categoryId: 'anime-manga',
    description: 'Anime-style cartoon',
    prompt: 'Make this an anime cartoon, maintaining poster and facial features',
    model: DEFAULT_MODEL,
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
    description: 'Pop art portrait with bold comic-inspired color blocks',
    prompt: 'make this a pop art.',
    model: NANO_BANANA,
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
  surreal: {
    id: 'surreal',
    label: 'Surreal',
    categoryId: 'art',
    description: 'Surreal art portrait with dreamlike forms and imaginative composition',
    prompt: 'Make this a surreal art',
    model: NANO_BANANA,
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
    prompt: 'using this pic make all subjects as a Hiroshige Inspired Painting, no extra text',
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
    description: 'Funko Pop style',
    prompt: 'make this a funko pop',
    model: DEFAULT_MODEL,
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
    label: 'Plastic Toy',
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
    label: 'Plastic Toy',
    categoryId: '3d-characters',
    description:
      'Premium stylized plastic toy render preserving the original scene, pose, and composition',
    prompt:
      "Using the uploaded image as your ONLY reference, transform it into a high-quality stylized 3D render of a plastic toy, STRICTLY preserving the original scene without any changes: same object, same pose, same camera angle, same framing, same proportions, same lighting direction, same shadows, and same composition. The final image should look like an exact copy of the original photograph, transformed into a toy version, not a reimagining of it. Transform all characters and objects into the aesthetics of a premium collectible toy made of molded plastic. Surfaces should be exceptionally smooth, clean, and glossy, with controlled specular highlights, like those found in high-end designer toys or luxury collectible figurines. Add realistic structural details to the toy: visible hinge joints at the shoulders, elbows, hips, and knees (neat round or segmented hinges); subtle joint lines along the limbs and body parts; if necessary, minimal facial segmentation lines (very subtle, like those on premium action figures, no exaggeration); hinges should appear naturally integrated into the design and not interfere with the anatomy. The skin should be transformed into a smooth synthetic plastic (without pores or any imperfections), while fully preserving the character's personality and facial structure. Eyes should have a slight glossy sheen, like the painted eyes of the toy. Clothing should be transformed into plastic-coated materials (latex, rubberized surfaces, molded plastic, etc.), while maintaining the exact same design, folds, and construction - without any redesign.",
    model: NANO_BANANA_2,
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
    model: SEEDREAM_4_5,
    enabled: true,
    premium: false,
  },
  'figurine-v2b': {
    id: 'figurine-v2b',
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
    categoryId: 'caricatures',
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
    categoryId: 'caricatures',
    description: 'Watercolor caricature with soft painterly washes and stylized shading',
    prompt: 'Make this a Watercolor caricature',
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  carc1: {
    id: 'carc1',
    label: 'Carc1',
    categoryId: 'caricatures',
    description:
      'Full-body stylized 3D caricature with oversized head, slim proportions, and premium character shading',
    prompt:
      'Using the uploaded photo as the sole identity reference, create a full-body stylized 3D caricature that faithfully preserves the person\'s recognizable facial features, body type, skin tone, ethnicity, hairstyle, facial hair, clothing, footwear, and accessories. The character should unmistakably resemble the person in the reference photo. Maintain a clean studio composition with the character standing upright in a relaxed pose, facing forward, with the entire body visible from head to toe. Apply a cohesive stylized character design with: An oversized head (approximately 1.8–2.2× realistic size), A very long, slim neck, A smaller, simplified torso, Long, thin arms and legs, Large expressive hands, Slightly oversized shoes, Gentle exaggeration of the person\'s natural facial features (nose, ears, jawline, cheeks, eyes, lips, eyebrows) while preserving identity, Expressive but believable proportions. Preserve the person\'s actual: race and skin tone, facial structure, hairstyle, facial hair, age appearance, body build (slim, average, muscular, heavy-set, etc.), clothing style, colors, textures and logos (unless copyright-safe replacements are required), accessories. Render using premium stylized 3D character artwork with: physically based materials, soft cinematic lighting, subtle skin texture, realistic fabric folds, clean matte surfaces, high-quality sculpted details, smooth stylized anatomy, slightly enlarged eyes with expressive brows. The expression should be natural and personality-driven rather than exaggerated into comedy. Keep the background completely transparent with no floor, shadows, props, or scenery. The final image should resemble a collectible animated film character or high-end stylized game character while remaining an unmistakable caricature of the person in the uploaded photograph.',
    model: SEEDREAM_4,
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
  'monday-mood': {
    id: 'monday-mood',
    label: 'Monday',
    categoryId: 'moods-moments',
    description: 'Humorous Monday Mood cartoon — exhausted, relatable, identity preserved',
    prompt:
      "Preserve the uploaded person's identity exactly. Create a humorous Monday Mood cartoon illustration. The person is exhausted, slouching with a varied mood and expressions Add random scenarios in relation to the illustration. Warm painterly comic illustration, expressive brushwork, clean composition, humorous but relatable, identity preserved..",
    model: SEEDREAM_4_5,
    models: [SEEDREAM_4_5, NANO_BANANA_2, NANO_BANANA],
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
    premium: false,
  },
};

export const STYLES_CONFIG: Record<string, StyleConfig> = {
  ...catalogPlaceholders(),
  ...LEGACY_STYLES,
};

export function getStyleById(styleId: string): StyleConfig | null {
  const style = STYLES_CONFIG[styleId];
  if (!style || !style.enabled) {
    return null;
  }
  return style;
}

export function getEnabledStyles(): StyleConfig[] {
  return Object.values(STYLES_CONFIG).filter((style) => style.enabled !== false);
}

export function getFreeStyles(): StyleConfig[] {
  return getEnabledStyles().filter((style) => !style.premium);
}
