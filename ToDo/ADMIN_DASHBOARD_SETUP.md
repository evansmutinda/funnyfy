# Admin dashboard setup

**Status:** ✅ Staging + production admin login verified
**URLs:** Staging `https://funnyfy-staging.vercel.app/admin/login` · Production `https://funnyfyapp.vercel.app/admin/login`

---

## Context

- Admin user IDs come from **`users.id`** in Supabase Postgres (not Supabase Auth).
- Staging and production use **separate** databases — IDs are not shared.
- If `ADMIN_USER_IDS` is **empty**, login is **denied** (503 `ADMIN_NOT_CONFIGURED`).
- If `ADMIN_USER_IDS` is **set**, the ID must exist in `users` **and** be listed in the env var.

---

## Staging — done

- [x] Admin user ID chosen in staging Supabase
- [x] `ADMIN_USER_IDS` set on funnyfy-staging Vercel
- [x] Login verified at `/admin/login`
- [x] Admin fail-closed in code (`api/admin.ts`)

---

## Production — when ready

- [ ] Open **production** Supabase → list or create admin user:

```sql
SELECT id, revenuecat_user_id, subscription_tier, subscription_status, created_at
FROM users
ORDER BY created_at DESC;
```

- [x] Vercel → **funnyfyapp** → Environment Variables → set `ADMIN_USER_IDS` (prod UUID)
- [ ] Redeploy production
- [x] Verify https://funnyfyapp.vercel.app/admin/login

See [MD/ACCOUNTS_CHECKLIST.md](../MD/ACCOUNTS_CHECKLIST.md).

---

## How app users are created (reference)

New rows in `users` are created when the mobile app calls **`POST /api/auth/token`** on first launch. If the backend is down, the app may use a **local-only** UUID that never appears in Supabase.

---

## See also

- [MD/DATABASE_SCHEMA.md](../MD/DATABASE_SCHEMA.md) — `users` table
- [ToDo/security-deferred.md](./security-deferred.md) — main backlog
