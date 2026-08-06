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
   * Example: `style-refs/mugface.jpg` → served from /public on Vercel.
   */
  referenceImage?: string;
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
    referenceImage: 'style-refs/carc7.webp',
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
    referenceImage: 'style-refs/carc8.jpg',
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
    referenceImage: 'style-refs/carc9.jpg',
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
    referenceImage: 'style-refs/carc10.jpg',
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
      "Using the 1st picture as a style reference and the 2nd picture as the subject: switch the face treatment of the 2nd picture's subject to duplicate the overall caricature style of the 1st picture. Caricaturize the subject's face to match the style of the 1st picture while maintaining the 2nd subject's overall facial features, race, and sex. Maintain the caricature cartoon style. Don't add the cigarette.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/carc12.jpg',
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
      "Using the 1st picture as a style reference and the 2nd picture as the subject: switch the face treatment of the 2nd picture's subject to duplicate the overall caricature style of the 1st picture. Caricaturize the subject's face to match the style of the 1st picture while maintaining the 2nd subject's overall facial features, race, and sex. Maintain the caricature cartoon style. Don't add the cigarette. Maintain the 2nd subject's clothing. Use a solid colorful background.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/carc13.jpg',
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
    referenceImage: 'style-refs/carc14.webp',
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
    referenceImage: 'style-refs/carc15.jpg',
    enabled: true,
    premium: false,
  },
  carc16: {
    id: 'carc16',
    label: 'Caricature 16',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature into a template scene — keeps the reference background and exaggerated features while preserving subject clothing and identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st picture. If the subject is solo on the 2nd picture, do not add any other characters. No text. Don't add the rings. Maintain the 1st picture's exaggerated features. Keep the 2nd subject's clothes if they have any. Keep in mind the 2nd subject(s) sex.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/carc16.jpg',
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
    referenceImage: 'style-refs/carc17.jpg',
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
    referenceImage: 'style-refs/carc18.jpg',
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
    referenceImage: 'style-refs/carc19.webp',
    enabled: true,
    premium: false,
  },
  carc20: {
    id: 'carc20',
    label: 'Caricature 20',
    categoryId: 'caricatures',
    description:
      'Style-matched caricature into a template scene — keeps reference background, exaggerated features, clothing, and facial identity',
    prompt:
      "Using the 1st picture as a reference, caricaturize the subject(s) of the 2nd picture with the overall artistic expression of the 1st picture. Maintain the background of the 1st photo. If the subject is solo on the 2nd picture, do not add any other characters. Keep the 2nd subject's clothes if they have any, include pants. No text. Maintain the 1st picture's exaggerated features. Maintain the 2nd picture's facial features. Keep gender on the 2nd picture in mind.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/carc20.jpg',
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
    referenceImage: 'style-refs/carc21.jpeg',
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
      "Using the 1st picture as a style reference and the 2nd picture as the subject: switch the face treatment of the 2nd picture's subject to duplicate the overall caricature style of the 1st picture. Caricaturize the subject's face to match the style of the 1st picture while maintaining the 2nd subject's facial features and identity. Do not include the hat, sweat, or smoke pipe from the 1st picture.",
    model: NANO_BANANA_2,
    referenceImage: 'style-refs/mugface.jpg',
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
