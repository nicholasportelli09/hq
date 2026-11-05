"use client";

import { formatIn, formatShort } from "@/lib/datetime";
import { nextMilestone } from "@/lib/room/junction";
import type { Milestone } from "@/lib/room/types";

interface MilestoneTrackProps {
  start: number;
  deadline: number;
  now: number | null;
  share: number;
  hot: boolean;
  milestones: readonly Milestone[];
  onManage: () => void;
}

const position = (at: number, start: number, deadline: number) =>
  Math.min(100, Math.max(0, ((at - start) / (deadline - start)) * 100));

/** The progress line under the clock, with a tick for each milestone. */
export function MilestoneTrack({ start, deadline, now, share, hot, milestones, onManage }: MilestoneTrackProps) {
  const visible = milestones.filter((m) => m.at > start && m.at < deadline);
  const next = now === null ? null : nextMilestone(visible, now);

  return (
    <div className="mt-6">
      <div className="relative h-px w-full bg-line">
        <div
          aria-hidden
          className={`h-px origin-left transition-transform duration-1000 ease-linear ${hot ? "bg-signal" : "bg-ink"}`}
          style={{ transform: `scaleX(${share})` }}
        />
        {visible.map((m) => {
          const past = now !== null && m.at <= now;
          return (
            <span
              key={m.id}
              title={`${m.label} · ${formatShort(m.at)}`}
              className={`absolute top-1/2 h-2.5 w-px -translate-y-1/2 ${past ? "bg-ink/40" : "bg-ink"}`}
              style={{ left: `${position(m.at, start, deadline)}%` }}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-4 text-sm">
        <p className="min-w-0 truncate text-mute" aria-live="polite">
          {next && now !== null ? (
            <>
              <span className="text-ink">Next: {next.label}</span>, {formatShort(next.at)} · {formatIn(next.at - now)}
            </>
          ) : milestones.length === 0 ? (
            "No milestones yet"
          ) : (
            "No more milestones before the deadline"
          )}
        </p>
        <button type="button" onClick={onManage} className="shrink-0 text-mute hover:text-ink">
          Milestones
        </button>
      </div>
    </div>
  );
}
