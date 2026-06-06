# Gallery Screen

**Status**: Implemented
**Added**: February 2026

---

## Overview

The Gallery screen shows all caricatures the user has saved to their device. Users can view them full-screen and clear all saved caricatures.

---

## How It Works

1. User taps the **Gallery** icon from the Style Selection or Upload screen
2. The Gallery screen opens showing a grid of saved images
3. Tap any image to view it full-screen (using `react-native-image-viewing`)
4. In full-screen mode, tap **✕** to close
5. Tap the **🗑** (trash) icon in the gallery header to clear all saved caricatures (with a ConfirmDialog first)

---

## Implementation

- **Library**: `react-native-image-viewing` for the full-screen viewer
- **Storage**: Images are saved to the device's media library via `expo-media-library`
- **State**: Gallery loads saved images from a persistent list stored in `AsyncStorage`
- **Icons**: ✕ for closing the viewer, 🗑 for clearing the gallery

---

## UX Decisions

| Decision | Reason |
|----------|--------|
| ✕ button closes the full-screen viewer | Intuitive; avoids confusion with the delete action |
| 🗑 trash icon clears all, not individual images | Simplest UX for first version; individual delete can be added later |
| ConfirmDialog before clearing | Prevents accidental data loss |
| Toast on successful clear | Consistent with the rest of the app's notification system |

---

## Dependencies

```json
"react-native-image-viewing": "^0.2.2"
```

---

**Last Updated**: May 2026
**Implementation**: `App.js` (GalleryScreen component)
