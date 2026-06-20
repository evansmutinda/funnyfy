/** True when the API rejected the image for content moderation (Sightengine / NSFW). */
export function isNsfwContentError(message) {
  const lower = String(message || '').toLowerCase();
  return (
    lower.includes('content_not_allowed') ||
    lower.includes('nsfw') ||
    lower.includes('cannot be processed') ||
    lower.includes('appropriate')
  );
}

export const NSFW_REJECT_DIALOG = {
  title: 'Content not permitted',
  message:
    'This photo violates our content policy and cannot be processed. The upload has been recorded. Further violations may result in your account being suspended. Please use an appropriate photo only.',
  confirmLabel: 'Understood',
  hideCancel: true,
};

/** Short inline copy for error banners (never show raw API codes to users). */
export const NSFW_INLINE_MESSAGE =
  'This photo violates our content policy. Please choose an appropriate image.';

/** Map technical API / server messages to user-friendly copy. */
export function humanizeApiError(message) {
  const raw = String(message || '').trim();
  if (!raw) return 'Something went wrong. Please try again.';

  if (isNsfwContentError(raw)) {
    return NSFW_INLINE_MESSAGE;
  }

  if (raw.toLowerCase().includes('network request failed') || raw.toLowerCase().includes('failed to fetch')) {
    return 'Check your internet connection and try again.';
  }

  if (raw.toLowerCase().includes('timeout')) {
    return 'That took too long. Please try again.';
  }

  // Drop technical ERROR_CODE: prefixes if the remainder is still jargon
  if (/^[A-Z][A-Z0-9_]*:/.test(raw)) {
    const remainder = raw.replace(/^[A-Z][A-Z0-9_]*:\s*/, '').trim();
    if (remainder && isNsfwContentError(remainder)) {
      return NSFW_INLINE_MESSAGE;
    }
  }

  return raw;
}
