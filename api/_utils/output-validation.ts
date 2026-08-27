/**
 * Validate Replicate (or CDN) output URLs before marking a job completed.
 * Catches empty / tiny / non-image payloads that would otherwise look like success.
 */

export const BLANK_OUTPUT_CODE = 'BLANK_OR_UNLOADABLE_OUTPUT';
export const BLANK_OUTPUT_MESSAGE =
  "Your image came back blank. Tap Try again — this one didn't use up any of your images.";

/** Tiny / empty files are almost never a real generated image. */
export const MIN_OUTPUT_BYTES = 5_000;

const FETCH_TIMEOUT_MS = 20_000;

function looksLikeImage(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return true;
  }
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return true;
  }
  // WebP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return true;
  }
  return false;
}

export type OutputValidationResult =
  | { ok: true; byteLength: number }
  | { ok: false; reason: string; byteLength?: number; httpStatus?: number };

/**
 * Download enough of the output to verify it is a real image of minimum size.
 * Does not catch large all-white images — only empty/tiny/corrupt/non-image payloads.
 */
export async function validateOutputImageUrl(url: string): Promise<OutputValidationResult> {
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return { ok: false, reason: 'missing_or_invalid_url' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'image/*,*/*' },
    });

    if (!res.ok) {
      return { ok: false, reason: 'http_error', httpStatus: res.status };
    }

    const headerLen = Number(res.headers.get('content-length') || 0);
    if (headerLen > 0 && headerLen < MIN_OUTPUT_BYTES) {
      return { ok: false, reason: 'too_small', byteLength: headerLen };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const byteLength = buf.byteLength;

    if (byteLength < MIN_OUTPUT_BYTES) {
      return { ok: false, reason: 'too_small', byteLength };
    }

    if (!looksLikeImage(buf.subarray(0, 16))) {
      return { ok: false, reason: 'not_an_image', byteLength };
    }

    return { ok: true, byteLength };
  } catch (err: any) {
    const aborted = err?.name === 'AbortError';
    return {
      ok: false,
      reason: aborted ? 'timeout' : 'fetch_failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

export function blankOutputErrorMessage(detail?: string): string {
  const suffix = detail ? `: ${detail}` : '';
  return `${BLANK_OUTPUT_CODE}${suffix}`.slice(0, 1000);
}
