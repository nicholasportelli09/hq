"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Action } from "@/lib/room/types";

export const UNDO_WINDOW_MS = 6_000;

export interface UndoOffer {
  label: string;
  actions: readonly Action[];
}

export interface UseUndo {
  offer: UndoOffer | null;
  /** Show "<label> · Undo"; undoing dispatches `actions`. */
  propose: (label: string, actions: readonly Action[]) => void;
  undo: () => void;
  dismiss: () => void;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** One-level undo for deletes, restored by replaying events for everyone. */
export function useUndo(dispatch: (action: Action) => void): UseUndo {
  const [offer, setOffer] = useState<UndoOffer | null>(null);
  const offerRef = useRef<UndoOffer | null>(null);

  useEffect(() => {
    offerRef.current = offer;
    if (!offer) return;
    const timer = setTimeout(() => setOffer(null), UNDO_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [offer]);

  const undo = useCallback(() => {
    const current = offerRef.current;
    if (!current) return;
    current.actions.forEach(dispatch);
    setOffer(null);
  }, [dispatch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z" || e.shiftKey) return;
      if (!offerRef.current || isTyping(e.target)) return; // let inputs keep their own undo
      if (document.querySelector("dialog[open]")) return; // never act behind a modal
      e.preventDefault();
      undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  const propose = useCallback((label: string, actions: readonly Action[]) => {
    setOffer({ label, actions });
  }, []);
  const dismiss = useCallback(() => setOffer(null), []);

  return { offer, propose, undo, dismiss };
}
