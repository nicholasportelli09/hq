"use client";

import { useEffect, useRef } from "react";

export type HotkeyMap = Readonly<Record<string, (event: KeyboardEvent) => void>>;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** Single-key shortcuts that stay out of the way while you're typing. */
export function useHotkeys(map: HotkeyMap): void {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "Escape" && isTyping(event.target)) return;
      const handler = ref.current[event.key];
      if (!handler) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
