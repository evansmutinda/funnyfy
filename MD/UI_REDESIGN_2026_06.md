# FunnyFy Mobile — UI Redesign (June 2026)

**Date:** 2026-06-20 (updated June 2026)  
**Scope:** Style discovery, upload/review flow, photo tips, paywall, app-wide dark theme, menus  
**Goal:** Premium, content-first mobile UX with full-bleed creation flow and Netflix-style discovery for the ~150-style catalog.

This file is the canonical reference for the redesign — what changed, why, where the code lives, and what's still pending.

---

## 1. Sections delivered

| # | Screen | Status | Notes |
|---|--------|--------|-------|
| 1 | Style Selection (`StyleScreen.js`) | **Done** | Netflix-style row layout + "See all" grid fallback + staggered entrance; **dark** header (`#0B0F19`), wordmark + icon-only burger (no chip background) |
| 2 | Upload + Review (`UploadScreen.js`, `PhotoReviewScreen.js`, `PhotoTipsSheet.js`) | **Done** | **Two-screen flow**: UploadScreen (comparison fade + Gallery/Camera cards) → OS pick + crop via **`expo-image-picker`** (`allowsEditing: true`, all builds) → PhotoReviewScreen (confirm, Generate). Shared **`UploadFlowHeader`**: `[ ← back ] [ style pill ] ···· [ usage pill ]` on both screens — **no** floating Photo tips chip. Photo tips **auto-open** on Upload when a style is selected (per-style "Do not show again"). |
| 3 | Wait / Perceived performance (`ResultScreen.js` loading state) | **Done** | 4-phase copy via `jobProgress.js`: submit → queue → **moderation** → generate; title **Creating your {style}**; NSFW fail → infringement dialog |
| 4 | Result & Restyle (`ResultScreen.js` success state) | **Done** | Before/after slider, pinned save/share, try-another-style, local preview cache |
| 5 | Subscription / Paywall (`SubscriptionScreen.js`) | **Done** | Full-bleed dark, compact marquee, slim tier cards, pinned CTA, canceling UI. `pwd*` style group (legacy `paywall*` pruned from `styles.js`) |
| — | App menu (`MenuModal.js`) | **Done** | Dark bottom sheet from style screen burger; Gallery / Subscription / Privacy / Terms / About |

---

## 2. New shared building blocks

### Components (`apps/mobile/components/`)

| File | Purpose | Used by |
|------|---------|---------|
| `PressScale.js` | Currently a thin `TouchableOpacity` wrapper (kept Reanimated-free after an Android freezing incident — see §3). Same API as the original spring-scale version so future re-introduction of the animation is mechanical. | StyleScreen tiles & rows, UploadScreen & PhotoReviewScreen chips/buttons, PhotoTipsSheet chevron + Got it, SubscriptionScreen close + tier cards + actions |
| `ComparisonFade.js` | Infinite crossfade between a `beforeSource` and `afterSource` Image. Used as the UploadScreen background so the user can preview what the selected style does to a face _before_ they pick their own photo. The follow-up PhotoReviewScreen does **not** use it (the user's own photo gets full attention there). | UploadScreen |
| `UploadFlowHeader.js` | Shared upload/review header: back button + **style pill** (left, truncates) + flex spacer + **usage pill** (right, always visible). | UploadScreen, PhotoReviewScreen |
| `PhotoTipsSheet.js` | **In-tree absolute overlay** (not a `<Modal>`) with a slide-up animation. Pictorial placeholder grid + numbered rules + **Do not show this again** checkbox. | UploadScreen only — **auto-shown** on style entry (not a header chip) |
| `OfflineBanner.js` | Global offline overlay (orange alert card) rendered from `NetworkProvider`; does not shift page layout. | All screens when offline |
| `MenuModal.js` | Dark bottom sheet menu (`#0B0F19`) from StyleScreen burger. Native `slide` animation; dim backdrop; hardware back closes. | `App.js` when `screen === 'style'` |

### Hooks (`apps/mobile/hooks/`)

| File | Exports | Notes |
|------|---------|-------|
| `useImagePicker.js` | `useImagePicker()` → `{ pickImage(useCamera), picking, pickingSource }` | **`expo-image-picker`** with `allowsEditing: true` (OS crop) in all builds. Returns `{ uri, dataUrl } \| null`. Consumed in `App.js`; UploadScreen / PhotoReviewScreen call `onPickPhoto(useCamera)` → `review` on success. |

### Data / helpers (`apps/mobile/data/`)

| File | Exports | Notes |
|------|---------|-------|
| `comparisonPairs.js` | `getComparisonPair(style)`, `COMPARISON_OVERRIDES` map | Placeholder: returns `assets/realistic.jpeg` as a shared "before" and the style's existing thumbnail as the "after". Real curated pairs will be registered in `COMPARISON_OVERRIDES` once generated. |
| `stylePhotoTips.js` | `getStylePhotoTips(styleId)`, `GENERIC_STYLE_PHOTO_TIPS` | Per-style photo tips for upload auto-sheet. Default = generic pictorial placeholders; set `STYLE_PHOTO_TIPS[id] = null` to skip tips for a style. |

### Scripts (`scripts/`)

| File | npm script | Purpose |
|------|------------|---------|
| `generate-comparison-set.js` | `npm run generate-comparisons` | Runs each reference photo in `apps/mobile/assets/comparisons/before/` through every enabled style via `/api/enqueue` + `/api/job` and writes results to `apps/mobile/assets/comparisons/<styleId>/<baseName>-after.jpg`. Skips existing files. Configured via `API_BASE`, `AUTH_TOKEN`, `STYLE_FILTER`, `CONCURRENCY` env vars. |

---

## 3. Animation conventions

All animations use `react-native-reanimated` (v3.16.1).

| Pattern | Implementation | Where |
|---------|----------------|-------|
| Press feedback | Plain `TouchableOpacity` (`activeOpacity={0.85}`) — Reanimated spring scale removed after Android hit-area / freeze issues | `PressScale` |
| Row entrance stagger | `FadeInDown.delay(rowIndex * ROW_ENTRANCE_STAGGER).duration(320)` where `ROW_ENTRANCE_STAGGER = 60ms` | `StyleScreen` home rows |
| Tile entrance stagger | `FadeInDown.delay(index * 35).duration(280)` | `StyleScreen` per-category grid |
| Comparison crossfade | Loop: 1500ms hold → 600ms fade → 1500ms hold → 600ms fade-back | `ComparisonFade` |
| Sheet slide-up | `withTiming(0, { duration: 280 })` in, `withTiming(SCREEN_HEIGHT, { duration: 220 })` out | `PhotoTipsSheet` |

---

## 4. Theme tokens used

Dark-first globals in `apps/mobile/styles.js`:

| Token | Value | Where used |
|-------|-------|------------|
| `DARK_BG` | `#0B0F19` | App shell, StyleScreen, Gallery, Info, Result, MenuModal sheet, upload/review/paywall surfaces |
| `DARK_SURFACE` / `DARK_CHIP` / `DARK_BORDER` / `DARK_MUTED` | rgba whites | Cards, chips, borders, secondary text on dark |
| `PAPER` | `#FFFFFF` | Primary text/icons on dark, CTAs (Generate, Continue, Save) |
| `INK` | `#0F172A` | Text on white selected tier card |
| Success / error | `#10B981` / `#EF4444` | Tips badges, canceling subscription, status only |

**Note:** The June 2026 redesign originally kept StyleScreen on a light `CANVAS` background; a later pass moved **the whole app** to `#0B0F19` for visual continuity. Legacy light-theme style keys were pruned from `styles.js` (see `scripts/prune-unused-styles.js`).

---

## 5. Section 1 — Style Selection (Netflix-style discovery)

**File:** `apps/mobile/screens/StyleScreen.js`

### Layout

- **Home view** (no category selected):
  - Vertical `ScrollView`
  - One **`CategoryRow`** per category that has at least one enabled style. Empty categories are hidden.
  - Each `CategoryRow` = section header (`Category name` + `See all →` if more than `ROW_PREVIEW_COUNT = 8` styles) + horizontal `FlatList` of style tiles.
  - Per-row stagger via `FadeInDown.delay(rowIndex * 60)`.
- **Per-category view** (tap "See all" or a category header):
  - 2-column grid of style tiles (reuses pre-existing `discoveryCard` layout from the 1.0.4 picker)
  - Per-tile stagger via `FadeInDown.delay(index * 35)`.
- **Category row spacing:** tight symmetric gaps (`styleHomeContainer` `gap: 4` between sections; `styleRowSection` `gap: 6` title→carousel). Do not re-inflate to large `marginBottom` stacks.
- **Tile → screen mapping:** tap any tile (home row or per-category grid) → navigates straight to `UploadScreen` for that style. No detail page in between.

### Why this layout

We're growing the catalog to ~150 styles across 16 categories. A flat 2-column grid would force the user to scroll past dozens of irrelevant styles to find what they want. Netflix-style row-per-category gives:
- Strong **category awareness** at a glance
- Familiar **horizontal browse** within a category
- Predictable "See all" escape hatch when a category exceeds 8 styles
- Reuses the existing `discoveryCard` styling so the per-category grid looks identical to the 1.0.4 picker

### Key style keys

```
styleHomeContainer, styleRowSection, styleRowHeader, styleRowHeaderTitle,
styleRowHeaderSeeAll, styleRowList, styleRowTile, styleRowTileImage,
styleRowTileLabelPill, styleRowSeeAllTile, styleRowSeeAllTileText
```

### Removed / orphaned

The old hero "Popular" tile + category chip strip from 1.0.4 are no longer rendered on the home view, but the styles still exist in `styles.js` (kept for rollback). Pruning is a TODO.

---

## 6. Section 2 — Upload → Review (two-screen flow)

**Files:** `apps/mobile/screens/UploadScreen.js`, `apps/mobile/screens/PhotoReviewScreen.js`  
**Shared hook:** `apps/mobile/hooks/useImagePicker.js` (lifted to `App.js`)

The creation flow is **two screens**:

1. **Upload** — browse the style and choose a photo source  
2. **Review** — confirm the cropped photo and start generation  

Crop happens in the **OS picker** via **`expo-image-picker`** (`allowsEditing: true`) in all builds — same crop UX as Expo Go. Do not re-add `react-native-image-crop-picker` (caused squished crops in debug APK).

### Why two screens (not one)

- **Upload** needs the comparison fade background; **Review** needs the user's photo full attention on solid dark — incompatible on one surface.
- Splitting gives meaningful back navigation: Review → Upload means "wrong photo"; Result → Review means "try again with same photo".

### Screen 1 — `UploadScreen` (pre-pick browse)

`ComparisonFade` background, **`UploadFlowHeader`** (back + style pill + usage pill), Gallery/Camera action cards. **No** Photo tips chip in the header — tips sheet auto-opens once per style unless dismissed.

**Outgoing:** `onPickPhoto(useCamera)` → `App.js` runs `useImagePicker` → on success sets `pickedImage` and navigates to `review`.

### Screen 2 — `PhotoReviewScreen` (post-pick confirm)

Solid `#0B0F19`, flex-column (`UploadFlowHeader` → flex-1 preview → actions). Photo uses `resizeMode: 'contain'`. Remove / Choose another / white pill **Generate** CTA (style name in header **style pill** only, not on button). Same header pill layout as Upload — **no** Photo tips chip.

**Outgoing:**
- **Generate** → `result`
- **Remove** → `upload` (clears `pickedImage`)
- **Choose another** → re-runs `onPickPhoto` → `review` on success

### Navigation rules in `App.js`

| Trigger | Destination | Notes |
|---------|-------------|-------|
| Style picked from StyleScreen | `upload` | Clears `pickedImage` (fresh flow) |
| `onPickPhoto(useCamera)` success | `review` | Sets `pickedImage = { uri, dataUrl }` |
| Remove on PhotoReviewScreen | `upload` | Clears `pickedImage` |
| Generate on PhotoReviewScreen | `result` | Keeps `pickedImage` for restyle/back |
| Back from ResultScreen | `review` if `pickedImage` else `upload` | |
| NSFW reject dialog confirm | `upload` | Clears `pickedImage`; **Content not permitted** / **Understood** (single-action `ConfirmDialog`) |

### Removed: in-app `CropScreen`

A custom `CropScreen` (PanResponder + `expo-image-manipulator`) was implemented briefly but **removed**. **`expo-image-picker`** OS crop is used in all builds. Do not re-add `CropScreen` or `react-native-image-crop-picker` unless explicitly requested.

### Upload / Review header (`UploadFlowHeader`)

Single row on both screens — **do not** revert to stacked chips or a center usage pill:

```
[ ← 40px ] [ style pill · truncates ] ········ [ usage pill ]
```

| Element | Position | Notes |
|---------|----------|-------|
| Back | Far left | `uploadCircleButton` (dark chip circle) |
| Style pill | Left, after back | `uploadHeaderStyleChip` — tap → change style / back to picker |
| Usage pill | **Far right** | `uploadHeaderPill` — always rendered (`Trial · x/y` while subscription loads); tap → Subscription |
| Photo tips | **Not in header** | Auto sheet on Upload only; no manual chip |

**Style keys:** `uploadHeaderRow`, `uploadHeaderStyleChip`, `uploadHeaderStyleChipText`, `uploadHeaderSpacer`, `uploadHeaderPill`, `uploadFloatingChipDot`, `uploadCircleButton`.

### Key style keys

**UploadScreen:** `uploadRoot`, `uploadBackgroundFill`, `uploadScrimTop/Bottom`, `uploadTopLayer`, `uploadBottomLayer`, `uploadActionCard*`, …

**PhotoReviewScreen:** `reviewRoot`, `reviewHeaderBand`, `reviewPreviewBand`, `reviewPreviewCard`, `reviewActionBand` + shared `upload*` header pills/buttons.

**Menu (StyleScreen):** `menuBackdrop`, `menuDismissArea`, `menuSheet`, `menuHandle`, `menuItem*`, `menuButton` (header burger — icon only, 40×40 hit area, no chip/circle).

---

## 7. Photo Tips Sheet (subcomponent of Section 2)

**File:** `apps/mobile/components/PhotoTipsSheet.js`

### Implementation note — NOT a React Native `<Modal>`

Initially shipped as `<Modal transparent animationType="slide" statusBarTranslucent>`. On Android (Expo SDK 52 / RN 0.76.9) this combination hit three known bugs simultaneously:

1. **Separate Android window:** Modal renders in a new native window so `SafeAreaProvider` context doesn't propagate cleanly.
2. **`statusBarTranslucent` quirk:** the new window can render with a translucent background even when `transparent={false}`.
3. **`onRequestClose` binding:** sometimes the back-button callback isn't wired until the modal's window finishes initializing, leaving the sheet uncloseable.

Symptom reported: *"translucent window with no content, can't close it."*

**Fix:** rewrote as an in-tree `Animated.View` with `position: absolute`, `zIndex: 1000`, `elevation: 1000`. Slide-up via Reanimated `withTiming`. Android back handled explicitly via `BackHandler.addEventListener('hardwareBackPress', ...)` inside a `useEffect` keyed to `visible`. Component renders `null` while not mounted (after exit animation completes).

This pattern (in-tree overlay, not `Modal`) is the recommended approach for any full-screen sheet on Expo SDK 52 going forward.

### Content

- **Top bar:** chevron-down close (left) + `Photo tips · {style label}` title (center)
- **Lead:** style-specific or generic copy from `data/stylePhotoTips.js`
- **2×2 grid:** pictorial **placeholders** ("Example coming soon") by default; swap in real photos via `image:` on each example item. Per-style overrides via `STYLE_PHOTO_TIPS` in `stylePhotoTips.js`; set a style to `null` to skip tips entirely.
- **Numbered rules block** (NSFW ban warning included)
- **Footer:** **Do not show this again** checkbox (persisted per style in AsyncStorage via `utils/photoTipsPrefs.js`) + white `Got it` CTA

### Trigger (no header chip)

- **Auto-open** on `UploadScreen` mount when user arrives from style selection, unless dismissed for that style.
- **Not** shown from a header chip on Upload or Review (chip removed). User cannot manually reopen from Review; returning to Upload with a new style shows tips again unless dismissed for that style.

### Swapping in real photos later

Each example item in `stylePhotoTips.js` accepts an optional `image` field. If provided, it renders an `<Image>` instead of the placeholder:

```js
{ id: 'good-front', image: require('../assets/tips/tip-good-1.jpg'), good: true, title: 'Face forward', subtitle: 'Looking at camera' }
```

Recommended assets (drop into `apps/mobile/assets/tips/`):
- `tip-good-1.jpg` — front-facing portrait, clear lighting
- `tip-good-2.jpg` — smiling single person, neutral background
- `tip-bad-1.jpg` — sunglasses / heavy occlusion
- `tip-bad-2.jpg` — side profile / dramatic angle

### Key style keys

```
tipsRoot (absolute, zIndex 1000), tipsTopRow, tipsTopTitle,
tipsCloseCircle, tipsCloseCirclePlaceholder,
tipsScroll, tipsScrollContent, tipsLead,
tipsGrid, tipsGridCell, tipsConceptCard, tipsConceptCardGood, tipsConceptCardBad,
tipsConceptIconBg, tipsConceptIconBgGood, tipsConceptIconBgBad, tipsConceptImage,
tipsBadge, tipsBadgeGood, tipsBadgeBad,
tipsConceptTitle, tipsConceptSubtitle,
tipsRulesBlock, tipsRuleRow, tipsRuleBullet, tipsRuleBulletText, tipsRuleText,
tipsFooter (absolute bottom), tipsDontShowRow, tipsCheckbox, tipsDontShowText,
tipsContinueButton, tipsContinueButtonText,
tipsPlaceholder, tipsPlaceholderLabel
```

---

## 8. Section 5 — Subscription / Paywall

**File:** `apps/mobile/screens/SubscriptionScreen.js`

The paywall is the second pillar of the creation flow (Upload → Result → Paywall), so it adopts the same full-bleed dark aesthetic as `UploadScreen` and `PhotoTipsSheet`. This makes the entire premium funnel feel like one product.

### Layout (v3 — compact, all components matched to usage-card visual weight)

```
┌─────────────────────────────────────┐
│                              ⊗      │  ← floating circular close
│  ╔══╗ ╔══╗ ╔══╗ ╔══╗               │  ← marquee: 120×155 tiles, 170 wrap
│  ║  ║ ║  ║ ║  ║ ║  ║               │
│  ╚══╝ ╚══╝ ╚══╝ ╚══╝               │
│   ↓ scrim fades into dark ↓         │
│  Unlock every style                  │  ← 22px headline
│  More caricatures, every month.     │  ← 12.5px subhead
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Free trial          [TRIAL]   │ │  ← compact usage card
│  │ 2 of 3 free caricatures left  │ │     (padding 12, radius 14)
│  │ ▰▰▰▰▰▰▱▱▱▱▱  2/3              │ │
│  └────────────────────────────────┘ │
│                                      │
│  CHOOSE YOUR PLAN                    │
│  ┌────────────────────────────────┐ │
│  │ Starter            $5/mo   ⃝  │ │  ← tier cards: SAME padding/
│  │ 50 caricatures · ~$0.10 each   │ │     radius/font-weight as usage card
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ Popular [BEST] $10/mo  ⊙      │ │  ← selected: solid white, dark text
│  │ 100 caricatures · ~$0.10 each  │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ Pro [CURRENT]    $25/mo   ✓   │ │  ← current: green-tinted, green check
│  │ 250 caricatures · ~$0.10 each  │ │
│  └────────────────────────────────┘ │
│                                      │
│  Subscriptions renew monthly…       │
│ ─── pinned bottom bar (compact) ─── │
│  ┌────────────────────────────────┐ │
│  │   Continue with Popular        │ │  ← white pill (py 13)
│  └────────────────────────────────┘ │
│  [ Refresh ]      [ Restore ]       │  ← ghost (py 9)
│  Manage in Google Play              │
└─────────────────────────────────────┘
```

The tier cards now match the usage-card visual weight: same `padding: 12`, `borderRadius: 14`, `backgroundColor: rgba(255,255,255,0.06)`, `borderWidth: 1`. Tagline is dropped to keep height parity. Whole page fits ~720-780px total — single-screen on most devices.

### Side trip we walked back

Briefly experimented with **vertical tier cards in a horizontal swipe-snap `FlatList`** (74% screen width × 260px tall, with `snapToInterval` + auto-scroll to relevant tier). Visually striking but ate too much vertical real estate and pushed the layout off-screen on smaller devices. Reverted to the slim stacked layout above. The `pwd*V` style block was removed to avoid orphaned dead code; if we want to revisit, the relevant commit can be cherry-picked.

### Slim tier card anatomy

```
┌──────────────────────────────────────┐
│ Starter [BEST VALUE]   $5/mo   ⃝     │  ← single row: name + badge + price + radio
│ 50 caricatures · ~$0.10 each         │  ← meta line beneath
└──────────────────────────────────────┘
   padding: 12, borderRadius: 14, marginBottom: 8
   ≈ same vertical footprint as the usage card
```

### Three card visual states

| State | Background | Border | Name color | Radio |
|-------|-----------|--------|------------|-------|
| Default | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.10)` | white | hollow white |
| **Selected** | **white** | white | **dark** `#0F172A` | dark filled dot |
| Current (already subscribed) | `rgba(16,185,129,0.10)` | `rgba(16,185,129,0.45)` | white | green filled check |

Current and Selected are mutually exclusive (`disabled={isCurrent}`).

### Marquee size

Parameterized `PaywallStyleMarquee` with new `tileWidth` / `tileHeight` / `wrapHeight` / `gap` props (defaults preserved at the legacy 96×120 / 132 / 12). SubscriptionScreen passes **120×155 tiles, 170 wrap, 12 gap** — bigger than the original but compact enough that the whole paywall fits on one screen.

### Color-coded status pill (usage card)

| Pill | Background | Text | When |
|------|-----------|------|------|
| `TRIAL` | amber 16% on amber 45% border | `#F59E0B` | `isTrial === true` |
| `ACTIVE` | green 16% on green 45% border | `#10B981` | subscribed, not canceling |
| `CANCELING` | red 16% on red 45% border | `#EF4444` | `cancelAtPeriodEnd === true` |

### Pinned bottom action bar

- Lives outside the `ScrollView` as an absolutely-positioned bar at the bottom
- Has a `LinearGradient` scrim above it (rgba(0)→`#0B0F19`) so scrolling content fades smoothly
- `ScrollView` reserves space at the bottom equal to the bar's height + safe-area inset
- Refresh and Restore are translucent dark ghost buttons (consistent with UploadScreen's "Remove / Choose another")
- Manage link only renders when the user has an active subscription

### Animations

- Headline + usage card + section title + tier cards stagger in via `FadeInDown` (delays: 0, 60, 120, 160, 220, 280 ms)
- All interactive elements use `PressScale` (cards use `scaleTo: 0.985` for a subtler press since they're larger)

### Reused vs. new

- **Reused:** `PaywallStyleMarquee` (the auto-scrolling style strip)
- **New style group:** `pwd*` (paywall dark) in `apps/mobile/styles.js`
- **Legacy `paywall*` keys removed** in June 2026 styles prune (rollback via git history if needed)

### Why this works for the funnel

When the user runs out of trial credits and lands on the paywall, the visual continuity from UploadScreen → PaywallScreen reduces context-switch friction. The selected-tier-as-white-card mirrors the white "Generate" CTA on UploadScreen — the same affordance ("this is the active choice") in both places.

### Key style keys

```
pwdRoot, pwdHeroWrap, pwdHeroBottomScrim,
pwdFloatingCloseWrap, pwdCloseCircle,
pwdScroll, pwdScrollContent,
pwdHeadlineBlock, pwdHeadline, pwdSubhead,
pwdUsageCard, pwdUsageTopRow, pwdUsageTitleBlock, pwdUsagePlanName, pwdUsageLine,
pwdStatusPill, pwdStatusPillActive|Trial|Cancel, pwdStatusPillText, pwdStatusPillTextActive|Trial|Cancel,
pwdProgressRow, pwdProgressTrack, pwdProgressFill, pwdProgressNumbers,
pwdFootnoteRow, pwdFootnoteText, pwdPendingText,
pwdSectionTitle,
pwdTierCard, pwdTierCardSelected, pwdTierCardCurrent,
pwdTierRow, pwdTierLeft, pwdTierName(Dark),
pwdTierBadgePopular(Selected), pwdTierBadgePopularText(Selected),
pwdTierBadgeCurrent, pwdTierBadgeCurrentText,
pwdTierPriceBlock, pwdTierPrice(Dark), pwdTierPriceUnit(Dark),
pwdTierRadio, pwdTierRadioSelected, pwdTierRadioCurrent, pwdTierRadioDot,
pwdTierMeta(Dark),
pwdLegalText,
pwdBottomBar, pwdBottomScrim,
pwdPrimaryButton, pwdPrimaryButtonDisabled, pwdPrimaryButtonText,
pwdGhostRow, pwdGhostButton, pwdGhostButtonText,
pwdManageLink, pwdManageLinkText
```

---

## 9. Pending TODOs

### Content

- [ ] **Comparison pairs** — Run `npm run generate-comparisons` (requires `API_BASE` + `AUTH_TOKEN` env vars + 4–8 reference faces in `apps/mobile/assets/comparisons/before/`). Register results in `COMPARISON_OVERRIDES` in `data/comparisonPairs.js`.
- [ ] **Photo tips real photos** — Source 4 photos (2 good, 2 bad), drop into `apps/mobile/assets/tips/`, register in `data/stylePhotoTips.js` (per-style overrides in `STYLE_PHOTO_TIPS`).

### Cleanup

- [x] **Prune orphaned styles** — ran `apps/mobile/scripts/prune-unused-styles.js` (~440 keys removed: legacy `paywall*`, `crop*`, `photoPlaceholder*`, old light-theme leftovers). Re-run after large UI changes.
- [ ] Remove any remaining unused keys if new screens add styles (audit periodically).

- [ ] Branded splash PNG — see `To do/SPLASH_ASSET.md` (native `#0B0F19` splash + `expo-splash-screen` in place).
- [ ] **Sentry integration** — error reporting for mobile (optional API); see `To do/SENTRY_INTEGRATION.md`.

### Next UI sections

- [x] **Section 3 — Wait & Perceived Performance** — 4-phase loading with moderation step + **Creating your {style}** (`jobProgress.js`, `ResultScreen.js`).
- [x] **Section 4 — Result & Restyle** — slider, try-another-style, save/share, preview cache (see `ResultScreen.js`).

---

## 10. App menu (`MenuModal.js`)

Opened from StyleScreen burger (`onOpenMenu` → `menuOpen` in `App.js`).

| Item | Route (`setScreen`) |
|------|---------------------|
| My Gallery | `gallery` |
| Subscription | `subscription` |
| Privacy Policy | `privacy` |
| Terms & Conditions | `terms` |
| About | `about` |

**UX:** `<Modal transparent animationType="slide">`, dim backdrop (`rgba(0,0,0,0.45)`), solid `#0B0F19` sheet flush to bottom (safe-area padding inside sheet). Tap backdrop or hardware back to close. Header burger uses `menuButton` (40×40 tap target, white icon, **no** background/border — do not re-add chip styling).

**Style keys:** `menuBackdrop`, `menuDismissArea`, `menuSheet`, `menuHandle`, `menuItem`, `menuItemIcon`, `menuItemText`, `menuButton`, `styleScreenHeader`, `wordmark`, `headerBar`.

---

## 10b. Offline banner

**Files:** `components/OfflineBanner.js`, `components/NetworkProvider.js`

- Rendered as a **global absolute overlay** from `NetworkProvider` (not in document flow — does not push headers/pills).
- **Orange alert** styling (`#EA580C` card, white text) — matches offline warning toasts.
- Copy: "No connection — Generation and purchases need internet"
- Warning toasts (`type: 'warning'`) use the same orange treatment when user tries generate/subscribe offline.

**Do not** revert to full-width red in-flow banner or hide usage/style pills under layout shift.

---

## 11. Files touched in this redesign

### Mobile

```
apps/mobile/components/ConfirmDialog.js            [UPDATED — hideCancel single-action]
apps/mobile/utils/contentErrors.js                [NEW — NSFW copy + humanizeApiError]
apps/mobile/utils/jobProgress.js                  [NEW — 4-phase loading incl. moderation]
apps/mobile/index.js                              [NEW — entry + polyfills first]
apps/mobile/polyfills.js                          [NEW — URL + window.location for RC Expo Go]
apps/mobile/components/PressScale.js              [NEW]
apps/mobile/components/ComparisonFade.js          [NEW]
apps/mobile/components/PhotoTipsSheet.js          [UPDATED — auto-show, placeholders, don't-show-again]
apps/mobile/components/UploadFlowHeader.js        [NEW — shared upload/review header pills]
apps/mobile/components/OfflineBanner.js           [UPDATED — global orange overlay]
apps/mobile/components/NetworkProvider.js         [UPDATED — mounts OfflineBanner]
apps/mobile/components/MenuModal.js               [UPDATED — dark bottom sheet]
apps/mobile/data/comparisonPairs.js               [NEW]
apps/mobile/data/stylePhotoTips.js                [NEW — per-style tips config]
apps/mobile/utils/photoTipsPrefs.js               [NEW — AsyncStorage dismiss per style]
apps/mobile/hooks/useImagePicker.js               [UPDATED — expo-image-picker only]
apps/mobile/screens/StyleScreen.js                [REWRITTEN]
apps/mobile/screens/UploadScreen.js               [REWRITTEN]
apps/mobile/screens/PhotoReviewScreen.js          [NEW]
apps/mobile/screens/ResultScreen.js               [UPDATED]
apps/mobile/screens/SubscriptionScreen.js         [REWRITTEN]
apps/mobile/screens/GalleryScreen.js              [UPDATED — dark theme]
apps/mobile/screens/InfoScreen.js                 [UPDATED — dark theme]
apps/mobile/styles.js                             [dark-first; pwd*, upload*, styleRow*, tips*; pruned legacy]
apps/mobile/scripts/prune-unused-styles.js        [NEW]
apps/mobile/app.config.js                         [splash #0B0F19, no image; nav bar #0B0F19]
To do/SPLASH_ASSET.md                             [NEW — deferred splash branding]
```

**Removed:** `CropScreen.js`, `PhotoChooserScreen.js`, `processPickedImage.js`, `apps/mobile/api/test.ts`

### Tooling

```
scripts/generate-comparison-set.js                [NEW]
package.json                                      [+ generate-comparisons script]
```

### Documentation

```
MD/CHANGELOG.md                                   [+ [Unreleased] entry]
MD/UI_REDESIGN_2026_06.md                         [THIS FILE]
```

---

## 12. Rollback notes

If you need to revert any single section without touching the others:

1. **Revert Style screen** → `git checkout HEAD~N -- apps/mobile/screens/StyleScreen.js`.
2. **Revert Upload screen** → `git checkout HEAD~N -- apps/mobile/screens/UploadScreen.js`.
3. **Disable Photo Tips overlay** → set auto-show logic off in `UploadScreen.js`, or hide `<PhotoTipsSheet>`. No header chip to remove.
4. **Remove `ComparisonFade` background** → in `UploadScreen.js`, replace the `<ComparisonFade>` block with a static `<View style={{ backgroundColor: '#0B0F19' }} />`. The rest of the floating UI continues to work.
5. **Revert Subscription screen** → `git checkout HEAD~N -- apps/mobile/screens/SubscriptionScreen.js`. Restore legacy `paywall*` keys from git if reverting to the old white-sheet layout (they were pruned from `styles.js` in June 2026).

`PressScale` wraps `TouchableOpacity` — swapping back is mechanical if needed.
