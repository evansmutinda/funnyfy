# Toast Notification & ConfirmDialog System

This document explains the in-app notification system that replaced all system `Alert.alert` calls in FunnyFy.

---

## Why We Changed from Alert.alert

Android and iOS system alerts look different and feel out of place. The new system gives FunnyFy:
- A consistent look on all devices
- Beautiful styled toasts that match the app design
- More control (e.g. 3-button confirm dialogs)

---

## Components

### 1. ToastNotification

A floating message that appears briefly and disappears automatically.

**Types**: `success` (green), `error` (red), `info` (blue/neutral)

**How to show a toast:**
```js
// From any screen using the NotificationContext:
const { showToast } = useNotifications();

showToast('Image saved!', 'success');
showToast('Something went wrong. Please try again.', 'error');
showToast('Generating your caricature...', 'info');
```

### 2. ConfirmDialog

A modal dialog that asks the user to make a choice. Supports 2 or 3 buttons.

**Example — 2 buttons (Confirm / Cancel):**
```js
const { showConfirm } = useNotifications();

showConfirm(
  'Delete Image',
  'Are you sure you want to delete this image?',
  () => handleDelete(),   // confirm action
  () => {},               // cancel action
  'Delete',               // confirm button label
  'Cancel'                // cancel button label
);
```

**Example — 3 buttons (Save / Discard / Cancel):**
```js
showConfirm(
  'Unsaved Image',
  'You have an unsaved caricature. What would you like to do?',
  () => handleSave(),     // primary action (Save)
  () => handleDiscard(),  // secondary action (Discard)
  'Save',
  'Discard',
  'Cancel',               // neutral button label (3rd button)
  () => {}                // neutral action (Cancel)
);
```

### 3. NotificationContext

A React Context that makes toasts and dialogs available everywhere in the app without passing functions through every screen.

**Setup (already done in App.js):**
```js
// App.js wraps the whole app:
<NotificationContext.Provider value={notificationValue}>
  {/* all screens */}
  <ToastNotification ... />
  <ConfirmDialog ... />
</NotificationContext.Provider>
```

**Using the context in any screen:**
```js
import { useNotifications } from '../context/NotificationContext';

function MyScreen() {
  const { showToast, showConfirm } = useNotifications();
  // ...
}
```

---

## Screens Updated

All `Alert.alert` calls were replaced across:
- **Gallery screen**: Clear-all confirmation
- **Upload screen**: Errors and confirmations
- **Result screen**: Save-before-leave (3-button), save success, share errors
- **PhotoChooser**: Permission errors
- **Subscribe / Subscription screen**: Purchase errors, restore errors, success messages

---

## Design

- Toasts appear at the top of the screen (below status bar)
- They auto-dismiss after ~3 seconds
- ConfirmDialogs use the app's black/white color scheme
- Primary action button is black; cancel is outlined

---

**Last Updated**: May 2026
**Implementation**: `App.js` (NotificationContext, ToastNotification, ConfirmDialog components)
