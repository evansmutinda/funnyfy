# Subscription & Usage UI — Theme Snapshot (revert reference)

**Date:** 2026-06-15  
**Purpose:** Record the pre-split subscription screen layout and B&W theme tokens so changes can be reverted or compared.

---

## Global theme tokens (`apps/mobile/styles.js`)

| Token   | Value     | Usage                          |
|---------|-----------|--------------------------------|
| INK     | `#0F172A` | Primary text, buttons, borders |
| PAPER   | `#FFFFFF` | Cards, buttons                 |
| CANVAS  | `#F3F4F6` | Style/gallery screen background |
| BORDER  | `#E5E7EB` | Card borders                   |
| MUTED   | `#64748B` | Secondary text                 |

**Accent colors (status only):**
- Success/active pill: bg `#EAF3DE`, text `#3B6D11`
- Error/cancel link: `#A32D2D`
- Warning banners: `#FEF2F2` / `#FFFBEB`

**Removed:** Orange accent (legacy paywall CTA)

---

## Before this change — single Subscription screen

- **Background:** White (`#ffffff`) full screen
- **Hero:** 56×56 gray box with `✦` character (`paywallHeroIcon`)
- **Usage block:** Embedded in subscription page (`paywallPlanCard`)
  - 4px progress bar (`paywallProgress`)
  - Trial: "Free Trial" + "X of Y caricatures used"
  - Paid: "X of Y left this month" + renewal date
  - Pills: UPGRADE / ACTIVE / Canceling
- **Tier cards:** White on white, border `#E5E7EB`
  - Selected: 1.5px `#0F172A` border
  - Current: gray fill `#F1F5F9`
  - **No** "MOST POPULAR" badge on Popular tier (styles existed but unused)
- **Bottom actions:** All three buttons used `primaryButton` (black)
  - Subscribe, Refresh, Restore — same visual weight
- **Menu:** Single item "Subscriptions"

### Key style keys (still present unless noted)

```
paywallContainer, paywallPlanCard, paywallProgress (4px),
paywallTierCard, paywallTierCardSelected, paywallTierCardCurrent,
paywallHeroIconWrapper, paywallHeroIcon,
primaryButton, primaryButtonText
```

---

## After this change

### Usage screen (`screens/UsageScreen.js`) — NEW
- Menu: **Usage** (`bar-chart-2` icon)
- Background: `#F3F4F6` (matches style/gallery)
- White usage card with **8px** progress bar + `current/limit` numbers
- Trial-specific headline copy
- "Upgrade your plan" card → navigates to Subscription
- Single secondary **Refresh usage** button

### Subscription screen (`screens/SubscriptionScreen.js`)
- **No usage/quota UI** — plans & purchase only
- Background: `#F3F4F6`
- Text hero: "More caricatures, every month"
- Compact plan summary line ("You're on Popular")
- Popular tier: **MOST POPULAR** badge + pre-selected for trial users
- Per-tier tagline + `~$0.10 each` hint
- Refresh / Restore: `secondaryOutlineButton` (white + border)
- Legal footer: monthly renewal / cancel anytime

### New style keys

```
paywallScreenSafe, paywallHeroBlock, paywallHeroTitle, paywallHeroSubtext,
paywallPlanSummaryCard, paywallTierCardPopular, paywallTierTagline, paywallLegalText,
secondaryOutlineButton, secondaryOutlineButtonText,
usageScreenSafe, usageCard, usageProgressTrack (8px), usageUpgradeCard, …
```

---

## Revert checklist

1. Delete `screens/UsageScreen.js`
2. Remove `usage` route + import from `App.js`
3. Remove Usage menu item from `MenuModal.js`
4. Restore `SubscriptionScreen.js` from git:  
   `git show HEAD~1:apps/mobile/screens/SubscriptionScreen.js` (adjust commit as needed)
5. Remove new style blocks from `styles.js` (search `usageScreen` / `paywallScreenSafe` / `secondaryOutlineButton`)
6. Merge usage card back into subscription screen if full revert desired

---

## Files touched

- `apps/mobile/screens/UsageScreen.js` (new)
- `apps/mobile/screens/SubscriptionScreen.js`
- `apps/mobile/App.js`
- `apps/mobile/components/MenuModal.js`
- `apps/mobile/styles.js`

---

## June 2026 — Current subscription layout

**File**: `apps/mobile/screens/SubscriptionScreen.js` + `PaywallStyleMarquee.js`

- **Top (ink hero)**: Dark `#0F172A` block with headline + auto-scrolling style image marquee (`PAYWALL_MARQUEE_IMAGES`)
- **Bottom (white sheet)**: Scrollable — usage card, tier cards, Subscribe / Refresh / Restore, legal footer
- **Not split across screens** — usage and plans live together in the white sheet (marquee stays in hero only)

**Revert reference**: This section documents the layout after restoring split hero + sheet (replacing earlier single-page or separated Usage screen experiments).

