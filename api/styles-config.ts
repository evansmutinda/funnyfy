// Styles configuration - protected on server
// This file contains all style prompts and models
// Add new styles here - they'll be available instantly without app updates

export interface StyleConfig {
  id: string;
  label: string;
  description?: string;
  prompt: string;
  model: string;
  premium?: boolean;
  enabled?: boolean;
}

export const STYLES_CONFIG: Record<string, StyleConfig> = {
  '90s-cartoon': {
    id: '90s-cartoon',
    label: '90s Cartoon',
    description: 'Classic 90s animated cartoon style',
    prompt: 'Make this a 90s cartoon',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  chibi: {
    id: 'chibi',
    label: 'Chibi',
    description: 'Cute, big-head chibi cartoon style',
    prompt: 'Make this a chibi cartoon, maintaining posture and facial features',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  neon: {
    id: 'neon',
    label: 'Neon',
    description: 'Vibrant neon cartoon style',
    prompt: 'make a neon cartoon',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  anime: {
    id: 'anime',
    label: 'Anime',
    description: 'Anime-style cartoon',
    prompt: 'Make this an anime cartoon, maintaining poster and facial features',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  custom1: {
    id: 'custom1',
    label: 'Custom 1',
    description: 'Digital cartoon illustration with vibrant colors and proportion exaggeration',
    prompt: 'Using the uploaded photo as the facial reference, create a digital cartoon illustration of the same subject. Preserve the subject\'s recognizable facial likeness, while applying stylized, cartoon-like exaggeration. The subject is dressed in random shirt that fits snugly around a rounded torso, paired with random trousers that are slightly loose at the legs, and random shoes. His arms hang naturally by his sides, with relaxed but slightly clenched hands. The background is a bright blue sky with soft, fluffy white clouds, creating an open, cheerful atmosphere that contrasts with the subject\'s serious expression. Style: clean, polished contemporary digital cartoon illustration, with smooth linework, vibrant colors, and intentional proportion exaggeration (large head, simplified body). Maintain clarity, balanced proportions, and a friendly cartoon aesthetic. Full-bleed composition. No borders. No photorealism.',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  '3dclay': {
    id: '3dclay',
    label: '3D Clay',
    description: '3D Clay cartoon style',
    prompt: 'make this a 3D Clay cartoon',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  'oil-paint': {
    id: 'oil-paint',
    label: 'Oil Paint',
    description: 'Oil-paint cartoon caricature style',
    prompt: 'make this a Oil-paint cartoon caricature',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  'low-poly': {
    id: 'low-poly',
    label: 'Low-Poly Cartoon',
    description: 'Low-poly cartoon style',
    prompt: 'make this a low-poly cartoon',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  'water-color': {
    id: 'water-color',
    label: 'Water Color',
    description: 'Water color cartoon caricature style',
    prompt: 'make this a water color cartoon caricature',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  'pixar-like': {
    id: 'pixar-like',
    label: 'Pixar-like',
    description: 'Pixar-like cartoon style including background',
    prompt: 'make this a pixar-like cartoon including the background',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  'funko-pop': {
    id: 'funko-pop',
    label: 'Funko Pop',
    description: 'Funko Pop style',
    prompt: 'make this a funko pop',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  custom2: {
    id: 'custom2',
    label: 'Custom 2',
    description: 'Stylized 3D cartoon caricature with soft, friendly animated style - supports multiple faces',
    prompt: 'Using the uploaded photo as the reference, detect all clearly visible human faces in the image.Create a stylized 3D cartoon caricature of EACH person, preserving their individual facial likeness, skin tone, hairstyle, and expression.Do NOT merge faces and do NOT ignore secondary subjects. If multiple people are present:Apply the same 3D animated style consistently to all subjects, Maintain relative positions and scale between them,Keep each face distinct and recognizable,Reinterpret each person in a soft, friendly, animated 3D style with slightly exaggerated features, including: Large expressive eyes,Smooth rounded facial structure,Simplified nose and mouth,Warm, cheerful expressions,Skin should be smooth and matte, with soft lighting and no visible pores.Hair should be stylized and sculpted, with soft volume and clean shapes.Clothing should remain recognizable but simplified. Background may be simplified or softly blurred, but the relationship and interaction between subjects must be preserved.Render quality: polished 3D animated film style, clean geometry, soft shadows, warm color palette.Full-bleed composition. No borders. No photorealism.',
    model: 'black-forest-labs/flux-kontext-pro',
    enabled: true,
    premium: false
  },
  neandc: {
    id: 'neandc',
    label: 'Neanderthal',
    description: 'Funny neanderthal cartoon maintaining facial features in a random Neanderthalic setting',
    prompt: 'make this a funny neanderthal cartoon maintaining facial features, in a random Neanderthalic setting',
    model: 'google/nano-banana',
    enabled: true,
    premium: false
  },
  neand3d: {
    id: 'neand3d',
    label: 'Neanderthal 3D',
    description: 'Funny neanderthal 3D caricature maintaining facial features, detects and includes all humans',
    prompt: 'make this a funny neanderthal 3d caricature maintaining facial features, in a random Neanderthalic setting. detect and include all humans in the photo, caricaturize all humans once detected',
    model: 'google/nano-banana',
    enabled: true,
    premium: false
  },
  handd: {
    id: 'handd',
    label: 'Hand-Drawn',
    description: 'Traditional hand-drawn editorial caricature with colored-pencil and ink illustration style',
    prompt: 'Using the uploaded photo as the visual reference, create a hand-drawn editorial caricature of the subject. The caricature should feature a very large, exaggerated head and a small, simplified body, preserving the subject\'s core facial likeness while emphasizing distinctive features. Strongly exaggerate: Head size and facial proportions, Nose, cheeks, jaw, and brow, Eye spacing and expression. Style: Traditional colored-pencil and ink illustration, Visible pencil strokes, Cross-hatching and line shading, Slightly uneven, hand-drawn outlines, Subtle paper texture. Shading should be: Built with layered pencil tones, Warm, earthy colors, No smooth digital gradients. Facial expression should be expressive and characterful, leaning slightly humorous or serious depending on the reference photo. Clothing should be simplified and secondary, drawn with minimal detail to keep focus on the face. Background: Plain, light, off-white or beige, Minimal texture only, No scenery, no environment. Overall look: Classic newspaper / magazine caricature, Hand-drawn, imperfect, human, Exaggerated but recognizable. Full-bleed illustration. No borders. Avoid 3D, avoid painterly styles, avoid realism.',
    model: 'google/nano-banana',
    enabled: true,
    premium: false
  },
  superhero: {
    id: 'superhero',
    label: 'Superhero',
    description: 'Superhero caricature in action, avoiding trademarked themes, maintaining facial and body features',
    prompt: 'make a superhero caricature, in superhero costumes, avoid trademarked themes, set super hero actions like saving victims, stopping trains, stopping bad guys, etc. in random settings. maintain subjects facial and body features',
    model: 'google/nano-banana',
    enabled: true,
    premium: false
  },
  villian: {
    id: 'villian',
    label: 'Super Villain',
    description: 'Super villain caricature in action, avoiding trademarked themes, maintaining facial and body features',
    prompt: 'make a super villain caricature, in superhero costumes, avoid trademarked themes, set super villan actions like chasing victims, destroying stuff being bad guys, etc, in random settings. maintain subjects facial and body features',
    model: 'google/nano-banana',
    enabled: true,
    premium: false
  },
  cyborg: {
    id: 'cyborg',
    label: 'Cyborg',
    description: 'Cyborg cartoon caricature maintaining facial and body features, set in futuristic city settings',
    prompt: 'make a cyborg cartoon caricature, maintaining subjects facial and body features, set in futuristic random city in random settings',
    model: 'google/nano-banana',
    enabled: true,
    premium: false
  },
};

// Helper function to get style by ID
export function getStyleById(styleId: string): StyleConfig | null {
  const style = STYLES_CONFIG[styleId];
  if (!style || !style.enabled) {
    return null;
  }
  return style;
}

// Get all enabled styles (for public API)
export function getEnabledStyles(): StyleConfig[] {
  return Object.values(STYLES_CONFIG).filter(style => style.enabled !== false);
}

// Get all enabled non-premium styles (for free users)
export function getFreeStyles(): StyleConfig[] {
  return getEnabledStyles().filter(style => !style.premium);
}
