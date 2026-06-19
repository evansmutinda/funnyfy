# FunnyFy App - Changelog

All notable changes to this project will be documented in this file.

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
