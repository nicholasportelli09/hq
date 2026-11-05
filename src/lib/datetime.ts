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
