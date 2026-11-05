"use client";

import { useNow } from "@/hooks/useNow";
import { checklistVisible, SUBMISSION_CHECKLIST } from "@/lib/room/junction";
import type { Action } from "@/lib/room/types";
import { SectionHead } from "./SectionHead";

interface SubmissionChecklistProps {
  deadline: number;
  checked: readonly string[];
  /** Shown early with the S key, before it appears on its own. */
  forced: boolean;
  dispatch: (action: Action) => void;
}

/** Appears in the final hours (or once anything is ticked). Ticks sync to everyone. */
export function SubmissionChecklist({ deadline, checked, forced, dispatch }: SubmissionChecklistProps) {
  const now = useNow();
  if (now === null || !(forced || checklistVisible(deadline, now, checked))) return null;

  const total = SUBMISSION_CHECKLIST.length;
  const done = SUBMISSION_CHECKLIST.filter((i) => checked.includes(i.id)).length;

  return (
    <section aria-labelledby="checklist-title" className="animate-rise mb-14">
      <SectionHead
        id="checklist-title"
        title="Before you submit"
        meta={done === total ? "All set" : `${done} / ${total}`}
      />
      <ul>
        {SUBMISSION_CHECKLIST.map((item) => {
          const on = checked.includes(item.id);
          return (
            <li key={item.id} className="row flex items-center gap-3 py-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-label={item.label}
                onClick={() => dispatch({ type: "checklist/set", item: item.id, done: !on })}
                className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[3px] border transition-colors ${on ? "border-ink bg-ink text-paper" : "border-ink/40 hover:border-ink"}`}
              >
                {on ? (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
                    <path d="M2 6.5 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                ) : null}
              </button>
              <span className={`text-[15px] ${on ? "text-mute line-through decoration-mute/60" : ""}`}>
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
