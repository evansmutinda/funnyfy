#!/usr/bin/env python3
"""Restores App.js with both bug fixes applied."""
import os, gzip, base64

here = os.path.dirname(os.path.abspath(__file__))
data_file = os.path.join(here, "app_data.b64")
target = os.path.join(here, "App.js")

with open(data_file) as f:
    b64 = f.read().replace("\n", "")

content = gzip.decompress(base64.b64decode(b64)).decode("utf-8")
with open(target, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Restored App.js: {len(content)} chars")
print("[1] Auto-save fix: gallery no longer auto-imports on every load")
print("[2] Opacity fix: ImageView replaced with custom Modal (no dimming bleed)")
print("\nDone! You can delete app_data.b64 and restore_app.py after running.")
