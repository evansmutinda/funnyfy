/**
 * Admin dashboard "calendar day" helpers.
 * Supabase/Postgres and Vercel default to UTC, so DATE(created_at) = CURRENT_DATE
 * under-counts relative to local ops days (e.g. Africa/Nairobi = UTC+3).
 *
 * Override with ADMIN_TIMEZONE (IANA name). Default: Africa/Nairobi.
 */

const DEFAULT_TZ = 'Africa/Nairobi';

export function getAdminTimeZone(): string {
  const raw = (process.env.ADMIN_TIMEZONE || DEFAULT_TZ).trim();
  return raw || DEFAULT_TZ;
}

/** YYYY-MM-DD for "today" in the admin timezone. */
export function getAdminTodayDate(now: Date = new Date()): string {
  return formatDateInTimeZone(now, getAdminTimeZone());
}

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Inclusive start / exclusive end timestamptz bounds for a calendar day in admin TZ.
 * Safe for index-friendly range filters on created_at / completed_at.
 */
export function getAdminDayBounds(now: Date = new Date()): {
  timeZone: string;
  date: string;
  startIso: string;
  endIso: string;
} {
  const timeZone = getAdminTimeZone();
  const date = formatDateInTimeZone(now, timeZone);
  const startIso = zonedDayStartToUtcIso(date, timeZone);
  const endDate = addCalendarDays(date, 1);
  const endIso = zonedDayStartToUtcIso(endDate, timeZone);
  return { timeZone, date, startIso, endIso };
}

function addCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

/**
 * Convert "YYYY-MM-DD 00:00:00" in `timeZone` to a UTC ISO string.
 * Uses a short iterative correction so DST edges stay correct.
 */
function zonedDayStartToUtcIso(ymd: string, timeZone: string): string {
  const [year, month, day] = ymd.split('-').map(Number);
  // First guess: treat the civil date as UTC midnight, then shift by zone offset.
  let utcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    const offsetMs = getTimeZoneOffsetMs(new Date(utcMs), timeZone);
    const desiredUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMs;
    if (desiredUtc === utcMs) break;
    utcMs = desiredUtc;
  }
  return new Date(utcMs).toISOString();
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const tzName = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT';
  // Examples: "GMT", "GMT+3", "GMT-5", "GMT+5:30"
  const m = tzName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const hours = Number(m[2] || 0);
  const mins = Number(m[3] || 0);
  return sign * (hours * 60 + mins) * 60 * 1000;
}
