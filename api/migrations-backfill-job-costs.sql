-- Backfill jobs.model_version + jobs.cost_usd (70 styles)
-- Supabase: run BLOCK 1 first. Do NOT run BLOCK 2 unless verify still shows gaps.

-- BLOCK 1 — REQUIRED (overwrites wrong flux fallback from earlier)
UPDATE jobs j
SET
  model_version = m.model_version,
  cost_usd = m.cost_usd
FROM (
  VALUES
  ('90s-cartoon', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('chibi', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('classic-v1', 'bytedance/seedream-4', 0.04),
  ('classic-v2', 'google/nano-banana', 0.039),
  ('saturday-v1', 'google/nano-banana', 0.039),
  ('saturday-v2', 'bytedance/seedream-4', 0.04),
  ('comic', 'bytedance/seedream-4.5', 0.04),
  ('cute', 'bytedance/seedream-4.5', 0.04),
  ('dc', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('cyberpunk-v1', 'bytedance/seedream-4.5', 0.04),
  ('cyberpunk-v2', 'google/nano-banana-2', 0.067),
  ('disney', 'google/nano-banana-2', 0.067),
  ('pixel', 'bytedance/seedream-4.5', 0.04),
  ('3d-render-v1', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('3d-render-v2', 'bytedance/seedream-4.5', 0.04),
  ('comic-v1', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('comic-v2', 'bytedance/seedream-4.5', 0.04),
  ('neon', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('anime', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('custom1', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('3dclay', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('oil-paint', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('lowpoly', 'bytedance/seedream-4', 0.04),
  ('mural', 'google/nano-banana', 0.039),
  ('pop-art-v1', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('pop-art-v2', 'bytedance/seedream-4', 0.04),
  ('pop-art-v3', 'google/nano-banana', 0.039),
  ('graffiti', 'bytedance/seedream-4', 0.04),
  ('banksy', 'bytedance/seedream-4', 0.04),
  ('mosaic', 'bytedance/seedream-4', 0.04),
  ('e-glow', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('abstract-v1', 'google/nano-banana', 0.039),
  ('abstract-v2', 'bytedance/seedream-4', 0.04),
  ('geometric', 'bytedance/seedream-4', 0.04),
  ('surreal', 'google/nano-banana', 0.039),
  ('coloured-glass', 'bytedance/seedream-4', 0.04),
  ('paste-up', 'bytedance/seedream-4', 0.04),
  ('water-color', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('acrylic', 'bytedance/seedream-4', 0.04),
  ('gouache', 'bytedance/seedream-4', 0.04),
  ('expressionist', 'bytedance/seedream-4', 0.04),
  ('impressionist', 'bytedance/seedream-4', 0.04),
  ('baroque', 'bytedance/seedream-4', 0.04),
  ('van-gogh', 'bytedance/seedream-4', 0.04),
  ('monet', 'bytedance/seedream-4', 0.04),
  ('renoir', 'google/nano-banana-2', 0.067),
  ('cezanne', 'bytedance/seedream-4.5', 0.04),
  ('gauguin', 'bytedance/seedream-4.5', 0.04),
  ('matisse', 'bytedance/seedream-4.5', 0.04),
  ('seurat', 'bytedance/seedream-4.5', 0.04),
  ('ink-wash', 'bytedance/seedream-4.5', 0.04),
  ('impasto', 'google/nano-banana-2', 0.067),
  ('hokusai-v1', 'bytedance/seedream-4.5', 0.04),
  ('hokusai-v2', 'google/nano-banana-2', 0.067),
  ('hiroshige', 'google/nano-banana-2', 0.067),
  ('sesshu', 'google/nano-banana-2', 0.067),
  ('pixar-like', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('funko-pop', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('custom2', 'black-forest-labs/flux-kontext-pro', 0.04),
  ('neandc', 'google/nano-banana', 0.039),
  ('neand3d', 'google/nano-banana', 0.039),
  ('handd', 'google/nano-banana', 0.039),
  ('editorial', 'google/nano-banana', 0.039),
  ('exaggerated', 'google/nano-banana', 0.039),
  ('coloured_pencil', 'bytedance/seedream-4', 0.04),
  ('watercolor', 'bytedance/seedream-4', 0.04),
  ('carc1', 'bytedance/seedream-4', 0.04),
  ('superhero', 'google/nano-banana', 0.039),
  ('villian', 'google/nano-banana', 0.039),
  ('cyborg', 'google/nano-banana', 0.039)
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
