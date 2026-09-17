# Credit packs (future versions)

**Status:** Deferred — not for current closed test / launch  
**Priority:** Later (post-subscription E2E stability)

## Why

When a subscriber exhausts monthly quota mid-cycle, offer **consumable top-up packs** instead of forcing a plan upgrade.

## Product (decide later)

- [ ] Pack sizes (e.g. +20 / +50 / +100 generations)
- [ ] Pricing (suggest 20–30% higher per image than subscription rate)
- [ ] Credits never expire (or expire at period end — pick one)
- [ ] UX when quota maxed: **Upgrade plan** vs **Buy credits**

## Store / RevenueCat (operator)

- [ ] Google Play: create **consumable** IAPs (not subscriptions)
- [ ] RevenueCat: import products + offering (e.g. `top_ups`)
- [ ] Confirm webhook receives consumable / non-subscription events
- [ ] License-tester purchase E2E on Internal/Closed testing

## App / API

- [ ] Persist credit balance (table or column; separate from monthly `usage_tracking` count)
- [ ] Grant credits on purchase (webhook + client sync)
- [ ] Enqueue: allow generate when plan quota full **if** credits remain; decrement credits
- [ ] Paywall / usage UI: show balance + buy packs
- [ ] Admin: view/adjust credit balance (optional)

## Out of scope for now

Keep hard paywall + tier upgrades only. Revisit after real Play subscription flow is proven.

## Refs

- [MD/suggestions/paywall.md](../MD/suggestions/paywall.md) §1, §4
- [MD/PINCEL_VS_FUNNYFY_TECHNICAL_COMPARISON.md](../MD/PINCEL_VS_FUNNYFY_TECHNICAL_COMPARISON.md) (credits model notes)
