export function getTrialRemaining(subscriptionInfo) {
  if (!subscriptionInfo?.usage) return null;
  const { current, limit } = subscriptionInfo.usage;
  if (limit <= 0) return null;
  return Math.max(0, limit - current);
}

export function isTrialUser(subscriptionInfo) {
  return Boolean(subscriptionInfo?.isTrial || !subscriptionInfo?.subscription);
}

export function getTrialWarningMessage(remaining) {
  if (remaining === 1) {
    return '1 caricature left on your trial — tap to upgrade';
  }
  if (remaining === 2) {
    return '2 caricatures left on your trial';
  }
  return null;
}
