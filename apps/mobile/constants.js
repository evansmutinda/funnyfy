import { Dimensions, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

export { FUNNYFY_FOLDER_NAME, saveToFunnyfyAlbum } from './utils/funnyfyAlbum';

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://funnyfy-staging.vercel.app';

export const SUPPORT_EMAIL = 'support@funnyfy.app';
export const APP_NAME = 'FunnyFy';
export const COMPANY_NAME = 'FunnyFy';
/** Set EXPO_PUBLIC_APP_STORE_URL when Play/App Store listing is live. */
export const APP_STORE_LISTING_URL = process.env.EXPO_PUBLIC_APP_STORE_URL || '';

const APP_VERSION =
  Constants.expoConfig?.version ??
  Constants.manifest2?.extra?.expoClient?.version ??
  require('./version.json').version;

export const PRIVACY_POLICY_TEXT = `Last updated: ${new Date().toLocaleDateString()}

${COMPANY_NAME} ("we", "us", "our") operates the ${APP_NAME} mobile application ("the App"). This page informs you of our policies regarding the collection, use, and disclosure of personal information when you use the App.

1. INFORMATION WE COLLECT

Photos You Upload
When you generate a caricature, the photo you upload is temporarily processed by our AI partner (Replicate) to create your caricature. Photos are not stored on our servers after processing.

Anonymous Account Identifier
We generate a random anonymous identifier for your device when you first open the App. This lets us track your trial usage and subscription status without collecting personal data.

Subscription Information
If you subscribe, our payment processor (RevenueCat with Google Play) handles your payment. We receive only your subscription tier and renewal status — never your credit card or payment details.

Usage Data
We track how many caricatures you generate to enforce your monthly quota. We may collect basic technical data (device model, OS version, app version) for crash reporting and analytics.

2. HOW WE USE YOUR INFORMATION

We use the information we collect to:
• Provide the caricature generation service
• Process your subscription and enforce usage limits
• Improve the App's performance and fix bugs
• Comply with legal obligations

We do NOT:
• Sell your data to third parties
• Use your photos to train AI models
• Share your data with advertisers

3. DATA SHARING

We share data only with these third-party services that help us operate the App:
• Replicate (AI image generation)
• RevenueCat (subscription management)
• Google Play (in-app purchases)
• Vercel (server hosting)
• Supabase (database hosting)

These providers are bound by their own privacy policies and process data only as needed to provide their services.

4. DATA RETENTION

• Uploaded photos: Deleted from our servers after processing (within hours)
• Generated caricatures: Hosted on Replicate's CDN for ~24 hours, then automatically deleted
• Account data: Retained as long as you use the App. Deleted on request.
• Subscription records: Retained for legal/tax compliance (typically 7 years)

5. YOUR RIGHTS

You can:
• Request a copy of your data
• Request deletion of your account and all associated data
• Opt out of analytics (contact us)

To exercise these rights, email ${SUPPORT_EMAIL}.

6. CHILDREN'S PRIVACY

The App is not intended for children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal information, contact us immediately.

7. SECURITY

We use industry-standard security measures: HTTPS for all data transmission, encrypted databases, and authenticated APIs. However, no method of transmission over the internet is 100% secure.

8. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the App and updating the "Last updated" date.

9. CONTACT US

If you have questions about this Privacy Policy, contact us at: ${SUPPORT_EMAIL}
`;

export const TERMS_TEXT = `Last updated: ${new Date().toLocaleDateString()}

These Terms and Conditions ("Terms") govern your use of the ${APP_NAME} mobile application ("the App"). By using the App, you agree to these Terms.

1. ACCEPTANCE

By downloading, installing, or using the App, you agree to be bound by these Terms. If you do not agree, do not use the App.

2. ELIGIBILITY

You must be at least 13 years old to use the App. By using the App, you represent that you meet this age requirement.

3. USE OF THE APP

The App is provided for personal, non-commercial use. You may:
• Upload photos to generate caricatures
• Save and share generated caricatures for personal use

You may NOT:
• Upload photos of others without their consent
• Upload illegal, inappropriate, or copyrighted images without permission
• Use the App for commercial resale of caricatures without a license
• Attempt to reverse engineer, hack, or abuse the App
• Use automated tools, bots, or scripts to interact with the App
• Upload images of minors in any sexual, suggestive, or exploitative context

Violation of these terms may result in account suspension or termination.

4. CONTENT OWNERSHIP

You retain ownership of photos you upload. By uploading, you grant us a limited license to process the photo solely for caricature generation.

You own the caricatures generated from your photos. We retain no ownership claim on your generated content.

5. SUBSCRIPTIONS

The App offers monthly subscription plans (Starter, Popular, Pro) with different generation quotas. Subscriptions:
• Auto-renew monthly unless canceled
• Can be canceled anytime through your Google Play account
• Provide quota that resets each billing cycle
• Unused quota does not roll over

Subscription pricing is shown in the App and may change with notice.

6. FREE TRIAL

New users receive 3 free caricature generations. After the trial, a subscription is required to continue using the App.

7. INTELLECTUAL PROPERTY

The App, including its design, code, and content (other than user-uploaded photos), is owned by ${COMPANY_NAME} and protected by copyright laws.

8. DISCLAIMERS

THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee:
• Continuous availability of the service
• The quality or accuracy of generated caricatures
• That the App will meet your specific needs

9. LIMITATION OF LIABILITY

To the maximum extent permitted by law, ${COMPANY_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App. Our total liability is limited to the amount you paid us in the 12 months prior to the claim.

10. TERMINATION

We may suspend or terminate your access to the App at any time for violation of these Terms or for any other reason at our discretion. You can stop using the App at any time.

11. CHANGES TO TERMS

We may modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.

12. GOVERNING LAW

These Terms are governed by the laws of the jurisdiction in which ${COMPANY_NAME} operates, without regard to conflict of law principles.

13. CONTACT

For questions about these Terms, contact us at: ${SUPPORT_EMAIL}
`;

export const ABOUT_TEXT = `${APP_NAME}

Transform your photos into amazing caricatures with the power of AI.

Pick a style, upload a photo, and watch the magic happen.

Version ${APP_VERSION}

Made with care.

Contact: ${SUPPORT_EMAIL}`;

export const { height: SCREEN_HEIGHT } = Dimensions.get('window');
export const BOTTOM_INSET_MIN = Platform.OS === 'android' ? 48 : 34;

export const SAVED_IMAGE_EXTENSION = 'png';
export const SAVED_IMAGE_MIME = 'image/png';

export function getSavedImageFileName() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `Funnyfy-${y}-${m}-${day}_${h}${min}${s}.${SAVED_IMAGE_EXTENSION}`;
}

export const STYLE_CARD_IMAGE_DEFAULT = require('./assets/toon.jpg');
export const STYLE_CARD_IMAGE_CHIBI = require('./assets/chibi.jpg');
export const STYLE_CARD_IMAGE_CLASSIC_V1 = require('./assets/comparisons/tiles/after/cartoons/classic.jpg');
export const STYLE_CARD_IMAGE_CLASSIC_V2 = require('./assets/comparisons/tiles/after/cartoons/classicv2.jpg');
export const STYLE_CARD_IMAGE_SATURDAY_V1 = require('./assets/comparisons/tiles/after/cartoons/smv1.jpg');
export const STYLE_CARD_IMAGE_SATURDAY_V2 = require('./assets/comparisons/tiles/after/cartoons/smv2.jpg');
export const STYLE_CARD_IMAGE_COMIC = require('./assets/comparisons/tiles/after/cartoons/comic.jpg');
export const STYLE_CARD_IMAGE_COMIC_V1 = require('./assets/comparisons/tiles/after/cartoons/comic-v1.jpg');
export const STYLE_CARD_IMAGE_COMIC_V2 = require('./assets/comparisons/tiles/after/cartoons/comic-v2.jpg');
export const STYLE_CARD_IMAGE_CUTE = require('./assets/comparisons/tiles/after/cartoons/cute.jpg');
export const STYLE_CARD_IMAGE_DC = require('./assets/comparisons/tiles/after/cartoons/dc.jpg');
export const STYLE_CARD_IMAGE_CYBERPUNK_V1 = require('./assets/comparisons/tiles/after/cartoons/cyberpunkv1.jpg');
export const STYLE_CARD_IMAGE_CYBERPUNK_V2 = require('./assets/comparisons/tiles/after/cartoons/cyberpunkv2.jpg');
export const STYLE_CARD_IMAGE_DISNEY = require('./assets/comparisons/tiles/after/cartoons/disney.jpg');
export const STYLE_CARD_IMAGE_PIXEL = require('./assets/comparisons/tiles/after/cartoons/pixel.jpg');
export const STYLE_CARD_IMAGE_3D_RENDER_V1 = require('./assets/comparisons/tiles/after/cartoons/3d-renderv1.jpg');
export const STYLE_CARD_IMAGE_3D_RENDER_V2 = require('./assets/comparisons/tiles/after/cartoons/3d-renderv2.jpg');
export const STYLE_CARD_IMAGE_NEON = require('./assets/comparisons/tiles/after/Art/neon.jpg');
export const STYLE_CARD_IMAGE_ANIME = require('./assets/anime.jpg');
export const STYLE_CARD_IMAGE_HANDD = require('./assets/handd.jpeg');
export const STYLE_CARD_IMAGE_EDITORIAL = require('./assets/comparisons/tiles/after/caricature/editorial.jpg');
export const STYLE_CARD_IMAGE_EXAGGERATED = require('./assets/comparisons/tiles/after/caricature/Exaggerated.jpg');
export const STYLE_CARD_IMAGE_WATERCOLOR_C = require('./assets/comparisons/tiles/after/caricature/Watercolor-c.jpg');
export const STYLE_CARD_IMAGE_CARC1 = require('./assets/carc1.jpg');
export const STYLE_CARD_IMAGE_3D_BD = require('./assets/comparisons/tiles/after/caricature/3dbd.jpg');
export const STYLE_CARD_IMAGE_3D = require('./assets/comparisons/tiles/after/caricature/3d.jpg');
export const STYLE_CARD_IMAGE_3DCLAY = require('./assets/3dclay.jpg');
export const STYLE_CARD_IMAGE_OILPAINT = require('./assets/oilpaint.jpg');
export const STYLE_CARD_IMAGE_LOWPOLY = require('./assets/comparisons/tiles/after/Art/lowpoly.jpg');
export const STYLE_CARD_IMAGE_MURAL = require('./assets/comparisons/tiles/after/Art/mural.jpg');
export const STYLE_CARD_IMAGE_POP_ART_V1 = require('./assets/comparisons/tiles/after/Art/portart-fkp.jpg');
export const STYLE_CARD_IMAGE_POP_ART_V2 = require('./assets/comparisons/tiles/after/Art/popart-sr4.jpg');
export const STYLE_CARD_IMAGE_POP_ART_V3 = require('./assets/comparisons/tiles/after/Art/popart-nbn.jpg');
export const STYLE_CARD_IMAGE_GRAFFITI = require('./assets/comparisons/tiles/after/Art/graffiti.jpg');
export const STYLE_CARD_IMAGE_BANKSY = require('./assets/comparisons/tiles/after/Art/banksy.jpg');
export const STYLE_CARD_IMAGE_MOSAIC = require('./assets/comparisons/tiles/after/Art/mosaic.jpg');
export const STYLE_CARD_IMAGE_HEXAGONAL_MOSAIC = require('./assets/comparisons/tiles/after/Art/hexagon-mosaic.jpg');
export const STYLE_CARD_IMAGE_EGLOW = require('./assets/comparisons/tiles/after/Art/eglow.jpg');
export const STYLE_CARD_IMAGE_ABSTRACT_V1 = require('./assets/comparisons/tiles/after/Art/abstractv1.jpg');
export const STYLE_CARD_IMAGE_ABSTRACT_V2 = require('./assets/comparisons/tiles/after/Art/abstractv2.jpg');
export const STYLE_CARD_IMAGE_GEOMETRIC = require('./assets/comparisons/tiles/after/Art/geometric.jpg');
export const STYLE_CARD_IMAGE_SURREAL = require('./assets/comparisons/tiles/after/Art/surreal.jpg');
export const STYLE_CARD_IMAGE_COLOURED_GLASS = require('./assets/comparisons/tiles/after/Art/coloured-glass.jpg');
export const STYLE_CARD_IMAGE_PASTE_UP = require('./assets/comparisons/tiles/after/Art/Paste-up.jpg');
export const STYLE_CARD_IMAGE_MONDAY = require('./assets/comparisons/tiles/after/Moods&Moments/mondays1.jpg');
export const STYLE_CARD_IMAGE_FRIDAY = require('./assets/comparisons/tiles/after/Moods&Moments/fridays1.jpg');
export const STYLE_CARD_IMAGE_WC = require('./assets/wc.jpg');
export const STYLE_CARD_IMAGE_ACRYLIC = require('./assets/comparisons/tiles/after/Paintings/Acrylic.jpg');
export const STYLE_CARD_IMAGE_GOUACHE = require('./assets/comparisons/tiles/after/Paintings/Gouache.jpg');
export const STYLE_CARD_IMAGE_EXPRESSIONIST = require('./assets/comparisons/tiles/after/Paintings/Expressionist.jpg');
export const STYLE_CARD_IMAGE_IMPRESSIONIST = require('./assets/comparisons/tiles/after/Paintings/Impressionist.jpg');
export const STYLE_CARD_IMAGE_BAROQUE = require('./assets/comparisons/tiles/after/Paintings/Baroque.jpg');
export const STYLE_CARD_IMAGE_VAN_GOGH = require('./assets/comparisons/tiles/after/Paintings/van-gogh.jpg');
export const STYLE_CARD_IMAGE_EXPRESSIVE_IMPASTO = require('./assets/comparisons/tiles/after/Paintings/Expressive- Impasto.jpg');
export const STYLE_CARD_IMAGE_EXPRESSIVE_IMPASTO_V2 = require('./assets/comparisons/tiles/after/Paintings/Expressive- Impasto2.jpg');
export const STYLE_CARD_IMAGE_MONET = require('./assets/comparisons/tiles/after/Paintings/monet.jpg');
export const STYLE_CARD_IMAGE_RENOIR = require('./assets/comparisons/tiles/after/Paintings/Renoir.jpg');
export const STYLE_CARD_IMAGE_CEZANNE = require('./assets/comparisons/tiles/after/Paintings/Cézanne.jpg');
export const STYLE_CARD_IMAGE_GAUGUIN = require('./assets/comparisons/tiles/after/Paintings/Gauguin.jpg');
export const STYLE_CARD_IMAGE_MATISSE = require('./assets/comparisons/tiles/after/Paintings/Matisse.jpg');
export const STYLE_CARD_IMAGE_SEURAT = require('./assets/comparisons/tiles/after/Paintings/Seurat.jpg');
export const STYLE_CARD_IMAGE_INK_WASH = require('./assets/comparisons/tiles/after/Paintings/Ink-Wash.jpg');
export const STYLE_CARD_IMAGE_IMPASTO = require('./assets/comparisons/tiles/after/Paintings/Impasto.jpg');
export const STYLE_CARD_IMAGE_HOKUSAI_V1 = require('./assets/comparisons/tiles/after/Paintings/Hokusai.jpg');
export const STYLE_CARD_IMAGE_HOKUSAI_V2 = require('./assets/comparisons/tiles/after/Paintings/Hokusai2.jpg');
export const STYLE_CARD_IMAGE_HIROSHIGE = require('./assets/comparisons/tiles/after/Paintings/Hiroshige.jpg');
export const STYLE_CARD_IMAGE_SESSHU = require('./assets/comparisons/tiles/after/Paintings/Sesshū.jpg');
export const STYLE_CARD_IMAGE_WC_MARKER = require('./assets/comparisons/tiles/after/Paintings/wc-marker.jpg');
export const STYLE_CARD_IMAGE_PXL = require('./assets/pxl.jpg');
export const STYLE_CARD_IMAGE_FUNKO = require('./assets/funko.jpg');
export const STYLE_CARD_IMAGE_3D_PORTRAIT_V1 = require('./assets/comparisons/tiles/after/3d/3d-portraitv1.jpg');
export const STYLE_CARD_IMAGE_3D_PORTRAIT_V2 = require('./assets/comparisons/tiles/after/3d/3d-portraitv2.jpg');
export const STYLE_CARD_IMAGE_MINIME = require('./assets/comparisons/tiles/after/3d/minime.jpg');
export const STYLE_CARD_IMAGE_DANCING_3D = require('./assets/comparisons/tiles/after/3d/dancing-3d.jpg');
export const STYLE_CARD_IMAGE_DANCING_CARC = require('./assets/comparisons/tiles/after/caricature/dancing-carc.jpg');
export const STYLE_CARD_IMAGE_MINIATURE = require('./assets/comparisons/tiles/after/3d/miniature.jpg');
export const STYLE_CARD_IMAGE_PLASTIC_TOY_V1 = require('./assets/comparisons/tiles/after/3d/toyv1.jpg');
export const STYLE_CARD_IMAGE_PLASTIC_TOY_V2 = require('./assets/comparisons/tiles/after/3d/toyv2.jpg');
export const STYLE_CARD_IMAGE_FIGURINE_V2 = require('./assets/comparisons/tiles/after/3d/figurinev2.jpg');
export const STYLE_CARD_IMAGE_FIGURINE_V3 = require('./assets/comparisons/tiles/after/3d/figurinev3.jpg');
export const STYLE_CARD_IMAGE_FIGURINE_V4 = require('./assets/comparisons/tiles/after/3d/figurinev4.jpg');

export const PAYWALL_MARQUEE_IMAGES = [
  STYLE_CARD_IMAGE_ANIME,
  STYLE_CARD_IMAGE_CHIBI,
  STYLE_CARD_IMAGE_PXL,
  STYLE_CARD_IMAGE_3DCLAY,
  STYLE_CARD_IMAGE_NEON,
  STYLE_CARD_IMAGE_OILPAINT,
  STYLE_CARD_IMAGE_LOWPOLY,
  STYLE_CARD_IMAGE_FUNKO,
  STYLE_CARD_IMAGE_WC,
];

/** Primary thumbnail lookup by style id (enabled + common aliases). */
const STYLE_IMAGE_BY_ID = {
  '90s-cartoon': STYLE_CARD_IMAGE_DEFAULT,
  chibi: STYLE_CARD_IMAGE_CHIBI,
  'classic-v1': STYLE_CARD_IMAGE_CLASSIC_V1,
  'classic-v2': STYLE_CARD_IMAGE_CLASSIC_V2,
  'saturday-v1': STYLE_CARD_IMAGE_SATURDAY_V1,
  'saturday-v2': STYLE_CARD_IMAGE_SATURDAY_V2,
  comic: STYLE_CARD_IMAGE_COMIC,
  cute: STYLE_CARD_IMAGE_CUTE,
  dc: STYLE_CARD_IMAGE_DC,
  'cyberpunk-v1': STYLE_CARD_IMAGE_CYBERPUNK_V1,
  'cyberpunk-v2': STYLE_CARD_IMAGE_CYBERPUNK_V2,
  disney: STYLE_CARD_IMAGE_DISNEY,
  pixel: STYLE_CARD_IMAGE_PIXEL,
  '3d-render-v1': STYLE_CARD_IMAGE_3D_RENDER_V1,
  '3d-render-v2': STYLE_CARD_IMAGE_3D_RENDER_V2,
  'comic-v1': STYLE_CARD_IMAGE_COMIC_V1,
  'comic-v2': STYLE_CARD_IMAGE_COMIC_V2,
  neon: STYLE_CARD_IMAGE_NEON,
  anime: STYLE_CARD_IMAGE_ANIME,
  handd: STYLE_CARD_IMAGE_HANDD,
  editorial: STYLE_CARD_IMAGE_EDITORIAL,
  exaggerated: STYLE_CARD_IMAGE_EXAGGERATED,
  watercolor: STYLE_CARD_IMAGE_WATERCOLOR_C,
  carc1: STYLE_CARD_IMAGE_CARC1,
  '3d-bd': STYLE_CARD_IMAGE_3D_BD,
  '3d': STYLE_CARD_IMAGE_3D,
  '3dclay': STYLE_CARD_IMAGE_3DCLAY,
  'oil-paint': STYLE_CARD_IMAGE_OILPAINT,
  lowpoly: STYLE_CARD_IMAGE_LOWPOLY,
  'low-poly': STYLE_CARD_IMAGE_LOWPOLY,
  mural: STYLE_CARD_IMAGE_MURAL,
  graffiti: STYLE_CARD_IMAGE_GRAFFITI,
  banksy: STYLE_CARD_IMAGE_BANKSY,
  mosaic: STYLE_CARD_IMAGE_MOSAIC,
  'hexagonal-mosaic': STYLE_CARD_IMAGE_HEXAGONAL_MOSAIC,
  'e-glow': STYLE_CARD_IMAGE_EGLOW,
  'abstract-v1': STYLE_CARD_IMAGE_ABSTRACT_V1,
  'abstract-v2': STYLE_CARD_IMAGE_ABSTRACT_V2,
  geometric: STYLE_CARD_IMAGE_GEOMETRIC,
  surreal: STYLE_CARD_IMAGE_SURREAL,
  'coloured-glass': STYLE_CARD_IMAGE_COLOURED_GLASS,
  'paste-up': STYLE_CARD_IMAGE_PASTE_UP,
  'monday-mood': STYLE_CARD_IMAGE_MONDAY,
  'friday-feeling': STYLE_CARD_IMAGE_FRIDAY,
  'pop-art-v1': STYLE_CARD_IMAGE_POP_ART_V1,
  'pop-art-v2': STYLE_CARD_IMAGE_POP_ART_V2,
  'pop-art-v3': STYLE_CARD_IMAGE_POP_ART_V3,
  acrylic: STYLE_CARD_IMAGE_ACRYLIC,
  gouache: STYLE_CARD_IMAGE_GOUACHE,
  expressionist: STYLE_CARD_IMAGE_EXPRESSIONIST,
  impressionist: STYLE_CARD_IMAGE_IMPRESSIONIST,
  baroque: STYLE_CARD_IMAGE_BAROQUE,
  'van-gogh': STYLE_CARD_IMAGE_VAN_GOGH,
  'expressive-impasto': STYLE_CARD_IMAGE_EXPRESSIVE_IMPASTO,
  'expressive-impasto-v2': STYLE_CARD_IMAGE_EXPRESSIVE_IMPASTO_V2,
  monet: STYLE_CARD_IMAGE_MONET,
  renoir: STYLE_CARD_IMAGE_RENOIR,
  cezanne: STYLE_CARD_IMAGE_CEZANNE,
  gauguin: STYLE_CARD_IMAGE_GAUGUIN,
  matisse: STYLE_CARD_IMAGE_MATISSE,
  seurat: STYLE_CARD_IMAGE_SEURAT,
  'ink-wash': STYLE_CARD_IMAGE_INK_WASH,
  impasto: STYLE_CARD_IMAGE_IMPASTO,
  'hokusai-v1': STYLE_CARD_IMAGE_HOKUSAI_V1,
  'hokusai-v2': STYLE_CARD_IMAGE_HOKUSAI_V2,
  hiroshige: STYLE_CARD_IMAGE_HIROSHIGE,
  sesshu: STYLE_CARD_IMAGE_SESSHU,
  'wc-marker': STYLE_CARD_IMAGE_WC_MARKER,
  'water-color': STYLE_CARD_IMAGE_WC,
  'pixar-like': STYLE_CARD_IMAGE_PXL,
  'funko-pop': STYLE_CARD_IMAGE_FUNKO,
  '3d-portrait-v1': STYLE_CARD_IMAGE_3D_PORTRAIT_V1,
  '3d-portrait-v2': STYLE_CARD_IMAGE_3D_PORTRAIT_V2,
  minime: STYLE_CARD_IMAGE_MINIME,
  'dancing-3d': STYLE_CARD_IMAGE_DANCING_3D,
  'dancing-carc': STYLE_CARD_IMAGE_DANCING_CARC,
  miniature: STYLE_CARD_IMAGE_MINIATURE,
  'plastic-toy-v1': STYLE_CARD_IMAGE_PLASTIC_TOY_V1,
  'plastic-toy-v2': STYLE_CARD_IMAGE_PLASTIC_TOY_V2,
  'figurine-v2': STYLE_CARD_IMAGE_FIGURINE_V2,
  'figurine-v2b': STYLE_CARD_IMAGE_FIGURINE_V2,
  'figurine-v3': STYLE_CARD_IMAGE_FIGURINE_V3,
  'figurine-v4': STYLE_CARD_IMAGE_FIGURINE_V4,
};

export function getStyleImage(style) {
  if (!style) return STYLE_CARD_IMAGE_DEFAULT;
  const id = (style.id || '').toLowerCase();
  const label = (style.label || '').toLowerCase();

  if (STYLE_IMAGE_BY_ID[id]) return STYLE_IMAGE_BY_ID[id];

  // Label fallbacks for catalog placeholders and renamed ids
  if (label.includes('90s')) return STYLE_CARD_IMAGE_DEFAULT;
  if (label.includes('hand-drawn') || label.includes('handd')) return STYLE_CARD_IMAGE_HANDD;
  if (label.includes('3d clay') || label.includes('3dclay')) return STYLE_CARD_IMAGE_3DCLAY;
  if (label.includes('oil paint') || label.includes('oilpaint')) return STYLE_CARD_IMAGE_OILPAINT;
  if (label.includes('low-poly') || label.includes('lowpoly')) return STYLE_CARD_IMAGE_LOWPOLY;
  if (label.includes('e-glow') || label.includes('eglow') || label.includes('electric glow')) return STYLE_CARD_IMAGE_EGLOW;
  if (label.includes('colored glass') || label.includes('coloured glass')) return STYLE_CARD_IMAGE_COLOURED_GLASS;
  if (label.includes('ink wash') || label.includes('ink-wash')) return STYLE_CARD_IMAGE_INK_WASH;
  if (label.includes('van gogh') || label.includes('vangogh')) return STYLE_CARD_IMAGE_VAN_GOGH;
  if (label.includes('expressive impasto v2')) return STYLE_CARD_IMAGE_EXPRESSIVE_IMPASTO_V2;
  if (label.includes('expressive impasto')) return STYLE_CARD_IMAGE_EXPRESSIVE_IMPASTO;
  if (label.includes('cézanne')) return STYLE_CARD_IMAGE_CEZANNE;
  if (label.includes('sesshū')) return STYLE_CARD_IMAGE_SESSHU;
  if (label.includes('pixar')) return STYLE_CARD_IMAGE_PXL;
  if (label.includes('funko')) return STYLE_CARD_IMAGE_FUNKO;

  const categoryId = (style.categoryId || '').toLowerCase();
  if (categoryId === 'caricatures') return STYLE_CARD_IMAGE_EDITORIAL;

  return STYLE_CARD_IMAGE_DEFAULT;
}

export const STYLE_90S_CARTOON = {
  id: '90s-cartoon',
  label: '90s',
  description: 'Classic 90s animated cartoon style'
};
