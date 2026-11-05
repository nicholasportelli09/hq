"use client";

import { useEffect, useRef } from "react";

const SHORTCUTS: ReadonlyArray<readonly [string, string]> = [
  ["N", "New task"],
  ["I", "New idea"],
  ["J / K", "Move between tasks"],
  ["X", "Done / not done"],
  ["C", "Claim / unclaim"],
  ["⌫", "Delete task"],
  ["Esc", "Leave the input"],
];

interface ShortcutsProps {
  open: boolean;
  onClose: () => void;
}

export function Shortcuts({ open, onClose }: ShortcutsProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-line bg-paper p-0 text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)] backdrop:bg-ink/20"
    >
      <div className="p-6">
        <h2 className="text-sm font-semibold">Keyboard</h2>
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
      </div>
    </dialog>
  );
}
