"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  ME_KEY,
  parseMe,
  parseRecent,
  RECENT_KEY,
  subscribeStorage,
  type RecentRoom,
} from "@/lib/identity";
import type { Member } from "@/lib/room/types";

const noop = () => () => {};

/** false during server render and hydration, true afterwards. */
export const useHydrated = (): boolean =>
  useSyncExternalStore(noop, () => true, () => false);

const useStored = (key: string): string | null | undefined =>
  useSyncExternalStore(
    subscribeStorage,
    () => localStorage.getItem(key),
    () => undefined,
  );

/** `undefined` until we can read storage; `null` means "no name saved yet". */
export function useMe(): Member | null | undefined {
  const raw = useStored(ME_KEY);
  return useMemo(() => (raw === undefined ? undefined : parseMe(raw)), [raw]);
}

export function useRecentRooms(): RecentRoom[] {
  const raw = useStored(RECENT_KEY);
  return useMemo(() => (raw === undefined ? [] : parseRecent(raw)), [raw]);
}
