"use client";

import type { UndoOffer } from "@/hooks/useUndo";

interface UndoToastProps {
  offer: UndoOffer | null;
  onUndo: () => void;
}

export function UndoToast({ offer, onUndo }: UndoToastProps) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center">
      {offer ? (
        <p className="animate-rise pointer-events-auto flex items-center gap-4 rounded-full bg-ink py-2 pl-4 pr-2 text-sm text-paper shadow-[0_12px_30px_-12px_rgb(0_0_0/0.4)]">
          {offer.label}
          <button
            type="button"
            onClick={onUndo}
            className="rounded-full px-3 py-1 font-medium underline-offset-4 hover:bg-paper/10 hover:underline"
          >
            Undo
          </button>
        </p>
      ) : null}
    </div>
  );
}
