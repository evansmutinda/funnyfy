import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { isNsfwContentError, NSFW_INLINE_MESSAGE } from './contentErrors';

export { buildContentPolicyDialog } from './contentErrors';

const VIOLATION_LOG_KEY = '@funnyfy/content_violations';
const MAX_LOG_ENTRIES = 20;

export class ContentPolicyBlockedError extends Error {
  constructor({ userMessage, infringementCount, errorMessage, jobId, styleId, source } = {}) {
    super(userMessage || NSFW_INLINE_MESSAGE);
    this.name = 'ContentPolicyBlockedError';
    this.infringementCount = infringementCount ?? null;
    this.rawErrorMessage = errorMessage || null;
    this.jobId = jobId || null;
    this.styleId = styleId || null;
    this.source = source || null;
  }
}

export function isContentPolicyError(err) {
  if (!err) return false;
  if (err.name === 'ContentPolicyBlockedError') return true;
  if (err.payload?.contentPolicyBlocked) return true;
  return isNsfwContentError(err.message);
}

export function isJobContentPolicyBlocked(jobInfo) {
  if (!jobInfo) return false;
  if (jobInfo.contentPolicyBlocked === true) return true;
  return isNsfwContentError(jobInfo.errorMessage || jobInfo.userMessage);
}

export async function recordContentViolation({
  jobId = null,
  styleId = null,
  source = 'unknown',
  rawMessage = null,
  infringementCount = null,
} = {}) {
  const entry = {
    at: new Date().toISOString(),
    jobId,
    styleId,
    source,
    infringementCount,
    rawMessage: rawMessage ? String(rawMessage).slice(0, 240) : null,
  };

  try {
    const raw = await AsyncStorage.getItem(VIOLATION_LOG_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list)) {
      list.unshift(entry);
      await AsyncStorage.setItem(
        VIOLATION_LOG_KEY,
        JSON.stringify(list.slice(0, MAX_LOG_ENTRIES))
      );
    }
  } catch (err) {
    console.warn('[contentViolations] Failed to persist local log:', err?.message || err);
  }

  if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      category: 'moderation',
      message: 'content_policy_blocked',
      level: 'info',
      data: entry,
    });
    Sentry.captureMessage('content_policy_blocked', {
      level: 'info',
      tags: { source: String(source) },
      extra: entry,
    });
  }
}

export async function getContentViolationLog() {
  try {
    const raw = await AsyncStorage.getItem(VIOLATION_LOG_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
