"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  width?: "sm" | "md";
  children: ReactNode;
}

/** A small modal built on <dialog>: Escape, focus trap and backdrop for free. */
export function Sheet({ open, title, onClose, width = "sm", children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const max = width === "sm" ? "22rem" : "28rem";
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ width: `min(${max}, calc(100vw - 2rem))` }}
      className="m-auto rounded-lg border border-line bg-paper p-0 text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)] backdrop:bg-ink/20"
    >
      <div className="p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button type="button" autoFocus onClick={onClose} className="text-sm text-mute hover:text-ink">
            Close
          </button>
        </div>
        {open ? children : null}
      </div>
    </dialog>
  );
}
