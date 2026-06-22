/** User-facing job error copy (mirrors apps/mobile/utils/contentErrors.js). */

export function humanizeJobError(message: string | null | undefined): string | null {
  const raw = String(message || '').trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();

  if (
    lower.includes('content_not_allowed') ||
    lower.includes('nsfw') ||
    lower.includes('cannot be processed') ||
    lower.includes('appropriate')
  ) {
    return 'This photo violates our content policy. Please choose an appropriate image.';
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
