# FunnyFy App - Changelog

All notable changes to this project will be documented in this file.

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
