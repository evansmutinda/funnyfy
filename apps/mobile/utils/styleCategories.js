export const STYLE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'art', label: 'Art' },
  { id: 'fun', label: 'Fun' },
];

const CATEGORY_BY_STYLE_ID = {
  '90s-cartoon': 'cartoon',
  chibi: 'cartoon',
  neon: 'cartoon',
  anime: 'cartoon',
  custom1: 'cartoon',
  custom2: 'cartoon',
  '3dclay': 'cartoon',
  'pixar-like': 'cartoon',
  'funko-pop': 'cartoon',
  'low-poly': 'cartoon',
  'oil-paint': 'art',
  'water-color': 'art',
  handd: 'art',
  neandc: 'fun',
  neand3d: 'fun',
  superhero: 'fun',
  villian: 'fun',
  cyborg: 'fun',
};

export const HERO_STYLE_IDS = ['anime', '90s-cartoon'];

export function getStyleCategory(styleId) {
  return CATEGORY_BY_STYLE_ID[styleId] || 'cartoon';
}

export function pickHeroStyle(styles) {
  if (!Array.isArray(styles) || styles.length === 0) return null;
  for (const id of HERO_STYLE_IDS) {
    const found = styles.find((s) => s.id === id);
    if (found) return found;
  }
  return styles[0];
}
