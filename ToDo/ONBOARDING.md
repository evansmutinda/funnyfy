# In-app onboarding tutorial

**Status:** Deferred — skip for now  
**Last updated:** 21 Oct 2026

## Goal

Short first-run tutorial for free / pre-subscribe users. Teach the FunnyFy loop in ~30s, then never show it again once they subscribe.

## Who sees it

- First launch (or until dismissed) **and** no active subscription
- **Disabled** when user has an active subscription (Starter / Popular / Pro)
- Persist “seen” in AsyncStorage so restore / reinstall with sub stays clean

```
showOnboarding = !hasSeenOnboarding && !isSubscribed
```

On successful subscribe or restore with entitlement → set `hasSeenOnboarding = true` and never show while subscribed.

## Recommended v1 format

3 coach-mark steps over the real UI (not a long carousel). Skip always visible.

| Step | Screen | Message |
|------|--------|---------|
| 1 | Style picker | Pick a style — slide to see before & after |
| 2 | Upload | Add a clear face photo |
| 3 | Generate / paywall edge | Generate, then unlock to save & get more |

Reuse the paywall before/after visual language. One line of copy per step.

## Out of scope for v1

- Account / auth lecture
- Quota math
- Feature laundry lists
- Anything shown to subscribed users

## Later (optional)

- “Replay tips” in Menu for free users only
- Soft re-show if free user hits generate with no photo after ~7 days
