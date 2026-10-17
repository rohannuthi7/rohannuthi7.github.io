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

/** "2025-09" -> "Sep 2025" */
export function formatStart(start: string): string {
  const s = parse(start);
  return `${s.month} ${s.year}`;
}

/** Sort key: roles still held first, then by newest start date; on a tie, the longer-running one first. */
export function byStartDesc<T extends { data: { dates: { start: string; end: string } } }>(a: T, b: T): number {
  const current = (e: string) => (e === 'present' || e === 'ongoing' ? 1 : 0);
  const byCurrent = current(b.data.dates.end) - current(a.data.dates.end);
  if (byCurrent !== 0) return byCurrent;
  const byStart = b.data.dates.start.localeCompare(a.data.dates.start);
  if (byStart !== 0) return byStart;
  const endKey = (e: string) => (e === 'present' || e === 'ongoing' ? '9999-99' : e);
  return endKey(b.data.dates.end).localeCompare(endKey(a.data.dates.end));
}

/** Machine-readable value for <time datetime>. */
export function isoMonth(value: string): string | undefined {
  return /^\d{4}-\d{2}$/.test(value) ? value : undefined;
}
