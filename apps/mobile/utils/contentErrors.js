/** True when the API rejected the image for content moderation (Sightengine / Replicate). */
export function isNsfwContentError(message) {
  const lower = String(message || '').toLowerCase();
  return (
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
    lower.includes('violat') ||
    lower.includes("can't be used") ||
    lower.includes('couldn\'t use this photo')
  );
}

/** Friendlier dialog copy; only mentions account limits after repeat flags. */
export function buildContentPolicyDialog(infringementCount = 0) {
  let message =
    "We couldn't use this photo for a caricature. Sometimes lighting, clothing, or background triggers a false alarm — please try a different photo.";

  if (infringementCount >= 2) {
    message +=
      ' If flagged uploads keep happening, we may need to limit account access.';
  }

  return {
    title: "This photo can't be used",
    message,
    confirmLabel: 'Got it',
    hideCancel: true,
  };
}

export const NSFW_REJECT_DIALOG = buildContentPolicyDialog(0);

/** Short inline copy for error banners (never show raw API codes to users). */
export const NSFW_INLINE_MESSAGE =
  "This photo couldn't be used. Try a different picture — false alarms happen sometimes.";

const GENERIC_RETRY = 'Something went wrong. Please try again.';
const GENERATION_RETRY = "We couldn't create your caricature this time. Please try again.";
const GENERATION_SOFT = 'Something went wrong while creating your caricature. Please try again.';

/**
 * Map technical API / server messages to user-friendly copy.
 * Prefer job.userMessage from GET /api/job when available.
 */
export function humanizeApiError(message) {
  const raw = String(message || '').trim();
  if (!raw) return GENERIC_RETRY;

  if (isNsfwContentError(raw)) {
    return NSFW_INLINE_MESSAGE;
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes('invalid response') ||
    lower.includes('non-json') ||
    lower.includes('unexpected token')
  ) {
    return 'We had trouble talking to the server. Tap Try again — your caricature may still be processing.';
  }

  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror')
  ) {
    return 'Check your internet connection and try again.';
  }

  if (lower.includes('job_output_expired') || lower.includes('prediction expired')) {
    return 'Your caricature took too long to retrieve. Please generate again — failed runs are not billed.';
  }

  if (lower.includes('job_stuck') || lower.includes('worker interrupted')) {
    return 'Generation was interrupted. Tap Try again — we will pick up where it left off.';
  }

  if (lower.includes('timed out') || lower.includes('timeout') || lower.includes('job_poll_timeout')) {
    return 'This is taking longer than usual. Tap Try again — we may still be finishing your caricature.';
  }

  if (lower.includes('authentication_required') || lower.includes('auth')) {
    return 'Your session expired. Close and reopen the app, then try again.';
  }

  if (lower.includes('quota') || lower.includes('trial_expired')) {
    return raw.replace(/^[A-Z][A-Z0-9_]*:\s*/, '') || 'You have reached your generation limit.';
  }

  if (lower.includes('invalid_style_id') || lower.includes('invalid styleid')) {
    return 'This style is not on staging yet. Redeploy funnyfy-staging to sync the latest styles.';
  }

  if (
    lower.includes('replicate did not return an image') ||
    lower.includes('replicate generation failed') ||
    lower.includes('replicate api error') ||
    lower.startsWith('replicate failed') ||
    lower.startsWith('replicate canceled') ||
    lower.startsWith('replicate cancelled')
  ) {
    if (isNsfwContentError(raw)) {
      return NSFW_INLINE_MESSAGE;
    }
    return GENERATION_RETRY;
  }

  if (lower.includes('image generation failed') || lower.includes('generation failed')) {
    return GENERATION_SOFT;
  }

  if (lower.includes('no job id')) {
    return 'We could not start your caricature. Please go back and tap Generate again.';
  }

  if (/^[A-Z][A-Z0-9_]*:/.test(raw)) {
    const remainder = raw.replace(/^[A-Z][A-Z0-9_]*:\s*/, '').trim();
    if (remainder && isNsfwContentError(remainder)) {
      return NSFW_INLINE_MESSAGE;
    }
    if (remainder && remainder.length < 120 && !remainder.startsWith('{')) {
      return humanizeApiError(remainder);
    }
    return GENERATION_RETRY;
  }

  if (raw.length > 160 || raw.startsWith('{') || raw.startsWith('http')) {
    return GENERATION_RETRY;
  }

  if (lower.includes('failed to check job status') || lower.includes('http 5')) {
    return 'The server is busy. Tap Try again in a moment.';
  }

  return raw;
}

/** Prefer server-provided copy from GET /api/job. */
export function jobErrorMessage(jobInfo) {
  if (!jobInfo) return GENERATION_SOFT;
  if (jobInfo.userMessage) return jobInfo.userMessage;
  return humanizeApiError(jobInfo.errorMessage || 'Image generation failed');
}
