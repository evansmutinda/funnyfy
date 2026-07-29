import { STYLE_CATEGORIES, getStyleCategory } from './styleCategories';

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

export function resolveCategoryLabel(style) {
  if (!style) return null;
  const categoryId = style.categoryId || getStyleCategory(style.id);
  if (!categoryId) return null;
  return STYLE_CATEGORIES.find((cat) => cat.id === categoryId)?.label || null;
}

/** Singular phrase for "Creating your …" (e.g. paintings → painting). */
const CATEGORY_CREATING_NAME = {
  caricatures: 'caricature',
  cartoons: 'cartoon',
  paintings: 'painting',
  '3d-characters': '3D character',
  'anime-manga': 'anime',
  'stickers-emojis': 'sticker',
  'drawings-sketches': 'drawing',
  historical: 'historical portrait',
  art: 'artwork',
  professions: 'portrait',
  'seasonal-events': 'seasonal portrait',
  tinyme: 'TinyMe look',
  'moods-moments': 'mood portrait',
};

export function resolveCategoryCreatingPhrase(style) {
  if (!style) return 'look';
  const categoryId = style.categoryId || getStyleCategory(style.id);
  if (categoryId && CATEGORY_CREATING_NAME[categoryId]) {
    return CATEGORY_CREATING_NAME[categoryId];
  }
  const label = resolveCategoryLabel(style);
  if (!label) return 'look';
  const lower = label.toLowerCase();
  if (lower.endsWith(' characters')) return lower.replace(/ characters$/, ' character');
  if (lower.endsWith(' games')) return lower.replace(/ games$/, ' game');
  if (lower.endsWith('s') && !lower.endsWith('ss')) return lower.slice(0, -1);
  return lower;
}

function getCreatingTitle(phrase) {
  const name = phrase || 'look';
  return `Creating your ${name}`;
}

function getQueueCopy(job) {
  const ahead = job.queuePosition ?? 0;
  const wait = formatEstimatedWait(job.estimatedWaitTime);

  if (ahead <= 0) {
    return {
      subtitle: 'Starting soon…',
      statusHint: wait ? `Usually begins within ${wait}` : 'Preparing to start…',
    };
  }

  return {
    subtitle: 'In the queue…',
    statusHint: wait
      ? `About ${wait} · ${ahead} job${ahead === 1 ? '' : 's'} ahead`
      : `${ahead} job${ahead === 1 ? '' : 's'} ahead of you`,
  };
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
export function getJobProgressCopy(job, { creatingPhrase, loading, now = Date.now() }) {
  const title = getCreatingTitle(creatingPhrase);

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
    const queueCopy = getQueueCopy(job);
    return {
      title,
      subtitle: queueCopy.subtitle,
      phaseIndex: 1,
      statusHint: queueCopy.statusHint,
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
      subtitle: 'Generating…',
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
