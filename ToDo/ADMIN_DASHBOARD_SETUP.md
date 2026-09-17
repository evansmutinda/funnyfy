# Admin dashboard setup

**Status:** ✅ Staging + production `admin_users` seeded (`funnyfyapp@gmail.com`) · deploy login wiring
**URLs:** Staging `https://funnyfy-staging.vercel.app/admin/login` · Production `https://funnyfyapp.vercel.app/admin/login`

---

## Context

- Admins live in **`admin_users`** (separate from app `users`).
- Login accepts **`admin_users.id`** (UUID) or **`admin_users.email`**.
- Staging and production use **separate** databases — rows are not shared.
- If `admin_users` is empty **and** `ADMIN_USER_IDS` is empty, login is **denied** (503 `ADMIN_NOT_CONFIGURED`).
- Legacy fallback: app `users.id` listed in Vercel `ADMIN_USER_IDS` still works.

Schema (`api/migrations-master.sql`):

```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) UNIQUE NOT NULL,
  role       VARCHAR(20)  NOT NULL DEFAULT 'admin', -- 'admin','support','viewer'
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

## Staging — done

- [x] Admin access working on funnyfy-staging
- [x] Admin fail-closed in code (`api/admin.ts`)

---

## Production setup

1. Production Supabase → ensure table exists (run migrations if needed).
2. Insert an admin:

```sql
INSERT INTO admin_users (email, role)
VALUES ('you@example.com', 'admin')
RETURNING id, email, role;
```

3. Deploy API so login uses `admin_users` (this branch).
4. Open https://funnyfyapp.vercel.app/admin/login → sign in with that **email** or **id**.

Optional legacy: Vercel → **funnyfyapp** → `ADMIN_USER_IDS=<app users.id>` still works as fallback.

See [MD/ACCOUNTS_CHECKLIST.md](../MD/ACCOUNTS_CHECKLIST.md).

---

## How app users are created (reference)

New rows in `users` are created when the mobile app calls **`POST /api/auth/token`** on first launch. Those are **not** admins.

---

## See also

- [MD/DATABASE_SCHEMA.md](../MD/DATABASE_SCHEMA.md) — `users` table
- [ToDo/security-deferred.md](./security-deferred.md) — main backlog
