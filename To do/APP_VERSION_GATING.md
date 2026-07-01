# App version gating & update prompt (Option A)

**Status:** Backlog — implement when ready.

**Problem:** Styles list updates live from `GET /api/styles`, but thumbnails and comparison assets are bundled in the APK. Enabling a style on the server before users have the matching build shows broken or generic previews.

**Goal:** Gate server styles by app version and nudge users on old builds to update — no push notifications required.

---

## Server

1. Add `GET /api/app-config` (or extend `/api/styles`) with:
   - `minAppVersion` — oldest app version that can use the current style set
   - `latestAppVersion` — newest published build (from `apps/mobile/version.json` or manual bump on release)
   - `storeUrl` — Play Store listing (`EXPO_PUBLIC_APP_STORE_URL` / env on server)

2. Tag each enabled style in `api/_utils/styles-config.ts` with optional `minAppVersion` (per-style) or maintain a single global minimum per release.

3. Filter `/api/styles` by client-reported version:
   - App sends header or query: `X-App-Version: 1.0.35` (from `expo-constants` / `version.json`)
   - Omit styles (or entire new batch) when `clientVersion < style.minAppVersion`

4. **Deploy order:** ship APK with assets first → publish → then enable styles / raise `minAppVersion` on API.

---

## Mobile

1. Send app version on `fetchStyles` (header or `?appVersion=`).

2. **In-app update banner** (dismissible):
   - On launch, fetch app-config
   - If `installedVersion < latestAppVersion`, show soft banner: “Update FunnyFy for new styles” → open `storeUrl`
   - Do not block the app (soft nudge only)

3. Optional: refetch styles when app returns to foreground (today only subscription refreshes on foreground).

---

## Out of scope (for now)

- Push notifications for updates
- Remote/CDN-hosted preview images (Option B)
- Expo OTA / EAS Update (Option C)

---

## References

- `MD/STYLES.md` — deploy checklist
- `apps/mobile/App.js` — `fetchStyles`
- `apps/mobile/version.json` — version source of truth
- `apps/mobile/constants.js` — `APP_STORE_LISTING_URL`
