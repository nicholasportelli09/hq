"use client";

import { useState } from "react";
import { formatShort, fromLocalInput, toLocalInput } from "@/lib/datetime";
import { uid } from "@/lib/room/ids";
import { JUNCTION_2026, presetMilestoneId } from "@/lib/room/junction";
import { LIMITS, type Action, type Milestone } from "@/lib/room/types";
import { Sheet } from "./Sheet";

interface MilestonesSheetProps {
  open: boolean;
  onClose: () => void;
  milestones: readonly Milestone[];
  deadline: number;
  dispatch: (action: Action) => void;
}

const HOUR = 3_600_000;
const sameMilestone = (a: Omit<Milestone, "id">, b: Omit<Milestone, "id">) =>
  a.label === b.label && a.at === b.at;

export function MilestonesSheet({ open, onClose, milestones, deadline, dispatch }: MilestonesSheetProps) {
  const [label, setLabel] = useState("");
  const [when, setWhen] = useState(() => toLocalInput(deadline - 2 * HOUR));
  const at = fromLocalInput(when);
  const valid = label.trim().length > 0 && at !== null;

  const missingPreset = JUNCTION_2026.milestones
    .map((m, i) => ({ ...m, id: presetMilestoneId(i) }))
    .filter((p) => !milestones.some((m) => m.id === p.id || sameMilestone(m, p)));
  const presetApplies = deadline === JUNCTION_2026.deadline || milestones.length === 0;

  const usePreset = () => {
    if (deadline !== JUNCTION_2026.deadline) {
      dispatch({ type: "room/deadline", deadline: JUNCTION_2026.deadline });
    }
    missingPreset.forEach((m) => dispatch({ type: "milestone/add", id: m.id, label: m.label, at: m.at }));
  };

  return (
    <Sheet open={open} title="Milestones" onClose={onClose} width="md">
      {milestones.length > 0 ? (
        <ul className="mt-4">
          {milestones.map((m) => (
            <li key={m.id} className="group flex items-baseline gap-3 border-b border-line py-2 text-sm">
              <span className="w-24 shrink-0 tabular-nums text-mute">{formatShort(m.at)}</span>
              <span className="min-w-0 flex-1 truncate">{m.label}</span>
              <button
                type="button"
                aria-label={`Remove milestone: ${m.label}`}
                onClick={() => dispatch({ type: "milestone/remove", id: m.id })}
                className="text-xs text-mute hover:text-ink"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-mute">
          Mark moments the team must not miss: a feature freeze, dinner, a check-in.
        </p>
      )}

      <form
        className="mt-5 grid grid-cols-[1fr_auto] gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid || at === null) return;
          dispatch({ type: "milestone/add", id: uid(), label: label.trim(), at });
          setLabel("");
        }}
      >
        <label className="col-span-2 text-sm">
          <span className="sr-only">Milestone name</span>
          <input
            value={label}
            maxLength={LIMITS.milestoneLabel}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Feature freeze"
            className="w-full border-b border-line bg-transparent py-2 outline-none focus:border-ink"
          />
        </label>
        <label className="text-sm">
          <span className="sr-only">Milestone time</span>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="w-full border-b border-line bg-transparent py-2 outline-none focus:border-ink"
          />
        </label>
        <button
          type="submit"
          disabled={!valid}
          className="self-end rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper disabled:opacity-25"
        >
          Add
        </button>
      </form>

      {presetApplies && missingPreset.length > 0 ? (
        <button
          type="button"
          onClick={usePreset}
          className="mt-6 w-full border-t border-line pt-4 text-left text-sm text-mute hover:text-ink"
        >
          Use the {JUNCTION_2026.label} schedule
          <span className="block text-xs">
            Deadline Sun 10:00 Helsinki time, plus draft, submissions-open and meal times
          </span>
        </button>
      ) : null}
    </Sheet>
  );
}
