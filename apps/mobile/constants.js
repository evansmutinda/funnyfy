import { Dimensions, Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import {
  resolveFunnyfyAlbum,
  FUNNYFY_ALBUM_ID_KEY,
  FUNNYFY_FOLDER_NAME,
} from './utils/funnyfyAlbum';

export { FUNNYFY_FOLDER_NAME } from './utils/funnyfyAlbum';

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://funnyfyapp.vercel.app';

export const SUPPORT_EMAIL = 'support@funnyfy.app';
export const APP_NAME = 'FunnyFy';
export const COMPANY_NAME = 'FunnyFy';

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

export async function saveToFunnyfyAlbum(localFileUri) {
  try {
    // Write-only — add photos without read/modify prompts on existing files.
    let writePerm = await MediaLibrary.getPermissionsAsync(true);
    if (writePerm.status !== 'granted') {
      writePerm = await MediaLibrary.requestPermissionsAsync(true);
    }
    if (writePerm.status !== 'granted') {
      console.warn('[Save] MediaLibrary write permission denied');
      return false;
    }

    let album = await resolveFunnyfyAlbum();
    if (album) {
      await MediaLibrary.createAssetAsync(localFileUri, album);
      return true;
    }

    try {
      album = await MediaLibrary.createAlbumAsync(
        FUNNYFY_FOLDER_NAME,
        localFileUri,
        false,
      );
      if (album?.id) {
        await AsyncStorage.setItem(FUNNYFY_ALBUM_ID_KEY, album.id);
      }
      return true;
    } catch (createErr) {
      console.warn('[Save] createAlbumAsync failed, rescanning albums:', createErr);
      album = await resolveFunnyfyAlbum({ rescan: true });
      if (album) {
        await MediaLibrary.createAssetAsync(localFileUri, album);
        return true;
      }
      console.error('[Save] Could not save to Funnyfy album');
      return false;
    }
  } catch (err) {
    console.error('[Save] saveToFunnyfyAlbum error:', err);
    return false;
  }
}

export function getSavedImageFileName() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `Funnyfy-${y}-${m}-${day}_${h}${min}${s}.jpg`;
}

export const STYLE_CARD_IMAGE_DEFAULT = require('./assets/toon.jpg');
export const STYLE_CARD_IMAGE_CHIBI = require('./assets/chibi.jpg');
export const STYLE_CARD_IMAGE_NEON = require('./assets/neon.png');
export const STYLE_CARD_IMAGE_ANIME = require('./assets/anime.jpg');
export const STYLE_CARD_IMAGE_CUSTOM1 = require('./assets/custom1.jpg');
export const STYLE_CARD_IMAGE_CUSTOM2 = require('./assets/custom2.jpg');
export const STYLE_CARD_IMAGE_NEANDC = require('./assets/neandc.jpeg');
export const STYLE_CARD_IMAGE_NEAND3D = require('./assets/neand3d.jpeg');
export const STYLE_CARD_IMAGE_HANDD = require('./assets/handd.jpeg');
export const STYLE_CARD_IMAGE_SUPERHERO = require('./assets/superhero.jpeg');
export const STYLE_CARD_IMAGE_VILLIAN = require('./assets/villian.jpeg');
export const STYLE_CARD_IMAGE_CYBORG = require('./assets/cyborg.jpeg');
export const STYLE_CARD_IMAGE_3DCLAY = require('./assets/3dclay.jpg');
export const STYLE_CARD_IMAGE_OILPAINT = require('./assets/oilpaint.jpg');
export const STYLE_CARD_IMAGE_LOWPOLY = require('./assets/lowpoly.jpg');
export const STYLE_CARD_IMAGE_WC = require('./assets/wc.jpg');
export const STYLE_CARD_IMAGE_PXL = require('./assets/pxl.jpg');
export const STYLE_CARD_IMAGE_FUNKO = require('./assets/funko.jpg');

export const PAYWALL_MARQUEE_IMAGES = [
  STYLE_CARD_IMAGE_ANIME,
  STYLE_CARD_IMAGE_CHIBI,
  STYLE_CARD_IMAGE_PXL,
  STYLE_CARD_IMAGE_3DCLAY,
  STYLE_CARD_IMAGE_NEON,
  STYLE_CARD_IMAGE_OILPAINT,
  STYLE_CARD_IMAGE_LOWPOLY,
  STYLE_CARD_IMAGE_FUNKO,
  STYLE_CARD_IMAGE_SUPERHERO,
  STYLE_CARD_IMAGE_WC,
];

export function getStyleImage(style) {
  if (!style) return STYLE_CARD_IMAGE_DEFAULT;
  const label = (style.label || '').toLowerCase();
  const id = (style.id || '').toLowerCase();

  if (id === '90s-cartoon' || label.includes('90s')) return STYLE_CARD_IMAGE_DEFAULT;
  if (id === 'chibi' || label.includes('chibi')) return STYLE_CARD_IMAGE_CHIBI;
  if (id === 'neon' || label.includes('neon')) return STYLE_CARD_IMAGE_NEON;
  if (id === 'anime' || label.includes('anime')) return STYLE_CARD_IMAGE_ANIME;
  if (id === 'custom1' || label.includes('custom1')) return STYLE_CARD_IMAGE_CUSTOM1;
  if (id === 'custom2' || label.includes('custom2')) return STYLE_CARD_IMAGE_CUSTOM2;
  if (id === 'neandc' || (label.includes('neanderthal') && !label.includes('3d'))) return STYLE_CARD_IMAGE_NEANDC;
  if (id === 'neand3d' || label.includes('neanderthal 3d') || label.includes('neand3d')) return STYLE_CARD_IMAGE_NEAND3D;
  if (id === 'handd' || label.includes('hand-drawn') || label.includes('handd')) return STYLE_CARD_IMAGE_HANDD;
  if (id === 'superhero' || label.includes('superhero')) return STYLE_CARD_IMAGE_SUPERHERO;
  if (id === 'villian' || label.includes('villain') || label.includes('villian')) return STYLE_CARD_IMAGE_VILLIAN;
  if (id === 'cyborg' || label.includes('cyborg')) return STYLE_CARD_IMAGE_CYBORG;
  if (id === '3dclay' || label.includes('3dclay') || label.includes('3d clay')) return STYLE_CARD_IMAGE_3DCLAY;
  if (id === 'oil-paint' || label.includes('oil paint') || label.includes('oilpaint')) return STYLE_CARD_IMAGE_OILPAINT;
  if (id === 'low-poly' || label.includes('low-poly') || label.includes('lowpoly')) return STYLE_CARD_IMAGE_LOWPOLY;
  if (id === 'water-color' || label.includes('water color') || label.includes('watercolor')) return STYLE_CARD_IMAGE_WC;
  if (id === 'pixar-like' || label.includes('pixar-like') || label.includes('pixar')) return STYLE_CARD_IMAGE_PXL;
  if (id === 'funko-pop' || label.includes('funko pop') || label.includes('funko')) return STYLE_CARD_IMAGE_FUNKO;

  return STYLE_CARD_IMAGE_DEFAULT;
}

export const STYLE_90S_CARTOON = {
  id: '90s-cartoon',
  label: '90s',
  description: 'Classic 90s animated cartoon style'
};
