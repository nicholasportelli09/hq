import type { Countdown } from "@/lib/room/time";

interface ClockDigitsProps {
  value: Countdown | null;
  hot?: boolean;
  className?: string;
  /** A preview, not a real timer: hide it from assistive tech. */
  decorative?: boolean;
}

const ZERO = { hours: "00", minutes: "00", seconds: "00" } as const;

const Colon = () => <span className="colon">:</span>;

/** The big HH:MM:SS. Digits are tabular so the clock never jiggles. */
export function ClockDigits({ value, hot = false, className = "", decorative = false }: ClockDigitsProps) {
  const v = value ?? ZERO;
  const live = value !== null && !decorative;
  const tone = value === null ? "text-line" : hot ? "text-signal" : "text-ink";

  return (
    <p
      role={live ? "timer" : undefined}
      aria-hidden={live ? undefined : true}
      aria-label={live ? `${Number(v.hours)} hours, ${Number(v.minutes)} minutes left` : undefined}
      className={`clock transition-colors duration-700 ${tone} ${className}`}
    >
      <span className="digits">{v.hours}</span>
      <Colon />
      <span className="digits">{v.minutes}</span>
      <Colon />
      <span className={`digits ${value !== null && !hot ? "text-ink/30" : ""}`}>{v.seconds}</span>
    </p>
  );
}
