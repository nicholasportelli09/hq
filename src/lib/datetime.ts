const pad = (n: number) => String(n).padStart(2, "0");

/** Epoch ms → value for <input type="datetime-local"> in local time. */
export function toLocalInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value → epoch ms, or null if invalid. */
export function fromLocalInput(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

const HOUR = 3_600_000;

/** Next full hour + `hours`. A sensible default deadline. */
export function defaultDeadline(now: number, hours = 48): number {
  return Math.ceil(now / HOUR) * HOUR + hours * HOUR;
}

const dueFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDue = (ms: number): string => dueFormat.format(ms);

const shortFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** "Sat 13:00" — for milestones inside a weekend. */
export const formatShort = (ms: number): string => shortFormat.format(ms);

/** "in 3h 20m", "in 12m", "now". */
export function formatIn(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes === 0) return "now";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `in ${h}h ${String(m).padStart(2, "0")}m` : `in ${m}m`;
}
