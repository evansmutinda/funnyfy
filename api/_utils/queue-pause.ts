/**
 * Queue pause for operator-side Replicate billing / credit exhaustion.
 * Users see a generic "temporarily unavailable" message — never billing details.
 */

import { query } from './db';
import { logSecurityEvent } from './security-logging';

export const GENERATION_UNAVAILABLE_CODE = 'GENERATION_UNAVAILABLE';
export const GENERATION_UNAVAILABLE_MESSAGE =
  'Generation is temporarily unavailable. Please try again later.';

const SETTINGS_KEY = 'replicate_billing_pause';

export type BillingPauseState = {
  paused: boolean;
  reason?: string;
  pausedAt?: string;
  rawError?: string;
  source?: string;
};

async function ensureAppSettingsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/** Detect Replicate 402 / credit / billing errors (operator account, not end users). */
export function isReplicateBillingError(message: string | null | undefined): boolean {
  const lower = String(message || '').toLowerCase();
  if (!lower) return false;
  return (
    lower.includes('payment required') ||
    lower.includes('"status":402') ||
    lower.includes('status 402') ||
    lower.includes('insufficient credit') ||
    lower.includes('insufficient funds') ||
    lower.includes('spend limit') ||
    lower.includes('monthly spend limit') ||
    lower.includes('set up billing') ||
    lower.includes('prepaid credit') ||
    lower.includes('credit balance') ||
    lower.includes('account/billing') ||
    lower.includes('you have no credit') ||
    lower.includes('out of credit') ||
    lower.includes('billing#billing') ||
    lower.includes('billing#limits')
  );
}

export async function getBillingPauseState(): Promise<BillingPauseState> {
  try {
    await ensureAppSettingsTable();
    const result = await query<{ value: BillingPauseState }>(
      `SELECT value FROM app_settings WHERE key = $1`,
      [SETTINGS_KEY]
    );
    const value = result.rows[0]?.value;
    if (!value || typeof value !== 'object') {
      return { paused: false };
    }
    return {
      paused: Boolean(value.paused),
      reason: value.reason,
      pausedAt: value.pausedAt,
      rawError: value.rawError,
      source: value.source,
    };
  } catch (err) {
    console.error('[queue-pause] Failed to read billing pause state:', err);
    return { paused: false };
  }
}

export async function pauseQueueForReplicateBilling(
  rawError: string,
  source = 'replicate'
): Promise<void> {
  const existing = await getBillingPauseState();
  if (existing.paused) {
    console.warn('[queue-pause] Already paused for Replicate billing');
    return;
  }

  const state: BillingPauseState = {
    paused: true,
    reason: 'Replicate billing / credits exhausted (operator)',
    pausedAt: new Date().toISOString(),
    rawError: String(rawError || '').slice(0, 1000),
    source,
  };

  try {
    await ensureAppSettingsTable();
    await query(
      `
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `,
      [SETTINGS_KEY, JSON.stringify(state)]
    );
  } catch (err) {
    console.error('[queue-pause] Failed to persist billing pause:', err);
  }

  console.error('[queue-pause] QUEUE PAUSED — top up Replicate credits, then Resume in admin', {
    source,
    rawError: state.rawError,
  });

  await logSecurityEvent({
    eventType: 'replicate_billing_pause',
    success: false,
    details: {
      source,
      rawError: state.rawError,
      pausedAt: state.pausedAt,
      note: 'Operator must top up Replicate and resume queue from admin',
    },
  }).catch(() => {});
}

export async function clearBillingPause(clearedBy = 'admin'): Promise<boolean> {
  try {
    await ensureAppSettingsTable();
    await query(
      `
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `,
      [SETTINGS_KEY, JSON.stringify({ paused: false, clearedAt: new Date().toISOString(), clearedBy })]
    );

    console.log('[queue-pause] Billing pause cleared by', clearedBy);

    await logSecurityEvent({
      eventType: 'replicate_billing_resume',
      success: true,
      details: { clearedBy },
    }).catch(() => {});

    return true;
  } catch (err) {
    console.error('[queue-pause] Failed to clear billing pause:', err);
    return false;
  }
}

export function generationUnavailableResponse() {
  return {
    ok: false as const,
    error: GENERATION_UNAVAILABLE_CODE,
    message: GENERATION_UNAVAILABLE_MESSAGE,
  };
}
