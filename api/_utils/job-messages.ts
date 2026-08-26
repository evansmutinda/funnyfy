/** User-facing job error copy (mirrors apps/mobile/utils/contentErrors.js). */

const CONTENT_POLICY_INLINE =
  "This photo couldn't be used. Try a different picture — false alarms happen sometimes.";

const GENERATION_UNAVAILABLE_MESSAGE =
  'Image generation is unavailable at the moment. Please try again in a few minutes.';

function isProviderOutageError(lower: string): boolean {
  return (
    lower.includes('internal server error') ||
    lower.includes('service unavailable') ||
    lower.includes('bad gateway') ||
    lower.includes('gateway timeout') ||
    /"status"\s*:\s*50[0234]/.test(lower)
  );
}

export function humanizeJobError(message: string | null | undefined): string | null {
  const raw = String(message || '').trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();

  if (isProviderOutageError(lower)) {
    return GENERATION_UNAVAILABLE_MESSAGE;
  }

  if (
    lower.includes('content_not_allowed') ||
    lower.includes('nsfw') ||
    lower.includes('cannot be processed') ||
    lower.includes('appropriate') ||
    lower.includes('e005') ||
    lower.includes('flagged as sensitive') ||
    lower.includes('input or output was flagged') ||
    lower.includes('sensitive content') ||
    lower.includes('content policy') ||
    lower.includes('inappropriate') ||
    lower.includes('violat')
  ) {
    return CONTENT_POLICY_INLINE;
  }

  if (lower.includes('blank_or_unloadable_output') || lower.includes('came back empty')) {
    return 'The caricature came back empty or could not be loaded. Please try again — you were not charged.';
  }

  if (lower.includes('generation_unavailable') || lower.includes('temporarily unavailable')) {
    return GENERATION_UNAVAILABLE_MESSAGE;
  }

  if (lower.includes('job_output_expired') || lower.includes('prediction expired')) {
    return 'Your caricature took too long to retrieve. Please generate again — failed runs are not billed.';
  }

  if (lower.includes('job_stuck') || lower.includes('worker interrupted')) {
    return 'Generation was interrupted. Tap Try again — we will pick up where it left off.';
  }

  if (
    lower.includes('replicate did not return an image') ||
    lower.includes('replicate generation failed') ||
    lower.includes('replicate api error') ||
    lower.startsWith('replicate failed') ||
    lower.startsWith('replicate canceled') ||
    lower.startsWith('replicate cancelled')
  ) {
    if (
      lower.includes('e005') ||
      lower.includes('flagged as sensitive') ||
      lower.includes('sensitive content') ||
      lower.includes('content policy')
    ) {
      return CONTENT_POLICY_INLINE;
    }
    return "We couldn't create your caricature this time. Please try again.";
  }

  if (lower.includes('image generation failed') || lower.includes('generation failed')) {
    return 'Something went wrong while creating your caricature. Please try again.';
  }

  if (lower.includes('quota') || lower.includes('trial_expired')) {
    return raw.replace(/^[A-Z][A-Z0-9_]*:\s*/, '');
  }

  if (/^[A-Z][A-Z0-9_]*:/.test(raw)) {
    const remainder = raw.replace(/^[A-Z][A-Z0-9_]*:\s*/, '').trim();
    if (remainder.length > 0 && remainder.length < 120 && !remainder.startsWith('{')) {
      return humanizeJobError(remainder) || remainder;
    }
    return 'Something went wrong. Please try again.';
  }

  if (raw.length > 160 || raw.startsWith('{')) {
    return "We couldn't create your caricature this time. Please try again.";
  }

  return raw;
}
