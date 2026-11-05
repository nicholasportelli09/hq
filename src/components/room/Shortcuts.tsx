"use client";

import { Sheet } from "./Sheet";

const SHORTCUTS: ReadonlyArray<readonly [string, string]> = [
  ["N", "New task"],
  ["I", "New idea"],
  ["J / K", "Move between tasks"],
  ["X", "Done / not done"],
  ["C", "Claim / unclaim"],
  ["⌫", "Delete task"],
  ["⌘Z", "Undo a delete"],
  ["M", "Milestones"],
  ["S", "Submission checklist"],
  ["Esc", "Leave the input"],
];

interface ShortcutsProps {
  open: boolean;
  onClose: () => void;
}

export function Shortcuts({ open, onClose }: ShortcutsProps) {
  return (
    <Sheet open={open} title="Keyboard" onClose={onClose}>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
        {SHORTCUTS.map(([key, label]) => (
          <div key={key} className="contents">
            <dt>
              <kbd className="inline-block min-w-7 rounded border border-line px-1.5 py-0.5 text-center text-xs font-medium">
                {key}
              </kbd>
            </dt>
            <dd className="self-center text-mute">{label}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
