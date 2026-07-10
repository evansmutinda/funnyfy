#!/usr/bin/env node
/** Generates Supabase SQL to backfill jobs.model_version + jobs.cost_usd from style_id */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../api/_utils/styles-config.ts'), 'utf8');

const costs = {
  'black-forest-labs/flux-kontext-pro': 0.04,
  'google/nano-banana': 0.039,
  'google/nano-banana-2': 0.067,
  'bytedance/seedream-4': 0.04,
  'bytedance/seedream-4.5': 0.04,
};

const vars = {};
for (const m of src.matchAll(/const (DEFAULT_MODEL|NANO_BANANA_2|NANO_BANANA|SEEDREAM_4_5|SEEDREAM_4)\s*=\s*'([^']+)'/g)) {
  vars[m[1]] = m[2];
}

const rows = [];
const blockRe = /\{\s*\n\s*id:\s*'([^']+)'[\s\S]*?\n\s*model:\s*([A-Z_0-9]+)/g;
for (const m of src.matchAll(blockRe)) {
  const id = m[1];
  const model = vars[m[2]] || m[2];
  rows.push({ id, model, cost: costs[model] ?? 0.04 });
}

const esc = (s) => s.replace(/'/g, "''");
const valueRows = rows
  .map((r) => `  ('${esc(r.id)}', '${esc(r.model)}', ${r.cost})`)
  .join(',\n');

const sql = `-- Backfill jobs.model_version + jobs.cost_usd (${rows.length} styles)
-- Supabase: run BLOCK 1 first. Do NOT run BLOCK 2 unless verify still shows gaps.

-- BLOCK 1 — REQUIRED (overwrites wrong flux fallback from earlier)
UPDATE jobs j
SET
  model_version = m.model_version,
  cost_usd = m.cost_usd
FROM (
  VALUES
${valueRows}
) AS m(style_id, model_version, cost_usd)
WHERE j.style_id = m.style_id
  AND j.status = 'completed';

-- BLOCK 2 — ONLY if BLOCK 1 verify still shows missing rows (skip otherwise)
UPDATE jobs
SET
  model_version = 'black-forest-labs/flux-kontext-pro',
  cost_usd = 0.04
WHERE status = 'completed'
  AND (model_version IS NULL OR model_version = '' OR cost_usd = 0);

-- BLOCK 3 — Rebuild cost_tracking
DELETE FROM cost_tracking
WHERE job_id IN (SELECT id FROM jobs WHERE status = 'completed');

INSERT INTO cost_tracking (job_id, date, cost_usd, model_version)
SELECT
  j.id,
  COALESCE(j.completed_at, j.created_at)::date,
  j.cost_usd,
  j.model_version
FROM jobs j
WHERE j.status = 'completed'
  AND j.cost_usd > 0
  AND j.model_version IS NOT NULL;

-- BLOCK 4 — Verify
SELECT
  COUNT(*) FILTER (WHERE status = 'completed' AND (model_version IS NULL OR model_version = '')) AS missing_model,
  COUNT(*) FILTER (WHERE status = 'completed' AND cost_usd = 0) AS zero_cost,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_total
FROM jobs;

SELECT model_version, cost_usd, COUNT(*) AS jobs
FROM jobs
WHERE status = 'completed'
GROUP BY model_version, cost_usd
ORDER BY jobs DESC;
`;

process.stdout.write(sql);
// Also write UTF-8 file for Supabase copy/paste
fs.writeFileSync(path.join(__dirname, '../api/migrations-backfill-job-costs.sql'), sql, 'utf8');
