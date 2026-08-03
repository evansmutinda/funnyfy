# Subscription & Usage UI — Current Design

**Date:** June 2026 (updated)  
**Purpose:** Reference for the split **Usage** vs **Subscription** screens and shared `pwd*` paywall styling.

**Canonical UI doc:** `MD/UI_REDESIGN_2026_06.md`

---

## Split responsibilities

| Screen | File | Purpose |
|--------|------|---------|
| **Usage** | `screens/UsageScreen.js` | Plan name, quota progress, trial/renewal notes, status pill, **Refresh usage**, link to subscription |
| **Subscription** | `screens/SubscriptionScreen.js` | Style-fade hero, tier cards, dynamic **Continue with …** CTA, symmetric footer links |

Usage was moved off the paywall so subscription stays focused on plans and purchase.

---

## Navigation

| Entry point | Destination |
|-------------|-------------|
| Menu → **Usage** | `usage` |
| Menu → **Subscription** | `subscription` |
| Header **usage pill** (upload / review / result) | `usage` |
| Usage screen → **View subscription plans** / **Manage subscription** | `subscription` |

---

## Usage screen layout

```
┌─────────────────────────────────────┐
│  ←                          (back)  │
│  Usage                              │
│  Your plan and caricature allowance │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Popular plan        [ACTIVE]   │ │  ← pwdUsageCard (+ pwdUsageCardLow)
│  │ 42 of 100 left                 │ │
│  │ ▰▰▰▰▱▱▱▱▱▱  58/100             │ │
│  │ 📅 Next renewal · …            │ │
│  └────────────────────────────────┘ │
│  [ ↻ Refresh usage ]                │
│  [ Manage subscription        → ]   │
└─────────────────────────────────────┘
```

- Dark shell `#0B0F19`, same header pattern as Gallery (`galleryHeaderBand` + `uploadCircleButton` back).
- Reuses **`pwdUsageCard`** and progress/status styles from the paywall design system.
- Copy: subscribed users see **“X of Y left”** (no “this month”).
- **Low usage:** when ≤10% remaining (`utils/usageQuota.js`), card + progress turn **amber** (`pwdUsageCardLow`, `pwdProgressFillLow`, etc.) — same rule as header usage pill.

---

## Subscription screen layout

```
┌─────────────────────────────────────┐
│  ⊗ (floating close, top-left)       │
│  [ PaywallStyleFade — top half ]    │  ← full-bleed crossfade (ComparisonFade technique)
│  edge scrims + FunnyFy / Premium    │
│ ─── pinned bottom bar ───           │
│  [ Starter / Popular / Pro ]        │
│  Cancel anytime.  OR  Manage link   │  ← trial vs subscribed
│  [ Select a plan / Continue with … ]│  ← dynamic CTA label
│  Privacy  ·  Terms  ·  Restore      │  ← equal-width columns
└─────────────────────────────────────┘
```

**No usage card. No Refresh button** (both live on Usage screen).

### CTA button labels

| State | Label |
|-------|--------|
| Trial, no tier picked | **Select a plan** (Popular auto-selected → **Continue with Popular**) |
| Tier selected | **Continue with Starter / Popular / Pro** |
| Subscribed, changing plan | **Select a plan to change** until another tier is picked |
| Processing | **Processing…** |

### Footer hint (above CTA)

| State | Copy |
|-------|------|
| Trial / not subscribed | **Cancel anytime.** |
| Subscribed | **Manage or cancel in Google Play** (tappable) |

### Tier card states

| State | Background | Border | Notes |
|-------|------------|--------|-------|
| Default | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.10)` | Hollow radio |
| **Selected** | white | white | Dark text (`INK`), filled dot |
| **Current** | green tint | green border | Green check radio, `disabled` |

### Status pills (Usage screen only)

| Pill | Colors | When |
|------|--------|------|
| TRIAL | amber | `isTrial` |
| ACTIVE | green | subscribed, not canceling |
| CANCELING | red | `cancelAtPeriodEnd` |

---

## Shared dark tokens (`styles.js`)

| Token | Value | Usage |
|-------|-------|--------|
| `DARK_BG` | `#0B0F19` | App shell, all primary screens |
| `DARK_SURFACE` | `rgba(255,255,255,0.06)` | Cards on dark (usage card, tier default) |
| `DARK_BORDER` | `rgba(255,255,255,0.12)` | Pill/chip borders |
| `DARK_MUTED` | `rgba(255,255,255,0.65)` | Secondary text |
| `PAPER` | `#FFFFFF` | Primary text, white CTAs |
| `INK` | `#0F172A` | Text on white selected tier |
| **Pill fill** | `rgba(15, 23, 42, 0.8)` | Header chips, circle buttons, ghost CTAs on upload |
| **Low usage** | `#F59E0B` / `#FBBF24` / `#FDE68A` | Progress + borders when quota ≤10% left |

Style group: **`pwd*`** (paywall dark). Legacy **`paywall*`** marquee styles removed June 2026.

---

## Key files

```
apps/mobile/screens/UsageScreen.js
apps/mobile/screens/SubscriptionScreen.js
apps/mobile/components/PaywallStyleFade.js          ← hero style crossfade
apps/mobile/components/ComparisonFade.js          ← same technique on Upload
apps/mobile/components/UploadFlowHeader.js      ← usage pill → Usage
apps/mobile/utils/usageQuota.js                 ← isLow threshold
apps/mobile/components/MenuModal.js             ← Usage + Subscription items
apps/mobile/App.js                              ← routes + refreshSubscription
apps/mobile/styles.js                           ← pwd*, uploadHeaderPillLow, …
```

---

## Historical note

Pre–June 2026: single white subscription sheet with embedded usage block (`paywallPlanCard`). Superseded by full-bleed dark paywall, then by **Usage / Subscription split**. Revert via git history if needed — do not restore `paywall*` from this doc.
