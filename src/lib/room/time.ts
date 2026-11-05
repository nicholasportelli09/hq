const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const FINAL_HOUR_MS = HOUR;

export type Countdown = Readonly<{
  hours: string;
  minutes: string;
  seconds: string;
  remainingMs: number;
  phase: "running" | "final" | "over";
}>;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Hours are not wrapped into days: a 48h hackathon reads "41:12:09",
 * which is how people actually talk about the time left.
 */
export function countdown(deadline: number, now: number): Countdown {
  const remainingMs = Math.max(0, deadline - now);
  const totalSeconds = Math.ceil(remainingMs / SECOND);
  const phase =
    remainingMs === 0 ? "over" : remainingMs <= FINAL_HOUR_MS ? "final" : "running";
  return {
    hours: pad(Math.floor(totalSeconds / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
    remainingMs,
    phase,
  };
}

/** 0 → 1 share of the event that has elapsed. */
export function progress(start: number, deadline: number, now: number): number {
  const total = deadline - start;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now - start) / total));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
