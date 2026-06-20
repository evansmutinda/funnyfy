# FunnyFy App - Changelog

All notable changes to this project will be documented in this file.

---

## [Unreleased] - 2026-06-20

### Added
- **Netflix-style discovery home** (`StyleScreen.js`): vertical scroll of category rows; each row is a horizontal-scroll FlatList of style tiles with a "See all" tile when the category has more than `ROW_PREVIEW_COUNT` (8) styles. Categories with zero enabled styles are hidden. The existing per-category grid is reused for the "See all" target and for hardware-back navigation.
- **`PressScale` component** (`components/PressScale.js`): shared press-feedback wrapper using `react-native-reanimated` springs. Scales children to `0.96` on press-in and back to `1.0` on press-out. Replaces `TouchableOpacity` in `StyleScreen` and `UploadScreen` for premium tactile feel.
- **Staggered fade-in entrance** for category rows on home (60ms per row) and for tiles within a per-category grid (35ms per tile) using `FadeInDown` from Reanimated.
- **`ComparisonFade` component** (`components/ComparisonFade.js`): infinite crossfade between two `Image` sources. Used as the UploadScreen background to preview what the selected style does.
- **`data/comparisonPairs.js`** + `getComparisonPair(style)`: placeholder pair source. Currently uses `assets/realistic.jpeg` as a shared "before" portrait plus each style's existing thumbnail as the "after". To be replaced with curated generated pairs (see `MD/CHANGELOG.md` TODO).
- **Photo guidelines v3** (`PhotoTipsSheet.js`): full-screen dark sheet with a 2×2 grid of **color-coded concept cards** (green tinted with ✓ badge for "Face forward" + "Even lighting"; red tinted with ✕ badge for "No sunglasses" + "No side angles"). Each card is icon-driven by default (Feather `user` / `sun` / `eye-off` / `refresh-cw`) so the grid is meaningful before real example photos are sourced — pass an `image` field on a `TIP_EXAMPLES` item to swap to a real photo. Numbered rules block explicitly warns about repeated NSFW violations leading to account suspension (protects users from accidentally triggering the 3-strike ban via `infringements` table). White `Got it` CTA pinned to bottom. Triggered from the floating "Photo tips" chip on UploadScreen.
- **PhotoTipsSheet implemented as in-tree overlay, not `<Modal>`**: rewritten as an `Animated.View` with `position: absolute` + `zIndex: 1000` + Reanimated `withTiming` slide-up. Android hardware back handled via `BackHandler.addEventListener('hardwareBackPress')`. Fixes a multi-bug failure mode on Android (Expo SDK 52 / RN 0.76.9) where `<Modal transparent statusBarTranslucent>` rendered as a translucent empty window with `onRequestClose` not firing. See `MD/UI_REDESIGN_2026_06.md` §7.
- **SubscriptionScreen v2 (full-bleed dark)** (`SubscriptionScreen.js`): rewritten to use the same dark surface (`#0B0F19`) as UploadScreen/PhotoTipsSheet so the entire creation funnel feels continuous. Marquee stays in the hero with a `LinearGradient` bottom scrim. Floating circular close button (top-right). Translucent dark usage card with color-coded status pill (green ACTIVE / amber TRIAL / red CANCELING) and white progress fill. Tier cards now have three visual states: **default** (translucent dark + hollow radio), **selected** (solid white card with dark text + filled dot — mirrors the "Generate" CTA pattern), **current** (green-tinted with green border + green check radio). Bottom action bar is pinned (not scrolling) with white pill "Continue with …" CTA, translucent dark Refresh/Restore ghost buttons, and a subtle "Manage in Google Play" link. All interactive elements use `PressScale`; cards stagger in via `FadeInDown`. New `pwd*` style group; legacy `paywall*` keys kept for rollback. See `MD/UI_REDESIGN_2026_06.md` §8.
- **`scripts/generate-comparison-set.js`** + `npm run generate-comparisons`: helper that runs each reference photo in `apps/mobile/assets/comparisons/before/` through every enabled style via `/api/enqueue` + `/api/job`, downloads results, and saves them to `apps/mobile/assets/comparisons/<styleId>/<beforeBaseName>-after.jpg`. Skips files that already exist (cheap to resume). Configured via `API_BASE`, `AUTH_TOKEN`, `STYLE_FILTER`, `CONCURRENCY` env vars.

- **`useImagePicker` hook** (`hooks/useImagePicker.js`): shared pick/camera + crop invocation. In **dev/APK builds** uses `react-native-image-crop-picker` (dark cropper chrome `#0B0F19`, free-form crop, JPEG + base64). In **Expo Go** falls back to `expo-image-picker` (no native crop module). Returns `{ uri, dataUrl } | null`. Lifted to `App.js`; UploadScreen and PhotoReviewScreen call `onPickPhoto(useCamera)`.
- **`PhotoReviewScreen`** (`screens/PhotoReviewScreen.js`): post-pick confirm on solid `#0B0F19` — header band, flex-1 preview (`contain`), Remove / Choose another / **Generate**. New `review*` style group; reuses `upload*` for chips and buttons.
- **`utils/jobProgress.js`**: four-phase result loading copy — submit → queue → **content moderation** ("Checking content guidelines…") → generate; title **Creating your {style}**; 4 step dots; moderation phase timed from job `startedAt` (~6s).
- **`utils/contentErrors.js`**: maps `CONTENT_NOT_ALLOWED` / NSFW API errors to human copy; infringement dialog constants (`NSFW_REJECT_DIALOG`, `humanizeApiError()`).
- **Native splash via `expo-splash-screen`**: custom entry `apps/mobile/index.js` + `polyfills.js`; solid `#0B0F19` native splash (no image) held until fonts + auth finish; in-app `SplashScreen.js` removed.
- **`To do/SPLASH_ASSET.md`**: deferred checklist for when a branded splash PNG is ready.

### Changed
- **Result screen loading** (`ResultScreen.js` + `jobProgress.js`): **Creating your {style}** title; moderation step in progress UI; NSFW failure shows infringement dialog then returns to upload.
- **NSFW / content-policy UX** (`contentErrors.js`, `ConfirmDialog.js`, `App.js`): polite but firm **Content not permitted** dialog; single full-width **Understood** CTA (`hideCancel`); no raw `CONTENT_NOT_ALLOWED` in UI.
- **PhotoReviewScreen**: Generate button is **Generate** only (style name stays in header chip).
- **RevenueCat Expo Go**: `polyfills.js` stubs `window.location` before `purchases-js` loads — fixes `sdk_initialized` / `URL.search` console error in browser mode.
- **Upload flow is two screens** (`UploadScreen` → `PhotoReviewScreen`). UploadScreen is pre-pick browse (`ComparisonFade` + Gallery/Camera cards). Pick returns straight to `review` with `{ uri, dataUrl }` — no in-app `CropScreen`. Navigation: back from Result → `review` if photo in memory else `upload`; Remove on review → `upload`; NSFW reject → `upload` (clears `pickedImage`).
- **App-wide dark theme** (`#0B0F19`): StyleScreen, Gallery, Info, Result, MenuModal, Splash, App shell; shared `DARK_*` tokens in `styles.js`. Style picker header + burger use dark chip buttons (white icons/text).
- **MenuModal** (`components/MenuModal.js`): solid dark bottom sheet (`#0B0F19`), native `slide` animation, dim backdrop + flex dismiss area (sheet taps don't close), hardware back to dismiss. Items: Gallery, Subscription, Privacy, Terms, About.
- **Result screen** (`ResultScreen.js`): three-band layout, real job-status loading copy, local preview cache, pinned save/share actions, before/after compare slider.
- **Subscription screen**: canceling state (red pill, footnote, manage link); manage opens Play/App Store directly.
- **Styles cleanup**: removed ~440 unused keys from `styles.js` (legacy `paywall*`, `crop*`, `photoPlaceholder*`, old light-theme leftovers). Utility: `apps/mobile/scripts/prune-unused-styles.js`.
- **Cron moved off Vercel**: Queue worker (`/api/cron/process-queue`) is now scheduled by [cron-job.org](https://cron-job.org/) instead of Vercel cron. The `crons` block was removed from `vercel.json`. cron-job.org sends `Authorization: Bearer <CRON_SECRET>` on every tick; the mobile-app + `/api/enqueue` fire-and-forget kick still works via the user JWT path (no secret embedded in the app).

### Removed
- **`CropScreen`** and custom in-app crop (`PanResponder` + `expo-image-manipulator` flow) — replaced by native crop in `useImagePicker` (dev/APK builds).
- **`PhotoChooserScreen.js`** — unused; gallery pick uses OS picker from Upload/Review.
- **`processPickedImage.js`**, **`apps/mobile/api/test.ts`** — dead code.
- **`SplashScreen.js`** (in-app JS splash with 2s timer) — replaced by native splash + `expo-splash-screen`.
- `ToDo/` folder (architectural plans from 2025 — superseded by `MD/STATUS.md`, `MD/DEVELOPMENT_PLAN.md`, and `MD/CHANGELOG.md`). Splash deferral notes live in **`To do/SPLASH_ASSET.md`**.

### Deprecated (superseded — kept in git history only)
- Earlier **[Unreleased]** notes describing a three-screen Upload → **CropScreen** → Review flow and `CropScreen.js` — that approach was tried and removed in favour of native OS crop via `react-native-image-crop-picker`.

### TODO
- Run `npm run generate-comparisons` (requires `API_BASE` + `AUTH_TOKEN` env vars + 4-8 reference faces in `apps/mobile/assets/comparisons/before/`). Then register pairs in `COMPARISON_OVERRIDES` in `data/comparisonPairs.js`.
- (Optional) Replace Photo Tips concept cards with real example photos: 2 "good" (front-facing portrait + clear-lit smile) and 2 "bad" (sunglasses/occlusion + side profile). Drop into `apps/mobile/assets/tips/` and set `image:` on each `TIP_EXAMPLES` item in `components/PhotoTipsSheet.js` (icons render until `image` is provided).
- Set Android navigation bar color at runtime in Expo Go if needed (`expo-navigation-bar` installed; `app.config.js` already uses `#0B0F19` for native builds).
- Branded splash PNG — see `To do/SPLASH_ASSET.md` (native `#0B0F19` splash works today).
- Design Section 3 (Wait / Perceived Performance) — optional further narrative polish beyond moderation + generate steps (see `MD/UI_REDESIGN_2026_06.md` §9).

---

## [1.0.4] - 2026-06-18

### Added
- **Offline UX**: `@react-native-community/netinfo`, top banner when disconnected, Upload generate guard, auto-refresh on reconnect
- **Style catalog**: 160 styles across 16 categories from `Funnyfy_Categories_Updated.xlsx` (142 placeholders disabled; 18 legacy styles enabled)
- **Catalog generator**: `scripts/generate-style-catalog.py` → `apps/mobile/data/styleCatalog.js` + `api/_utils/style-catalog.ts`
- **Two-level style picker**: Home shows category tiles only; tap a category → 2-column style grid
- **Category tile layout**: Alternating full-width + two half-width cards (`index % 3 === 0` → wide)
- **Auto versioning**: `apps/mobile/version.json`, `scripts/bump-version.js`, auto-bump in `build-apk-local.ps1` / `build-apk.ps1`
- **Paywall marquee**: `PaywallStyleMarquee.js` — scrolling style preview strip on subscription hero
- **Runtime app version**: About screen reads version from `expo-constants` (falls back to `version.json`)
- **Plus Jakarta Sans on style cards**: `@expo-google-fonts/plus-jakarta-sans` + `expo-font`; `constants/fonts.js`

### Changed
- **Offline at launch**: Replaced blocking “no internet” dialog with top banner + `DEFAULT_ENABLED_STYLES` fallback
- **Style screen**: White background, **FunnyFy** wordmark + bordered menu button; back uses standard icon button
- **Style tiles in categories**: 2-column discovery layout (was 3-column dense); taller aspect ratio (`0.72`)
- **90s Cartoon** tile label shortened to **90s**; thumbnail uses `assets/toon.jpg`
- **Subscription screen**: Split layout — ink hero + style marquee on top; white scrollable sheet (usage, plans, actions)
- **Cartoons category**: Live styles **90s** + **Chibi** + **Anime** with `toon.jpg` / `chibi.jpg` / `anime.jpg` thumbnails
- **Style card shell**: White (`#FFFFFF`), 24px radius, soft shadow; full-bleed `cover` image
- **Style card labels**: Plus Jakarta Sans Regular, left-aligned, on bottom gradient; **dark rounded backdrop pill** behind text for readability on bright/busy images
- **Discovery labels**: No longer inherit bold `styleImageLabel` — regular weight only on picker tiles

### Fixed
- Missing asset bundle errors when style thumbnail `require()` paths don't exist (use existing assets in `apps/mobile/assets/`)

---

## [1.0.3] - 2026-06-15

### Fixed
- **Subscriptions**: RevenueCat `Purchases.logIn` links purchases to backend user; post-purchase sync + refresh; auth gating before purchase
- **Auth startup race**: Splash waits for auth; `ensureAuthenticated()` / `forceReAuth()`; removed conflicting `auth.ts` (use `auth.js` only)
- **Gallery save prompt**: Android "Allow gallery to modify this photo?" removed — save directly into Funnyfy album (no move-after-create)
- **Staging URL**: Correct URL is `https://funnyfy-staging.vercel.app` (not `funnyfyapp-staging`)
- **Usage counter skips**: Idempotent per-job credits (`job_usage_credits` table); atomic queue job claim (`FOR UPDATE SKIP LOCKED`); fixed subscription API query order; stale refresh guard in app

### Added
- **Local APK build**: `build-apk-local.ps1` and Gradle `assembleDebug` / `assembleRelease` (no EAS quota)
- **react-native-url-polyfill**: Fixes RevenueCat `sdk_initialized` tracking error in Metro logs
- **Auth retries**: 3 attempts before local fallback in `initAuth()`
- **Shared `MediaTile` component**: ShotCam-style tiles (gradient label on image) for style picker, gallery, upload chip
- **Style screen**: Category chips (All/Cartoon/Art/Fun), hero "Popular" tile, restyle mode with cancel/back
- **Upload screen**: Selected-style chip with "Change style"
- **Result screen**: Auto before/after slider demo; "Try another style" (same photo); save toast with "View in Gallery"
- **Trial warnings**: Soft banner/toast when 1 caricature left on trial
- **Backend**: `api/_utils/usage.ts`, migration `004-job-usage-credits.sql`

### Changed
- Android gallery pick uses system photo picker (Android 13+, no library permission for pick)
- RevenueCat log level reduced to WARN (less terminal noise)
- **App theme**: Black & white UI (orange accent removed); green/red reserved for success/error states
- Result slider auto-demo timing slowed for readability
- Gallery grid matches style picker tile design (gray page background `#F3F4F6`)

---

## [1.0.2] - 2026-05-21

### Added
- **NSFW modal dialog**: Inappropriate images now show a clean white modal dialog ("Image not supported") instead of an error card. "Try again" button returns to upload screen.
- **Network error notification**: White modal dialog appears on app launch if no internet connection detected
- **Pulsing squares loader**: 4 black squares pulse in sequence (black→grey wave) during caricature generation
- **react-native-reanimated**: Installed for smooth skeleton/pulse animations

### Changed
- **Menu icons**: Upgraded to Feather thin-stroke outline icons (image, star, shield, file-text, info)
- **Dialog styling**: All modals now match reference design - larger bold title (20px), lighter grey message (15px), bigger rounded buttons
- **Style picker text**: Labels centered under cards with semibold weight (600) and improved letter spacing
- **Toast error color**: Error toasts use warm amber (#F59E0B) instead of harsh red
- **Photo saving**: Silent save to camera roll (removed Android "Allow Expo Go to modify?" system prompt every time)
- **NSFW retry limit**: Removed 3-attempt limit - users can retry unlimited times

### Fixed
- Gallery not showing existing photos after app reinstall (now rebuilds from MediaLibrary)
- NSFW error showing both amber card AND toast (consolidated to single modal)

### Technical
- Android versionCode: 4 → 5
- iOS buildNumber: 1 → 2
- Updated babel.config.js with reanimated plugin

---

## [1.0.1] - 2026-03-08

### Added
- JWT authentication system with local UUID fallback
- NSFW content moderation via Sightengine
- Image upload validation (MIME type, size limit, magic byte verification)
- Toast notification system (replaced all Alert.alert)
- ConfirmDialog component with 3-button support
- Gallery screen with full-screen image viewer
- Full Privacy Policy (13 sections)
- Full Terms of Service (13 sections)
- Restore Purchases button (Play Store requirement)
- Subscription refresh button
- Plan badge as progress bar (combined badge + quota)

### Changed
- Retry logic: up to 3 attempts on generation failure
- Save before navigate: prompt when leaving result screen with unsaved image
- Processing indicator: pulsing "Processing…" text (replaced with squares in 1.0.2)

### Fixed
- Tier selection bug (handleSubscribe now correctly matches selected plan)
- Bottom insets overlap with navigation bar
- Subscription cancellation endpoint (production-ready)

---

## [1.0.0] - 2026-02-15

### Added
- Initial release
- React Native mobile app (Expo SDK 52)
- 21 caricature styles
- Image upload (camera & gallery)
- AI generation via Replicate API
- Before/after comparison slider
- Save and share functionality
- RevenueCat subscriptions (Starter $5, Popular $10, Pro $25)
- Usage tracking and quota enforcement
- Vercel serverless backend
- Supabase database integration
- Admin dashboard

---

**Version Format**: MAJOR.MINOR.PATCH
- MAJOR: Breaking changes / major redesign
- MINOR: New features (backward compatible)
- PATCH: Bug fixes and minor improvements
