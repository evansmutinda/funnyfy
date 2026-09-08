export const TIER_NAMES = {
  starter: 'Starter',
  popular: 'Popular',
  pro: 'Pro',
};

const TIER_RANK = {
  starter: 0,
  popular: 1,
  pro: 2,
};

export function getTierName(tier) {
  if (!tier) return '';
  return TIER_NAMES[tier] || tier;
}

export function isSubscriptionDowngrade(currentTier, nextTier) {
  if (!currentTier || !nextTier) return false;
  const from = TIER_RANK[currentTier];
  const to = TIER_RANK[nextTier];
  if (from == null || to == null) return false;
  return to < from;
}
