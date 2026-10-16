const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type YearMonth = { year: number; month: string };

function parse(value: string): YearMonth {
  const [y, m] = value.split('-');
  return { year: Number(y), month: MONTHS[Number(m) - 1] ?? '' };
}

/**
 * "2025-09" + "present"  -> "Sep 2025 – present"
 * "2026-04" + "ongoing"  -> "Apr 2026 – ongoing"
 * "2026-01" + "2026-05"  -> "Jan – May 2026"
 * "2025-09" + "2026-05"  -> "Sep 2025 – May 2026"
 */
export function formatRange(start: string, end: string): string {
  const s = parse(start);
  if (end === 'present' || end === 'ongoing') return `${s.month} ${s.year} – ${end}`;
  const e = parse(end);
  if (s.year === e.year) return `${s.month} – ${e.month} ${e.year}`;
  return `${s.month} ${s.year} – ${e.month} ${e.year}`;
}

/** Sort key: newest start date first. */
export function byStartDesc<T extends { data: { dates: { start: string } } }>(a: T, b: T): number {
  return b.data.dates.start.localeCompare(a.data.dates.start);
}

/** Machine-readable value for <time datetime>. */
export function isoMonth(value: string): string | undefined {
  return /^\d{4}-\d{2}$/.test(value) ? value : undefined;
}
