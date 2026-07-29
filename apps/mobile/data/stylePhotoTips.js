/**
 * Per-style photo tips for the upload flow.
 *
 * Return value from getStylePhotoTips:
 *   - tips object → show sheet (generic or custom)
 *   - null        → style needs no tips (auto-show skipped)
 *
 * To add style-specific tips later:
 *   STYLE_PHOTO_TIPS['before-coffee'] = { lead, examples, rules }
 * To disable tips for a style:
 *   STYLE_PHOTO_TIPS['some-style-id'] = null
 */

/** Upload auto-show sheet — set true when photo tips are ready to ship again. */
export const PHOTO_TIPS_AUTO_SHOW_ENABLED = false;

export const GENERIC_STYLE_PHOTO_TIPS = {
  id: 'generic',
  lead: 'Front-facing, well-lit portraits give the AI the most to work with.',
  examples: [
    {
      id: 'good-front',
      good: true,
      title: 'Face the camera',
      subtitle: 'Eyes visible, neutral angle',
      placeholder: true,
    },
    {
      id: 'good-light',
      good: true,
      title: 'Even lighting',
      subtitle: 'Soft light, minimal shadows',
      placeholder: true,
    },
    {
      id: 'bad-sunglasses',
      good: false,
      title: 'No sunglasses',
      subtitle: 'Eyes need to show',
      placeholder: true,
    },
    {
      id: 'bad-profile',
      good: false,
      title: 'No side angles',
      subtitle: 'Stay mostly frontal',
      placeholder: true,
    },
  ],
  rules: [
    'One person per photo',
    'Avoid hats, masks, or heavy shadows on the face',
    'Avoid photos with nudity, violence, or weapons — most issues are accidental, so another photo usually works',
  ],
};

/** @type {Record<string, typeof GENERIC_STYLE_PHOTO_TIPS | null>} */
const STYLE_PHOTO_TIPS = {};

export function getStylePhotoTips(styleId) {
  if (!PHOTO_TIPS_AUTO_SHOW_ENABLED) return null;
  if (!styleId) return null;
  if (Object.prototype.hasOwnProperty.call(STYLE_PHOTO_TIPS, styleId)) {
    return STYLE_PHOTO_TIPS[styleId];
  }
  return GENERIC_STYLE_PHOTO_TIPS;
}
