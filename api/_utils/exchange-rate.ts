// USD → KES for admin finance display (cached, live rate with fallback)

const CACHE_MS = 60 * 60 * 1000; // 1 hour

let cache: { rate: number; asOf: string; fetchedAt: number; source: string } | null = null;

export async function getUsdToKesRate(): Promise<{
  usdToKes: number;
  asOf: string;
  source: 'cache' | 'frankfurter' | 'fallback';
}> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return { usdToKes: cache.rate, asOf: cache.asOf, source: 'cache' };
  }

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=KES', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as { date?: string; rates?: { KES?: number } };
      const rate = data.rates?.KES;
      if (rate && rate > 0) {
        const asOf = data.date || new Date().toISOString().slice(0, 10);
        cache = { rate, asOf, fetchedAt: Date.now(), source: 'frankfurter' };
        return { usdToKes: rate, asOf, source: 'frankfurter' };
      }
    }
  } catch (err) {
    console.warn('[exchange-rate] Frankfurter fetch failed:', err);
  }

  const fallback = Number(process.env.USD_TO_KES_RATE || 130);
  const asOf = new Date().toISOString().slice(0, 10);
  cache = { rate: fallback, asOf, fetchedAt: Date.now(), source: 'fallback' };
  return { usdToKes: fallback, asOf, source: 'fallback' };
}
