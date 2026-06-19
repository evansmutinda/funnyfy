/**
 * Parse subscription timestamps from API / RevenueCat without UTC date-only shifts.
 */
export function parseSubscriptionDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const str = String(value).trim();
  if (!str) return null;

  // Date-only (Postgres DATE or YYYY-MM-DD) → local calendar day
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }

  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatSubscriptionDate(value) {
  const d = parseSubscriptionDate(value);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function addCalendarMonth(date) {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Best-effort next renewal for display. Prefers RevenueCat expiration, then DB periodEnd.
 * If stored end is on/before period start (or today for an active sub), advances one billing month.
 */
export function getDisplayRenewalDate(subscription, revenueCatExpiration) {
  const today = startOfLocalDay();
  const candidates = [];

  if (revenueCatExpiration) candidates.push(parseSubscriptionDate(revenueCatExpiration));

  if (subscription?.renewalDate) {
    candidates.push(parseSubscriptionDate(subscription.renewalDate));
  }
  if (subscription?.periodEnd) {
    candidates.push(parseSubscriptionDate(subscription.periodEnd));
  }

  const periodStart = parseSubscriptionDate(subscription?.periodStart);

  for (const raw of candidates) {
    if (!raw) continue;
    let renewal = raw;

    if (periodStart && renewal <= periodStart) {
      renewal = addCalendarMonth(periodStart);
    }

    while (renewal <= today && subscription?.status === 'active') {
      const bumped = addCalendarMonth(renewal);
      if (bumped.getTime() === renewal.getTime()) break;
      renewal = bumped;
    }

    return renewal;
  }

  if (periodStart) {
    let renewal = addCalendarMonth(periodStart);
    while (renewal <= today) renewal = addCalendarMonth(renewal);
    return renewal;
  }

  return null;
}
