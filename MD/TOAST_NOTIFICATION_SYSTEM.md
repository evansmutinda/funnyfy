# Toast Notification & ConfirmDialog System

**Last updated:** June 2026  
**UI reference:** `MD/UI_REDESIGN_2026_06.md` §11

Replaces all system `Alert.alert` calls with in-app components that match the dark UI.

---

## Components

### ToastNotification

Floating message, auto-dismiss (~3s, ~5s with action).

| Type | Styling | Use |
|------|---------|-----|
| `success` | Green accent on `#151B28` card | Save, remove, purchase OK |
| `error` | Soft red accent on dark card | Failures |
| `warning` | **Orange** full pill (same as offline banner) | Offline, trial warnings, generation unavailable |
| `info` | Indigo accent on dark card | General info |

```js
const { showToast } = useNotifications();
showToast('Title', 'Message', 'success');
showToast('No connection', 'Connect to generate.', 'warning', {
  actionLabel: 'Upgrade',
  onAction: () => setScreen('subscription'),
});
```

### ConfirmDialog

Dark modal for choices. Supports single-action (OK only), two-button, or three-button layouts.

```js
const { showDialog, closeDialog } = useNotifications();
showDialog({
  title: 'Generation in progress',
  message: 'Your caricature is still being created. Please wait for it to finish.',
  confirmLabel: 'OK',
  onConfirm: closeDialog,
});
```

**Design:** card `#151B28` on `#0B0F19` shell; white primary pill; outlined cancel/destructive variants.

### NotificationProvider

Wraps the app in `App.js`. Export hook:

```js
import { useNotifications } from '../components/NotificationProvider';
```

---

## Offline UX

| Surface | Behavior |
|---------|----------|
| `OfflineBanner` | Global orange top overlay (most screens) |
| Upload / Review | Banner **hidden**; inline offline chip in flow |
| Generate / subscribe offline | Orange **warning** toast |

Do not use full-width in-flow red bars — they shift header/pill layout.

---

## Screens using dialogs / toasts

- **Gallery** — clear-all, delete confirm
- **Upload / Review** — picker errors, quota dialogs
- **Result** — save-before-leave, generation-back block, share errors
- **Subscription** — purchase / restore feedback
- **Usage** — (via shared refresh errors in `App.js`)

---

## Implementation files

```
apps/mobile/components/NotificationProvider.js
apps/mobile/components/NetworkProvider.js      ← mounts OfflineBanner
apps/mobile/components/OfflineBanner.js
```

Toast/Dialog UI styles live in `apps/mobile/styles.js` (dark theme tokens from §1 of UI redesign doc).
