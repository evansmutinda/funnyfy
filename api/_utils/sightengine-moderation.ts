/**
 * Sightengine multi-model content moderation + shared content-policy helpers.
 * Blocks nudity, violence, weapons, gore/death, hate, and self-harm.
 */

import { query } from './db';
import { finalizeJobCost } from './job-cost';

export const CONTENT_NOT_ALLOWED_CODE = 'CONTENT_NOT_ALLOWED';
export const CONTENT_NOT_ALLOWED_MESSAGE = `${CONTENT_NOT_ALLOWED_CODE}: sightengine`;

export function contentPolicyErrorMessage(source: 'sightengine' | 'replicate' = 'sightengine'): string {
  return `${CONTENT_NOT_ALLOWED_CODE}: ${source}`;
}

export function getContentPolicySource(message: string | null | undefined): 'sightengine' | 'replicate' | null {
  if (!isContentPolicyError(message)) return null;
  const lower = String(message || '').toLowerCase();
  if (lower.includes(': replicate') || isReplicateContentPolicyError(message)) return 'replicate';
  return 'sightengine';
}

/** Models checked in a single Sightengine request. */
export const SIGHTENGINE_MODELS =
  'nudity-2.1,gore-2.0,weapon,violence,offensive-2.0,self-harm';

const DEFAULT_THRESHOLD = 0.3;
const VERY_SUGGESTIVE_THRESHOLD = 0.5;
const WEAPON_TOY_OVERRIDE = 0.7;
export const INFRINGEMENT_BAN_THRESHOLD = 3;

export interface ModerationViolation {
  category: string;
  field: string;
  score: number;
}

export interface ModerationResult {
  allowed: boolean;
  violations: ModerationViolation[];
}

function threshold(name: string, fallback = DEFAULT_THRESHOLD): number {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function scoreAtOrAbove(value: unknown, limit: number): value is number {
  return typeof value === 'number' && value >= limit;
}

function addViolation(
  violations: ModerationViolation[],
  category: string,
  field: string,
  score: number
) {
  violations.push({ category, field, score });
}

const SWIMWEAR_CLASSES = ['bikini', 'swimwear_one_piece', 'swimwear_male'] as const;

/** True when bikini / swimwear is the dominant suggestive signal (not lingerie/underwear). */
function isAllowedSwimwear(nudity: Record<string, unknown>): boolean {
  const suggestiveClasses = nudity.suggestive_classes as Record<string, unknown> | undefined;
  if (!suggestiveClasses) return false;

  const swimwearScore = Math.max(
    0,
    ...SWIMWEAR_CLASSES.map((field) =>
      typeof suggestiveClasses[field] === 'number' ? (suggestiveClasses[field] as number) : 0
    )
  );
  if (swimwearScore < 0.25) return false;

  const lingerie =
    typeof suggestiveClasses.lingerie === 'number' ? suggestiveClasses.lingerie : 0;
  const visiblyUndressed =
    typeof suggestiveClasses.visibly_undressed === 'number'
      ? suggestiveClasses.visibly_undressed
      : 0;

  return swimwearScore >= lingerie && swimwearScore >= visiblyUndressed;
}

function explicitNudityScore(nudity: Record<string, unknown>): number {
  const activity = typeof nudity.sexual_activity === 'number' ? nudity.sexual_activity : 0;
  const display = typeof nudity.sexual_display === 'number' ? nudity.sexual_display : 0;
  return Math.max(activity, display);
}

/** Evaluate a Sightengine check.json response. */
export function evaluateModerationResponse(data: unknown): ModerationResult {
  const violations: ModerationViolation[] = [];
  const body = data as Record<string, unknown>;

  const nudity = body.nudity as Record<string, unknown> | undefined;
  if (nudity) {
    const t = threshold('MODERATION_NUDITY_THRESHOLD');
    const swimwearOk = isAllowedSwimwear(nudity);

    const explicitFields = ['sexual_activity', 'sexual_display'] as const;
    for (const field of explicitFields) {
      const score = nudity[field];
      if (scoreAtOrAbove(score, t)) {
        addViolation(violations, 'nudity', field, score);
      }
    }

    const erotica = nudity.erotica;
    if (
      scoreAtOrAbove(erotica, t) &&
      !(swimwearOk && explicitNudityScore(nudity) < t)
    ) {
      addViolation(violations, 'nudity', 'erotica', erotica);
    }

    const verySuggestive = nudity.very_suggestive;
    if (
      scoreAtOrAbove(
        verySuggestive,
        threshold('MODERATION_VERY_SUGGESTIVE_THRESHOLD', VERY_SUGGESTIVE_THRESHOLD)
      ) &&
      !swimwearOk
    ) {
      addViolation(violations, 'nudity', 'very_suggestive', verySuggestive);
    }

    const suggestiveClasses = nudity.suggestive_classes as Record<string, unknown> | undefined;
    const sextoy = suggestiveClasses?.sextoy;
    if (scoreAtOrAbove(sextoy, t)) {
      addViolation(violations, 'nudity', 'sextoy', sextoy);
    }
  }

  const gore = body.gore as
    | { prob?: number; classes?: Record<string, number> }
    | undefined;
  if (gore) {
    const t = threshold('MODERATION_GORE_THRESHOLD');
    const goreFields = [
      'very_bloody',
      'body_organ',
      'serious_injury',
      'corpse',
      'skull',
    ] as const;
    for (const field of goreFields) {
      const score = gore.classes?.[field];
      if (scoreAtOrAbove(score, t)) {
        addViolation(violations, 'gore', field, score);
      }
    }
    if (violations.every((v) => v.category !== 'gore') && scoreAtOrAbove(gore.prob, t)) {
      addViolation(violations, 'gore', 'prob', gore.prob);
    }
  }

  const weapon = body.weapon as
    | { classes?: Record<string, number> }
    | undefined;
  if (weapon?.classes) {
    const t = threshold('MODERATION_WEAPON_THRESHOLD');
    const firearm = weapon.classes.firearm;
    const firearmToy = weapon.classes.firearm_toy ?? 0;
    if (scoreAtOrAbove(firearm, t) && firearmToy < WEAPON_TOY_OVERRIDE) {
      addViolation(violations, 'weapon', 'firearm', firearm);
    }
    const knife = weapon.classes.knife;
    if (scoreAtOrAbove(knife, t)) {
      addViolation(violations, 'weapon', 'knife', knife);
    }
  }

  const violence = body.violence as
    | { classes?: Record<string, number> }
    | undefined;
  if (violence?.classes) {
    const t = threshold('MODERATION_VIOLENCE_THRESHOLD');
    const violenceFields = ['physical_violence', 'firearm_threat'] as const;
    for (const field of violenceFields) {
      const score = violence.classes[field];
      if (scoreAtOrAbove(score, t)) {
        addViolation(violations, 'violence', field, score);
      }
    }
  }

  const offensive = body.offensive as Record<string, number> | undefined;
  if (offensive) {
    const t = threshold('MODERATION_OFFENSIVE_THRESHOLD');
    const hateFields = [
      'nazi',
      'terrorist',
      'confederate',
      'supremacist',
      'asian_swastika',
    ] as const;
    for (const field of hateFields) {
      const score = offensive[field];
      if (scoreAtOrAbove(score, t)) {
        addViolation(violations, 'offensive', field, score);
      }
    }
  }

  const selfHarm = body['self-harm'] as { prob?: number } | undefined;
  if (selfHarm && scoreAtOrAbove(selfHarm.prob, threshold('MODERATION_SELF_HARM_THRESHOLD'))) {
    addViolation(violations, 'self-harm', 'prob', selfHarm.prob);
  }

  return { allowed: violations.length === 0, violations };
}

/**
 * Input moderation at enqueue — blocks before a job row exists or Replicate is called.
 * On violation, records infringement (no job to fail).
 */
export async function moderateEnqueueImage(
  imageUrl: string,
  userId: string
): Promise<ModerationResult | null> {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;
  if (!imageUrl || !apiUser || !apiSecret) return null;

  try {
    const moderation = await checkImageWithSightengine(imageUrl, apiUser, apiSecret);
    if (moderation && !moderation.allowed) {
      await recordContentInfringement(userId, {
        source: 'sightengine',
        violations: moderation.violations,
        stage: 'enqueue',
      });
    }
    return moderation;
  } catch (modErr) {
    console.warn('[enqueue] Sightengine check failed (proceeding):', modErr);
    return null;
  }
}

export async function checkImageWithSightengine(
  base64DataUrl: string,
  apiUser: string,
  apiSecret: string
): Promise<ModerationResult | null> {
  const base64Match = base64DataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!base64Match) return null;

  const mime = base64Match[1];
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const buffer = Buffer.from(base64Match[2], 'base64');
  const blob = new Blob([buffer], { type: mime });
  const form = new FormData();
  form.append('media', blob, `image.${ext}`);
  form.append('models', SIGHTENGINE_MODELS);
  form.append('api_user', apiUser);
  form.append('api_secret', apiSecret);

  const modRes = await fetch('https://api.sightengine.com/1.0/check.json', {
    method: 'POST',
    body: form,
  });
  const modData = await modRes.json().catch(() => ({}));

  if (!modRes.ok || (modData as { status?: string }).status === 'failure') {
    throw new Error(
      `Sightengine HTTP ${modRes.status}: ${JSON.stringify(modData).slice(0, 200)}`
    );
  }

  return evaluateModerationResponse(modData);
}

export function isReplicateContentPolicyError(message: string | null | undefined): boolean {
  const lower = String(message || '').toLowerCase();
  return (
    lower.includes('e005') ||
    lower.includes('flagged as sensitive') ||
    lower.includes('input or output was flagged') ||
    lower.includes('sensitive content') ||
    lower.includes('content policy') ||
    lower.includes('nsfw') ||
    lower.includes('not allowed') ||
    lower.includes('inappropriate') ||
    lower.includes('violat')
  );
}

export function isContentPolicyError(message: string | null | undefined): boolean {
  const lower = String(message || '').toLowerCase();
  return (
    lower.includes('content_not_allowed') ||
    isReplicateContentPolicyError(message)
  );
}

export function normalizeGenerationErrorMessage(message: string): string {
  if (isReplicateContentPolicyError(message)) {
    return contentPolicyErrorMessage('replicate');
  }
  return message;
}

export async function recordContentInfringement(
  userId: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    await query(
      `INSERT INTO infringements (user_id, infringement_type, details)
       VALUES ($1, 'nsfw', $2)`,
      [userId, JSON.stringify(details)]
    );
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM infringements WHERE user_id = $1`,
      [userId]
    );
    const infCount = parseInt(countResult.rows[0]?.count ?? '0', 10);
    if (infCount >= INFRINGEMENT_BAN_THRESHOLD) {
      await query(`UPDATE users SET banned_at = NOW() WHERE id = $1`, [userId]);
    }
  } catch (err) {
    console.error('[sightengine-moderation] Failed to record infringement:', err);
  }
}

export async function failJobContentNotAllowed(
  jobId: string,
  source: 'sightengine' | 'replicate' = 'sightengine'
): Promise<void> {
  await query(
    `UPDATE jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2`,
    [contentPolicyErrorMessage(source), jobId]
  );
  const jobRow = await query<{ style_id: string }>(`SELECT style_id FROM jobs WHERE id = $1`, [jobId]);
  await finalizeJobCost(jobId, jobRow.rows[0]?.style_id ?? null, 'failed');
}

export async function handleContentPolicyViolation(
  jobId: string,
  userId: string | null,
  details: Record<string, unknown>
): Promise<void> {
  if (userId) {
    await recordContentInfringement(userId, details);
  }
  const source = details.source === 'replicate' ? 'replicate' : 'sightengine';
  await failJobContentNotAllowed(jobId, source);
}
