// Per-generation billing: rates + finalize on job completion

import { query } from './db';
import { getStyleById } from './styles-config';
import { getModelCost, recordJobCost } from './cost-protection';

export function getModelDisplayLabel(modelVersion: string | null): string {
  const m = (modelVersion || '').toLowerCase();
  if (!m) return 'Unknown';
  if (m.includes('nano-banana-2')) return 'Nano Banana 2';
  if (m.includes('nano-banana')) return 'Nano Banana';
  if (m.includes('seedream-4.5')) return 'Seedream 4.5';
  if (m.includes('seedream-4')) return 'Seedream 4';
  if (m.includes('flux')) return 'Flux Kontext Pro';
  return modelVersion || 'Unknown';
}

/** Snapshot cost on terminal job state. Completed = model rate; failed = $0. */
export async function finalizeJobCost(
  jobId: string,
  styleId: string | null,
  outcome: 'completed' | 'failed'
): Promise<void> {
  try {
    const style = styleId ? getStyleById(styleId) : null;
    const model = style?.model ?? null;
    const cost = outcome === 'completed' && model ? getModelCost(model) : 0;

    const existing = await query<{ cost_usd: number; status: string }>(
      `SELECT cost_usd, status FROM jobs WHERE id = $1`,
      [jobId]
    );
    const row = existing.rows[0];
    if (!row) return;
    if (row.status === 'completed' && Number(row.cost_usd) > 0) return;

    await query(`UPDATE jobs SET cost_usd = $1, model_version = $2 WHERE id = $3`, [cost, model, jobId]);

    if (outcome === 'completed' && cost > 0 && model) {
      await recordJobCost(jobId, model, cost);
    }
  } catch (err) {
    console.error('[job-cost] finalizeJobCost failed:', jobId, err);
  }
}
