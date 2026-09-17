const { Client } = require('pg');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('NO_DATABASE_URL');
    process.exit(1);
  }
  const host = url.match(/@([^/]+)/)?.[1] || 'unknown';
  console.log('host=' + host);

  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  await c.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const email = process.env.ADMIN_EMAIL || 'funnyfyapp@gmail.com';
  const upsert = await c.query(
    `INSERT INTO admin_users (email, role)
     VALUES ($1, 'admin')
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
     RETURNING id, email, role, created_at`,
    [email]
  );
  console.log('upserted=' + JSON.stringify(upsert.rows[0]));

  const all = await c.query('SELECT id, email, role FROM admin_users ORDER BY created_at');
  console.log('admin_count=' + all.rowCount);
  for (const r of all.rows) {
    console.log(`admin id=${r.id} email=${r.email} role=${r.role}`);
  }

  await c.end();
}

main().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
