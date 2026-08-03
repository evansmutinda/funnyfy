import { jobErrorMessage } from './contentErrors';
import { ContentPolicyBlockedError, isJobContentPolicyBlocked } from './contentViolations';

const TERMINAL_STATUSES = new Set(['completed', 'failed']);
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90;

/** Failed generation with friendly UI copy + raw backend error for Sentry. */
export class GenerationFailedError extends Error {
  constructor({ userMessage, errorMessage, jobId, styleId } = {}) {
    super(userMessage || jobErrorMessage({ errorMessage, userMessage }));
    this.name = 'GenerationFailedError';
    this.rawErrorMessage = errorMessage || null;
    this.jobId = jobId || null;
    this.styleId = styleId || null;
  }
}

/**
 * Poll GET /api/job until completed, failed, or timeout.
 * Each poll may trigger server-side Replicate sync.
 */
export async function pollJobUntilDone({ apiBase, jobId, getApiHeaders, onUpdate }) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const jobRes = await fetch(`${apiBase}/api/job?id=${encodeURIComponent(jobId)}`, {
      method: 'GET',
      headers: getApiHeaders(),
    });

    if (!jobRes.ok) {
      throw new Error(`Failed to check job status: HTTP ${jobRes.status}`);
    }

    const jobData = await jobRes.json();
    if (!jobData.ok) {
      throw new Error(jobData.error || 'Failed to check job status');
    }

    const jobInfo = jobData.job;
    if (onUpdate) onUpdate(jobInfo);

    if (TERMINAL_STATUSES.has(jobInfo.status)) {
      if (jobInfo.status === 'completed' && jobInfo.outputImageUrl) {
        return { ok: true, jobInfo, output: jobInfo.outputImageUrl };
      }
      if (isJobContentPolicyBlocked(jobInfo)) {
        throw new ContentPolicyBlockedError({
          userMessage: jobInfo.userMessage || jobErrorMessage(jobInfo),
          infringementCount: jobInfo.infringementCount ?? null,
          errorMessage: jobInfo.errorMessage,
          jobId: jobInfo.id,
          source: jobInfo.contentPolicySource || null,
        });
      }
      throw new GenerationFailedError({
        userMessage: jobErrorMessage(jobInfo),
        errorMessage: jobInfo.errorMessage,
        jobId: jobInfo.id,
        styleId: jobInfo.styleId || null,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('JOB_POLL_TIMEOUT: Generation is still in progress. Tap Try again.');
}

export { jobErrorMessage };
