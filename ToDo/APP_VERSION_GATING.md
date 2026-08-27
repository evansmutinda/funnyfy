# App version gating & update prompt

**Status:** Built — soft banner + `/api/styles` version fields. Raise `LATEST_APP_VERSION` on Vercel only after the matching AAB is live on Play.

**In plain English:** The server can turn styles on instantly, but the before/after pictures ship *inside* the APK. If someone has an old install, new styles can look broken. This feature (1) hides styles their app can’t show yet, and (2) gently asks them to update from the Play Store.

---

## Server

1. **`GET /api/styles`** (and rewrite **`GET /api/app-config`** → same handler with `?appConfig=1`) returns:
   - `minAppVersion` — from env `MIN_APP_VERSION` (optional global floor)
   - `latestAppVersion` — from env `LATEST_APP_VERSION` (newest *published* Play build)
   - `storeUrl` — from env `APP_STORE_URL` (defaults to Play listing for `com.evansks.funnyfyapp`)
   - `updateAvailable` — `true` when `X-App-Version` / `?appVersion=` is older than `latestAppVersion`

2. Tag enabled styles in `api/_utils/styles-config.ts` with optional `minAppVersion` (per-style). Shared helpers live in `api/_utils/app-version.ts`.

3. Filter `/api/styles` by client-reported version:
   - App sends header: `X-App-Version: 1.2.3` (from `expo-constants`)
   - Omit styles when `clientVersion < style.minAppVersion` (or global `MIN_APP_VERSION` when set)

4. **Deploy order:** ship AAB with assets first → publish on Play → then set `LATEST_APP_VERSION` / style `minAppVersion` on Vercel → redeploy API.

---

## Mobile

1. `fetchStyles` sends `X-App-Version` and reads update fields from the styles response.

2. **In-app update banner** (`components/UpdateBanner.js`, dismissible):
   - After styles load, if installed &lt; `latestAppVersion`, show soft banner: “Update available” → opens `storeUrl`
   - “Not now” stores dismissal for that `latestAppVersion` in AsyncStorage
   - Does not block the app

3. Optional later: refetch styles when app returns to foreground (today only subscription refreshes on foreground).

---

## Out of scope (for now)

- Push notifications for updates
- Remote/CDN-hosted preview images (Option B)
- Expo OTA / EAS Update (Option C)
- Hard force-update blocking screen

---

## Ops checklist (each Play release)

1. Bump `apps/mobile/version.json` → build & upload AAB
2. Wait until the build is available on Play (internal/production)
3. Set Vercel `LATEST_APP_VERSION` to that semver (staging/prod as needed)
4. For new styles that need bundled assets: set `minAppVersion` on those styles, then enable / redeploy
5. Redeploy API so clients pick up the new config

---

## References

- `api/_utils/app-version.ts` — semver + filtering
- `api/styles.ts` — catalog + config payload
- `apps/mobile/components/UpdateBanner.js`
- `apps/mobile/utils/appVersion.js`
- `apps/mobile/App.js` — `fetchStyles` / banner wiring
- `apps/mobile/version.json` — version source of truth
- `apps/mobile/constants.js` — `APP_STORE_LISTING_URL` (client fallback)
