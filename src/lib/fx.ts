// Optional live FX fetch for the NZD-per-AUD rate.
//
// Uses open.er-api.com (free, no API key, CORS-enabled). Rates change daily and
// banks use a *buffered* rate below spot, so this is only ever a starting point —
// the UI keeps the field editable and shows an "as at" timestamp.

export interface FxResult {
  /** NZD per 1 AUD. */
  rate: number;
  /** Human-readable timestamp of the upstream rate. */
  asAt: string;
  source: string;
}

const ENDPOINT = 'https://open.er-api.com/v6/latest/AUD';

export async function fetchAudNzd(signal?: AbortSignal): Promise<FxResult> {
  const res = await fetch(ENDPOINT, { signal });
  if (!res.ok) throw new Error(`FX request failed (${res.status})`);

  const data: unknown = await res.json();
  const rate = (data as { rates?: Record<string, number> })?.rates?.NZD;
  if (typeof rate !== 'number' || !Number.isFinite(rate)) {
    throw new Error('NZD rate missing from FX response');
  }

  const asAtRaw = (data as { time_last_update_utc?: string })?.time_last_update_utc;
  return {
    rate,
    asAt: asAtRaw ? formatAsAt(asAtRaw) : 'just now',
    source: 'open.er-api.com',
  };
}

function formatAsAt(utcString: string): string {
  const d = new Date(utcString);
  if (Number.isNaN(d.getTime())) return utcString;
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}
