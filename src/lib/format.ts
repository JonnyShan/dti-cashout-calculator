// Display formatting helpers. Thousands separators + tabular numerals are
// applied via CSS (.tnum); these just produce the strings.

const grouping0 = new Intl.NumberFormat('en-NZ', { maximumFractionDigits: 0 });

/** "$1,800,000" — whole dollars, rounded. Returns "—" for non-finite input. */
export function money(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  return (rounded < 0 ? '-$' : '$') + grouping0.format(Math.abs(rounded));
}

/** Plain grouped integer, no currency symbol. */
export function group(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return grouping0.format(Math.round(value));
}

/** A number with up to `decimals` fractional digits, grouped. */
export function decimal(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('en-NZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/** DTI ratio to 2dp, or "—" when there is no income. */
export function dtiText(dti: number): string {
  return Number.isFinite(dti) ? dti.toFixed(2) : '—';
}

/** Parse a loosely-typed money/number string (strips $, commas, spaces). */
export function parseLoose(s: string): number | null {
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
