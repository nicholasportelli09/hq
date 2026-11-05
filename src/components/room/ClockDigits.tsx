import type { Countdown } from "@/lib/room/time";

interface ClockDigitsProps {
  value: Countdown | null;
  hot?: boolean;
  className?: string;
}

const Colon = () => <span className="colon">:</span>;

/** The big HH:MM:SS. Digits are tabular so the clock never jiggles. */
export function ClockDigits({ value, hot = false, className = "" }: ClockDigitsProps) {
  if (!value) {
    return (
      <p className={`clock text-line ${className}`} aria-hidden>
        <span className="digits">00</span><Colon /><span className="digits">00</span><Colon /><span className="digits">00</span>
      </p>
    );
  }
  return (
    <p
      role="timer"
      aria-label={`${Number(value.hours)} hours, ${Number(value.minutes)} minutes left`}
      className={`clock transition-colors duration-700 ${hot ? "text-signal" : "text-ink"} ${className}`}
    >
      <span className="digits">{value.hours}</span>
      <Colon />
      <span className="digits">{value.minutes}</span>
      <Colon />
      <span className={`digits ${hot ? "" : "text-ink/30"}`}>{value.seconds}</span>
    </p>
  );
}
