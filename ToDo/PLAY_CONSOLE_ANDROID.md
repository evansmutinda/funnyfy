# Play Console / Android compliance

**Status:** Pending  
**Source:** Play Console → Test and release → For your next release (bundle `356.aab` / 1.2.44)

| Priority | Item | Why | Status |
|----------|------|-----|--------|
| 1 | **DEX / R8 obfuscation** (≥25%; was 3%) | Explicit deadline **Feb 2027**; publishing / visibility risk | Pending — R8 enabled in `app.config.js` (`enableProguardInReleaseBuilds`); verify after next release AAB in App bundle explorer |
| 2 | **16 KB native library alignment** | Hardware / Play compatibility on 16 KB page-size devices | Pending — needs NDK / Expo toolchain rebuild that ships 16 KB–aligned `.so`s |
| 3 | **Edge-to-edge deprecated APIs** | UX on Android 15+ (window / insets APIs) | Pending — migrate off deprecated edge-to-edge / window display APIs |
| 4 | **Large-screen orientation / resizability** | Tablets / foldables; Android 16 may ignore locks | Pending — later; app is portrait phone-first |

## Notes

- Do **not** treat 2–4 as blockers for finishing closed testing.
- After shipping an R8-enabled AAB, recheck **App bundle explorer → Details → DEX code optimization** (obfuscation / shrinking / R8).
- Upload `mapping.txt` (or rely on Sentry) so release crashes stay readable.

## Update nudge vs Play delay

Play rollout lag is normal. Mitigate by **ordering ops**, not by racing the Store:

| Step | Do | Don’t |
|------|----|--------|
| 1 | Ship AAB to closed testing / production | Set `LATEST_APP_VERSION` in the same breath as EAS upload |
| 2 | Confirm Update works on a tester device | Trust only the public listing version string |
| 3 | Set `LATEST_APP_VERSION` → redeploy API | Point nudge at a build only some tracks can install |

Optional later: `LATEST_APP_AVAILABLE_AFTER` (timestamp) so soft nudge stays off for a few hours after the env change — only if manual “wait then set” still slips.
