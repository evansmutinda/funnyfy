# Fix: "Could not validate subscriptions API permissions" (RevenueCat + Google Play JSON)

This error appears in RevenueCat after you upload your Google Play **service account credentials JSON**. It means RevenueCat cannot access Google’s subscriptions API with the current permissions.

---

## 1. Grant the right permissions in Google Play Console

The service account must have **Account permissions** in Play Console, not only the JSON file.

1. Open **Google Play Console** → [Users and permissions](https://play.google.com/console/u/0/developers/users-and-permissions/invite).
2. Find the **service account** you use for RevenueCat (the email from your JSON, e.g. `revenuecat-service-account@your-project.iam.gserviceaccount.com`).
3. If it’s not there, **invite** it:
   - **Invite new users** → enter the service account email.
   - Under **Account permissions**, enable:
     - **View app information and download bulk reports (read-only)**
     - **View financial data, orders, and cancellation survey response**
     - **Manage orders and subscriptions**
   - Under **App permissions** add your app.
   - Send the invite.
4. If the user already exists, **edit** it and ensure these three **Account permissions** are checked:
   - View app information and download bulk reports (read-only)
   - View financial data, orders, and cancellation survey response
   - Manage orders and subscriptions

Save and wait for propagation (see below).

---

## 2. App must be on a track with an approved release

RevenueCat’s validation often fails until your app has a **released** version (e.g. on internal or closed testing).

- In **Play Console** → your app → **Release** → **Testing** (e.g. Internal testing or Closed testing).
- **Create a release** (or use an existing one), add a signed **APK or AAB**, complete the release steps, and get it **approved**.
- Add at least one **tester** to the track.
- Real-device testing of purchases should be done by **installing the app from the Play Store** (that track), not only from Android Studio or VSCode.

After the release is approved and live on a track, validation in RevenueCat often starts working.

---

## 3. Wait or use the “fast” workaround

- **Normal:** Permission and app changes can take **24–36 hours** to propagate. If you just fixed permissions or added the app to a track, try validating again after waiting.
- **Faster (optional):** In **Play Console** → your app → **Monetize** → **Products** → **Subscriptions** (or In-app products), open any product, **change the description**, save. Then in RevenueCat, trigger **Validate** again. This can make credentials validate sooner (not guaranteed).

---

## 4. Re-upload the JSON in RevenueCat

After changing permissions or the service account:

1. In **RevenueCat** → Project → **Google Play** app → **Service account** / credentials.
2. **Re-upload** the same (or new) JSON file and **Save**.
3. Click **Validate** again.

---

## 5. Quick checklist

- [ ] Service account **invited** in Play Console **Users and permissions** with the correct email.
- [ ] **Account permissions** include: View app information, **View financial data**, **Manage orders and subscriptions**.
- [ ] **App permissions** include your app.
- [ ] App has a **release** (APK/AAB) on at least one testing track and the release is **approved**.
- [ ] JSON **re-uploaded** in RevenueCat and **Validate** run again.
- [ ] If still failing, wait **24–36 hours** or try the product-description workaround.

---

## Reference

- RevenueCat: [Creating Play service credentials](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials) (see “Credential validator troubleshooting” for subscriptions API).
- Same project: `MD/REVENUECAT_SETUP.md` for full RevenueCat + FunnyFy setup.
