# FunnyFy Mobile — UI Design Language (June 2026)

**Last updated:** June 2026  
**Scope:** App-wide dark UI, creation funnel, discovery, usage, paywall, gallery, system chrome  
**Canonical reference** for what the app looks like today, where code lives, and what not to regress.

---

## 1. Design language

### Surface & type

| Token | Value | Use |
|-------|-------|-----|
| `DARK_BG` | `#0B0F19` | App shell, every primary screen |
| `DARK_SURFACE` | `rgba(255,255,255,0.06)` | Cards on dark (usage card, tier default) |
| `DARK_CHIP` | `rgba(255,255,255,0.08)` | Legacy chip fills |
| `DARK_BORDER` | `rgba(255,255,255,0.12)` | Pill / chip borders |
| `DARK_MUTED` | `rgba(255,255,255,0.65)` | Secondary copy |
| `PAPER` | `#FFFFFF` | Primary text on dark, white CTAs |
| `INK` | `#0F172A` | Text on white surfaces (selected tier) |
| Font | Plus Jakarta Sans | `@expo-google-fonts/plus-jakarta-sans` |

### Pill & chip pattern (primary interactive language)

Most header controls and secondary actions use the **dark glass pill**:

```
background: rgba(15, 23, 42, 0.8)
border:     1px rgba(255,255,255, 0.12)
radius:     999 (pills) or 20 (40×40 circles)
text:       #FFFFFF
```

**Used on:** `uploadCircleButton`, `uploadHeaderStyleChip`, `uploadHeaderPill`, `uploadActionCardCta`, `uploadSmallGhostButton`, `usageManageLink`.

**Primary CTA** (Generate, Continue, Share, Save): solid **white pill**, dark text optional on colored contexts — `uploadGenerateButton`, `pwdPrimaryButton`.

### Low usage (amber)

When **≤10% quota remaining** (`utils/usageQuota.js`, `USAGE_LOW_REMAINING_RATIO = 0.1`):

- Header **usage pill** → `uploadHeaderPillLow` (+ amber progress fill/text)
- **Usage screen card** → `pwdUsageCardLow`, amber progress track/fill/numbers

Does **not** apply when quota is fully exceeded (separate exceeded banner / dialog flow).

### Status colors (usage only)

| State | Color |
|-------|-------|
| ACTIVE | green `#10B981` |
| TRIAL | amber `#F59E0B` |
| CANCELING | red `#EF4444` |

### Press feedback

`PressScale.js` — plain `TouchableOpacity` (`activeOpacity={0.85}`). Reanimated spring removed after Android freeze issues.

### Android system navigation bar

| Setting | Value |
|---------|--------|
| Theme color | Solid `DARK_BG` `#0B0F19` |
| Single source | `apps/mobile/constants/theme.js` — `DARK_BG` |
| Native (`app.config.js`) | `androidNavigationBar.backgroundColor` + `expo-navigation-bar` plugin |
| Runtime (`App.js`) | `setBackgroundColorAsync(DARK_BG)` on splash hide, screen change, and app resume |

Translucent nav bar was removed — it worked in Expo Go but showed a grey scrim on standalone APKs (Android 3-button nav + contrast enforcement). Solid dark matches the app shell reliably.

---

## 2. Screens delivered

| Screen | File | Status | Summary |
|--------|------|--------|---------|
| Style home | `StyleScreen.js` | Done | Netflix rows + per-category grid; dark header, icon-only burger |
| Upload | `UploadScreen.js` | Done | Comparison fade, Gallery/Camera dark pills, auto photo tips |
| Review | `PhotoReviewScreen.js` | Done | Confirm photo, Generate; **Choose another** (no Remove) |
| Result | `ResultScreen.js` | Done | Slider, save/share, try-another-style; shared header + home |
| **Usage** | `UsageScreen.js` | Done | Quota card, refresh, link to subscription |
| Subscription | `SubscriptionScreen.js` | Done | Marquee, tiers, pinned CTA — **no usage block** |
| Gallery | `GalleryScreen.js` | Done | Grid, swipe viewer, floating close |
| Info | `InfoScreen.js` | Done | Privacy, Terms, About |
| Menu | `MenuModal.js` | Done | Dark bottom sheet |

---

## 3. Shared components

| Component | Role |
|-----------|------|
| `UploadFlowHeader.js` | `[ ← ] [ style pill ] ··· [ usage pill ] [ optional trailing ]` — Upload, Review, **Result** |
| `ComparisonFade.js` | Upload background before/after crossfade |
| `PhotoTipsSheet.js` | In-tree overlay (not `<Modal>`); auto-show on Upload |
| `MenuModal.js` | App menu from style screen |
| `OfflineBanner.js` | Orange top overlay when offline |
| `PressScale.js` | Touch feedback wrapper |
| `PaywallStyleMarquee.js` | Subscription hero strip |

### UploadFlowHeader

```
[ ← 40px ] [ style pill ] ········ [ usage pill ] [ home on Result ]
```

| Element | Tap action |
|---------|------------|
| Back | Screen-specific back |
| Style pill | Change style / back |
| Usage pill | **Usage screen** (`onOpenUsage`) |
| Trailing (Result) | Home → style picker |

Quota label examples: `Trial · 2/3`, `Popular · 58/100`.

---

## 4. Style selection (`StyleScreen.js`)

- **Home:** vertical scroll, one horizontal row per category.
- **Category labels only** — row header shows category name; style tiles are image-only (no per-style captions).
- **See all:** shown for **every** category with ≥1 style (not only when >8).
- **Preview count:** `ROW_PREVIEW_COUNT = 8` styles per row before overflow tile.
- **Header:** wordmark + burger (`menuButton` — icon only, **no** chip background).
- **Tap tile** → `UploadScreen` for that style.

---

## 5. Upload → Review flow

### Pipeline

1. **Upload** — pick source via stacked **source rows** (library / camera — menu-style, whole row tappable)
2. OS crop via **`expo-image-picker`** (`allowsEditing: true`) — all builds
3. **Review** — confirm, **Generate**
4. **Result** — output, save, share, restyle

### Navigation (`App.js`)

| Trigger | Destination |
|---------|-------------|
| Style picked | `upload` (clears `pickedImage`) |
| Pick success | `review` |
| Generate | `result` |
| Back from Result | `review` if photo in memory, else `upload` |
| NSFW reject | `upload` (clears photo) |
| Generation in progress + back | Dialog — **OK only**, must wait |

### Photo tips

- Auto-open on Upload unless dismissed per style (`photoTipsPrefs.js`)
- **Not** in header; in-tree sheet (`PhotoTipsSheet.js`)

### Review actions

- **Choose another** — ghost pill (re-pick)
- **Generate** — white pill
- **Remove** button removed — use back header

---

## 6. Result (`ResultScreen.js`)

- Same **`UploadFlowHeader`** as upload/review (+ **home** trailing button).
- Before/after slider, pinned save/share, try-another-style.
- Loading: 4-phase copy via `jobProgress.js` (submit → queue → moderation → generate).
- Failed generation: not billed; humanized errors via `contentErrors.js`.

---

## 7. Usage (`UsageScreen.js`)

**Menu:** Usage (`bar-chart-2`)  
**Also opened from:** header usage pill

- `pwdUsageCard` with progress, status pill, renewal footnotes
- **Refresh usage** ghost button
- Link card → Subscription (upgrade / manage)
- Low-quota amber styling (see §1)

Detail: `MD/SUBSCRIPTION_UI_THEME_SNAPSHOT.md`

---

## 8. Subscription / paywall (`SubscriptionScreen.js`)

Hero + pinned bottom bar on dark `#0B0F19`:

- **Hero (top half):** `PaywallStyleFade` cycles style previews (same crossfade layers as `ComparisonFade` on Upload); top/bottom edge scrims; **FunnyFy / Premium** + benefits overlay
- **Plans:** compact tier rows in bottom bar (default / **selected** white / **current** green)
- **Footer hint:** “Cancel anytime.” (trial) or **Manage or cancel in Google Play** (subscribed)
- **CTA:** dynamic — **Select a plan** → **Continue with {tier}**
- **Footer links:** Privacy · Terms · Restore purchases (three equal columns)

- **No usage card, no Refresh** (Usage screen).

Detail: `MD/SUBSCRIPTION_UI_THEME_SNAPSHOT.md`

---

## 9. Gallery (`GalleryScreen.js`)

Detail: `MD/GALLERY_SCREEN.md`

- **Device path:** **`DCIM/Funnyfy/`** (album `Funnyfy`) — primary source for My Gallery
- Rescans all Funnyfy albums + path/filename fallback on every open
- Floating **X** close (`galleryCloseWrap`, top-right)
- Trash left in header when items exist (clears in-app list only — not `DCIM/Funnyfy`)
- Full-screen **paged swipe** viewer with `{i}/{n}` counter; image fills pager height
- Dark shell + white Share CTA (`resolveShareableImageUri` for device photos)

---

## 10. App menu (`MenuModal.js`)

| Item | Route |
|------|-------|
| My Gallery | `gallery` |
| **Usage** | `usage` |
| Subscription | `subscription` |
| Privacy Policy | `privacy` |
| Terms & Conditions | `terms` |
| About | `about` |

Dark bottom sheet `#0B0F19`, dim backdrop, hardware back dismisses.

---

## 11. Notifications & offline

See `MD/TOAST_NOTIFICATION_SYSTEM.md`.

- Toasts: top overlay; **warning** = orange (offline)
- ConfirmDialog: dark card `#151B28` on `#0B0F19`
- `OfflineBanner`: global orange pill — hidden on Upload/Review (inline chip there)

---

## 12. Animation conventions

| Pattern | Where |
|---------|-------|
| `FadeInDown` stagger | Style rows, usage card |
| Row focus | `useRowFocus.js` — all visible category rows animate comparison crossfade |
| Comparison crossfade | `ComparisonFade` on Upload + curated style tiles (`MediaTile`) |
| Style carousel crossfade | `PaywallStyleFade` on Subscription |
| Tips sheet slide | `PhotoTipsSheet` in-tree `withTiming` |

All via `react-native-reanimated` ~3.16.

---

## 13. Key files index

```
apps/mobile/App.js                    shell, routes, nav bar config
apps/mobile/styles.js                 tokens + pwd* + upload* + gallery*
apps/mobile/app.config.js             splash, nav bar plugin
apps/mobile/components/UploadFlowHeader.js
apps/mobile/components/ComparisonFade.js
apps/mobile/components/MediaTile.js
apps/mobile/hooks/useRowFocus.js
apps/mobile/data/comparisonPairs.js
apps/mobile/utils/mergeServerStyles.js
apps/mobile/components/PaywallStyleFade.js
apps/mobile/components/MenuModal.js
apps/mobile/screens/StyleScreen.js
apps/mobile/screens/UploadScreen.js
apps/mobile/screens/PhotoReviewScreen.js
apps/mobile/screens/ResultScreen.js
apps/mobile/screens/UsageScreen.js
apps/mobile/screens/SubscriptionScreen.js
apps/mobile/screens/GalleryScreen.js
apps/mobile/utils/usageQuota.js
apps/mobile/utils/funnyfyAlbum.js
```

---

## 14. Pending / content TODOs

- [x] Eight comparison pairs — `CURATED_PAIR_PATHS` in `data/comparisonPairs.js`; assets under `assets/comparisons/source/` + bundled `tiles/` / `hero/` (see `ToDo/COMPARISON_ASSETS.md`)
- [ ] Remaining enabled styles — `npm run generate-comparisons` + register pairs
- [ ] Photo tips real photos in `assets/tips/`
- [ ] Branded splash PNG — `ToDo/SPLASH_ASSET.md`
- [x] Sentry mobile — `ToDo/SENTRY_INTEGRATION.md` (staging verified June 2026)

---

## 15. Related docs

| Doc | Topic |
|-----|-------|
| `MD/SUBSCRIPTION_UI_THEME_SNAPSHOT.md` | Usage vs Subscription split |
| `MD/GALLERY_SCREEN.md` | **`DCIM/Funnyfy` save/load + My Gallery viewer** |
| `MD/TOAST_NOTIFICATION_SYSTEM.md` | Toasts & dialogs |
| `MD/CHANGELOG.md` | Release history |

---

## 16. Do not regress

- Light `#F3F4F6` / white-sheet screens (except **selected tier card**)
- Usage card on Subscription screen
- Header **Photo tips** chip
- `react-native-image-crop-picker` (squish bug in APK)
- In-app `CropScreen`
- Red full-width offline banner that shifts layout
- Burger menu chip background on style header
- Per-style name captions on style picker tiles (category headers only)
