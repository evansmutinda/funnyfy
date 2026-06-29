// Styles configuration - protected on server
// Catalog: 160 styles from Funnyfy_Categories_Updated.xlsx (placeholders, disabled by default)
// Legacy: 19 live styles with real prompts (enabled)
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
  model: string;
  premium?: boolean;
  enabled?: boolean;
}

const DEFAULT_MODEL = 'black-forest-labs/flux-kontext-pro';
const NANO_BANANA = 'google/nano-banana';
const SEEDREAM_4 = 'bytedance/seedream-4';

const CARC1_PROMPT =
  'Using the uploaded photo as the sole identity reference, create a full-body stylized 3D caricature that faithfully preserves the person\'s recognizable facial features, body type, skin tone, ethnicity, hairstyle, facial hair, clothing, footwear, and accessories. The character should unmistakably resemble the person in the reference photo. ' +
  'Maintain a clean studio composition with the character standing upright in a relaxed pose, facing forward, with the entire body visible from head to toe. ' +
  'Apply a cohesive stylized character design with: An oversized head (approximately 1.8–2.2× realistic size), A very long, slim neck, A smaller, simplified torso, Long, thin arms and legs, Large expressive hands, Slightly oversized shoes, Gentle exaggeration of the person\'s natural facial features (nose, ears, jawline, cheeks, eyes, lips, eyebrows) while preserving identity, Expressive but believable proportions. ' +
  'Preserve the person\'s actual: race and skin tone, facial structure, hairstyle, facial hair, age appearance, body build (slim, average, muscular, heavy-set, etc.), clothing style, colors, textures and logos (unless copyright-safe replacements are required), accessories. ' +
  'Render using premium stylized 3D character artwork with: physically based materials, soft cinematic lighting, subtle skin texture, realistic fabric folds, clean matte surfaces, high-quality sculpted details, smooth stylized anatomy, slightly enlarged eyes with expressive brows. ' +
  'The expression should be natural and personality-driven rather than exaggerated into comedy. ' +
  'Keep the background completely transparent with no floor, shadows, props, or scenery. ' +
  'The final image should resemble a collectible animated film character or high-end stylized game character while remaining an unmistakable caricature of the person in the uploaded photograph.';

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
  custom1: {
    id: 'custom1',
    label: 'Custom 1',
    categoryId: 'trending',
    description: 'Digital cartoon illustration with vibrant colors and proportion exaggeration',
    prompt:
      "Using the uploaded photo as the facial reference, create a digital cartoon illustration of the same subject. Preserve the subject's recognizable facial likeness, while applying stylized, cartoon-like exaggeration. The subject is dressed in random shirt that fits snugly around a rounded torso, paired with random trousers that are slightly loose at the legs, and random shoes. His arms hang naturally by his sides, with relaxed but slightly clenched hands. The background is a bright blue sky with soft, fluffy white clouds, creating an open, cheerful atmosphere that contrasts with the subject's serious expression. Style: clean, polished contemporary digital cartoon illustration, with smooth linework, vibrant colors, and intentional proportion exaggeration (large head, simplified body). Maintain clarity, balanced proportions, and a friendly cartoon aesthetic. Full-bleed composition. No borders. No photorealism.",
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
  'low-poly': {
    id: 'low-poly',
    label: 'Low-Poly Cartoon',
    categoryId: 'art',
    description: 'Low-poly cartoon style',
    prompt: 'make this a low-poly cartoon',
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
  custom2: {
    id: 'custom2',
    label: 'Custom 2',
    categoryId: 'trending',
    description: 'Stylized 3D cartoon caricature with soft, friendly animated style - supports multiple faces',
    prompt:
      'Using the uploaded photo as the reference, detect all clearly visible human faces in the image.Create a stylized 3D cartoon caricature of EACH person, preserving their individual facial likeness, skin tone, hairstyle, and expression.Do NOT merge faces and do NOT ignore secondary subjects. If multiple people are present:Apply the same 3D animated style consistently to all subjects, Maintain relative positions and scale between them,Keep each face distinct and recognizable,Reinterpret each person in a soft, friendly, animated 3D style with slightly exaggerated features, including: Large expressive eyes,Smooth rounded facial structure,Simplified nose and mouth,Warm, cheerful expressions,Skin should be smooth and matte, with soft lighting and no visible pores.Hair should be stylized and sculpted, with soft volume and clean shapes.Clothing should remain recognizable but simplified. Background may be simplified or softly blurred, but the relationship and interaction between subjects must be preserved.Render quality: polished 3D animated film style, clean geometry, soft shadows, warm color palette.Full-bleed composition. No borders. No photorealism.',
    model: DEFAULT_MODEL,
    enabled: true,
    premium: false,
  },
  neandc: {
    id: 'neandc',
    label: 'Neanderthal',
    categoryId: 'fantasy-mythical',
    description: 'Funny neanderthal cartoon maintaining facial features in a random Neanderthalic setting',
    prompt: 'make this a funny neanderthal cartoon maintaining facial features, in a random Neanderthalic setting',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  neand3d: {
    id: 'neand3d',
    label: 'Neanderthal 3D',
    categoryId: 'fantasy-mythical',
    description: 'Funny neanderthal 3D caricature maintaining facial features, detects and includes all humans',
    prompt:
      'make this a funny neanderthal 3d caricature maintaining facial features, in a random Neanderthalic setting. detect and include all humans in the photo, caricaturize all humans once detected',
    model: NANO_BANANA,
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
  carc1: {
    id: 'carc1',
    label: 'Carc1',
    categoryId: 'caricatures',
    description:
      'Full-body stylized 3D caricature with oversized head, slim proportions, and premium character shading',
    prompt: CARC1_PROMPT,
    model: SEEDREAM_4,
    enabled: true,
    premium: false,
  },
  superhero: {
    id: 'superhero',
    label: 'Superhero',
    categoryId: 'video-games',
    description: 'Superhero caricature in action, avoiding trademarked themes, maintaining facial and body features',
    prompt:
      'make a superhero caricature, in superhero costumes, avoid trademarked themes, set super hero actions like saving victims, stopping trains, stopping bad guys, etc. in random settings. maintain subjects facial and body features',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  villian: {
    id: 'villian',
    label: 'Super Villain',
    categoryId: 'video-games',
    description: 'Super villain caricature in action, avoiding trademarked themes, maintaining facial and body features',
    prompt:
      'make a super villain caricature, in superhero costumes, avoid trademarked themes, set super villan actions like chasing victims, destroying stuff being bad guys, etc, in random settings. maintain subjects facial and body features',
    model: NANO_BANANA,
    enabled: true,
    premium: false,
  },
  cyborg: {
    id: 'cyborg',
    label: 'Cyborg',
    categoryId: 'video-games',
    description: 'Cyborg cartoon caricature maintaining facial and body features, set in futuristic city settings',
    prompt:
      'make a cyborg cartoon caricature, maintaining subjects facial and body features, set in futuristic random city in random settings',
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
