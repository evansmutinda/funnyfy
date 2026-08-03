# Admin dashboard setup

**Status:** ⬜ Staging login page works; admin user ID not configured  
**URLs:** Staging login `https://funnyfy-staging.vercel.app/admin/login` · Production `https://funnyfyapp.vercel.app/admin/login`

---

## Context

- Admin user IDs come from the **`users.id`** column in Supabase Postgres (not Supabase Auth).
- Staging and production use **separate** databases — IDs are not shared.
- If `ADMIN_USER_IDS` is **empty**, any valid UUID can log in (testing only — insecure).
- If `ADMIN_USER_IDS` is **set**, the ID must exist in `users` **and** be listed in the env var.
- Old IDs (e.g. local fallback UUIDs from `.funnyfyauth.json`) may never have been inserted into Supabase.

---

## Checklist

### 1. Pick your admin user ID (staging)

- [ ] Open **staging** Supabase → SQL Editor (or Table Editor → `users`)
- [ ] List users:

```sql
SELECT id, revenuecat_user_id, subscription_tier, subscription_status, created_at
FROM users
ORDER BY created_at DESC;
```

- [ ] Choose the row that is **your** main test account (match `revenuecat_user_id` or `created_at`)
- [ ] **Or** create a dedicated admin user:

```sql
INSERT INTO users (
  revenuecat_user_id, subscription_tier, subscription_status,
  trial_generations_used, billing_date, created_at, updated_at
)
VALUES ('admin-evans', 'pro', 'active', 0, CURRENT_DATE, NOW(), NOW())
RETURNING id;
```

### 2. Configure Vercel (funnyfy-staging)

- [ ] Vercel → **funnyfy-staging** → Settings → Environment Variables
- [ ] Set `ADMIN_USER_IDS` to your chosen UUID (comma-separated for multiple admins)
- [ ] Confirm `JWT_SECRET` is set
- [ ] **Redeploy** staging after saving

### 3. Verify login

- [ ] Open https://funnyfy-staging.vercel.app/admin/login
- [ ] Sign in with the UUID from step 1
- [ ] Dashboard loads (Overview shows user/job stats)

**PowerShell smoke test:**

```powershell
$body = '{"userId":"YOUR-UUID-HERE"}'
Invoke-RestMethod -Uri "https://funnyfy-staging.vercel.app/api/admin?resource=login" `
  -Method POST -ContentType "application/json" -Body $body
```

### 4. Production (when ready)

- [ ] Repeat steps 1–3 on **production** Supabase + **funnyfyapp** Vercel project
- [ ] Use production-specific admin UUID(s) in `ADMIN_USER_IDS`
- [ ] See `MD/ACCOUNTS_CHECKLIST.md`

### 5. Security follow-up

- [ ] Enable **admin fail-closed** — deny login when `ADMIN_USER_IDS` is empty (see `ToDo/security-deferred.md`)
- [ ] Deploy clearer login error messages (`api/_utils/admin-pages/login-page.html` — local change pending)

---

## How app users are created (reference)

New rows in `users` are created when the mobile app successfully calls **`POST /api/auth/token`** on first launch (or after reinstall / cleared auth). If the backend is down, the app may use a **local-only** UUID that never appears in Supabase.

---

## See also

- `MD/ACCOUNTS_CHECKLIST.md` — staging vs production URLs
- `MD/DATABASE_SCHEMA.md` — `users` table
- `ToDo/security-deferred.md` — admin fail-closed backlog item
