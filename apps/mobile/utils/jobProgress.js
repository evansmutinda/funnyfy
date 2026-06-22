export const JOB_PROGRESS_PHASE_COUNT = 4;

/** How long to show the moderation step once server processing starts. */
export const MODERATION_PHASE_MS = 6000;

export function formatEstimatedWait(seconds) {
  if (seconds == null || seconds <= 0) return null;
  const rounded = Math.round(seconds);
  if (rounded < 60) return `~${rounded}s`;
  const mins = Math.ceil(rounded / 60);
  return mins === 1 ? '~1 min' : `~${mins} min`;
}

function getCreatingTitle(styleLabel) {
  const name = styleLabel || 'caricature';
  return `Creating your ${name}`;
}

function isModerationPhase(job, now = Date.now()) {
  if (job?.status !== 'processing') return false;
  const startedAt = job.startedAt ? new Date(job.startedAt).getTime() : null;
  if (!startedAt || Number.isNaN(startedAt)) return true;
  return now - startedAt < MODERATION_PHASE_MS;
}

/**
 * Maps live job status (from /api/job poll) to user-facing loading copy.
 * phaseIndex: 0 = submit, 1 = queue, 2 = moderation, 3 = generating
 */
export function getJobProgressCopy(job, { styleLabel, loading, now = Date.now() }) {
  const title = getCreatingTitle(styleLabel);

  if (!loading) {
    return { title, subtitle: '', phaseIndex: 0, statusHint: '' };
  }

  if (!job?.status) {
    return {
      title,
      subtitle: 'Submitting your photo…',
      phaseIndex: 0,
      statusHint: 'Uploading to our servers…',
    };
  }

  const status = job.status;

  if (status === 'pending') {
    const ahead = job.queuePosition ?? 0;
    const subtitle = ahead <= 0 ? "You're up next…" : 'Queued — waiting to start…';
    return {
      title,
      subtitle,
      phaseIndex: 1,
      statusHint: 'Hang tight while we get things ready…',
    };
  }

  if (status === 'processing' || status === 'queued') {
    if (isModerationPhase(job, now)) {
      return {
        title,
        subtitle: 'Checking content guidelines…',
        phaseIndex: 2,
        statusHint: 'Reviewing your photo before we begin.',
      };
    }
    return {
      title,
      subtitle: 'Generating your caricature…',
      phaseIndex: 3,
      statusHint: 'This may take a little while…',
    };
  }

  if (status === 'completed') {
    return {
      title,
      subtitle: 'Wrapping up…',
      phaseIndex: 3,
      statusHint: 'Preparing your preview…',
    };
  }

  return {
    title,
    subtitle: 'Working on it…',
    phaseIndex: 3,
    statusHint: 'Hang tight!',
  };
}
