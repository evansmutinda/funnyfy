import { jobErrorMessage } from './contentErrors';

const TERMINAL_STATUSES = new Set(['completed', 'failed']);
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90;

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
      throw new Error(jobErrorMessage(jobInfo));
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('JOB_POLL_TIMEOUT: Generation is still in progress. Tap Try again.');
}

export { jobErrorMessage };
