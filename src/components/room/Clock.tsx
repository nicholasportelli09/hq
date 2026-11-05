"use client";

import { useState } from "react";
import { useNow } from "@/hooks/useNow";
import { formatDue, fromLocalInput, toLocalInput } from "@/lib/datetime";
import { countdown, progress } from "@/lib/room/time";
import { ClockDigits } from "./ClockDigits";

interface ClockProps {
  start: number;
  deadline: number;
  onDeadlineChange: (deadline: number) => void;
}


export function Clock({ start, deadline, onDeadlineChange }: ClockProps) {
  const now = useNow();
  const [editing, setEditing] = useState(false);
  const c = now === null ? null : countdown(deadline, now);
  const share = now === null ? 0 : progress(start, deadline, now);
  const hot = c !== null && c.phase !== "running";

  return (
    <section aria-label="Time left" className="pt-6 sm:pt-10">
      <div className="flex items-baseline justify-between gap-4 text-sm text-mute">
        <span className={hot ? "text-signal" : undefined}>
          {c?.phase === "over" ? "Deadline passed" : c?.phase === "final" ? "Final hour" : "Time left"}
        </span>
        {editing ? (
          <DeadlineEditor
            deadline={deadline}
            onDone={(next) => {
              setEditing(false);
              if (next !== null && next !== deadline) onDeadlineChange(next);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="underline-offset-4 decoration-line hover:text-ink hover:underline"
            title="Change the deadline"
          >
            Due {formatDue(deadline)}
          </button>
        )}
      </div>

      <ClockDigits value={c} hot={hot} className="mt-2 select-none" />

      <div className="mt-6 h-px w-full bg-line" aria-hidden>
        <div
          className={`h-px origin-left transition-transform duration-1000 ease-linear ${hot ? "bg-signal" : "bg-ink"}`}
          style={{ transform: `scaleX(${share})` }}
        />
      </div>
    </section>
  );
}

interface DeadlineEditorProps {
  deadline: number;
  onDone: (deadline: number | null) => void;
}

function DeadlineEditor({ deadline, onDone }: DeadlineEditorProps) {
  const [value, setValue] = useState(toLocalInput(deadline));
  return (
    <form
      className="flex items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onDone(fromLocalInput(value));
      }}
    >
      <input
        type="datetime-local"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onDone(null)}
        aria-label="Deadline"
        className="bg-transparent text-ink outline-none border-b border-line focus:border-ink"
      />
      <button type="submit" className="text-ink hover:underline underline-offset-4">
        Save
      </button>
    </form>
  );
}
