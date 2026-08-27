/** Remaining quota at or below this fraction triggers low-usage styling. */
export const USAGE_LOW_REMAINING_RATIO = 0.1;

export function getUsageQuotaInfo(subscriptionInfo) {
  if (!subscriptionInfo?.usage) {
    return {
      current: 0,
      limit: 0,
      percentage: 0,
      remaining: 0,
      isLow: false,
      isExceeded: false,
    };
  }

  const { current, limit } = subscriptionInfo.usage;
  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  const remaining = Math.max(0, limit - current);
  const isExceeded = limit > 0 && current >= limit;
  const remainingRatio = limit > 0 ? remaining / limit : 1;
  // Stay amber when exhausted so the warning doesn't flip to default white until recharge
  const isLow = isExceeded || remainingRatio <= USAGE_LOW_REMAINING_RATIO;

  return {
    current,
    limit,
    percentage,
    remaining,
    isLow,
    isExceeded,
  };
}
