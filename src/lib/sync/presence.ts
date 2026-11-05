export const HEARTBEAT_MS = 4_000;
export const PRESENCE_TTL_MS = 10_000;

/** Tracks who has been seen recently. Pure data in, pure data out. */
export type SeenMap = Readonly<Record<string, number>>;

export const markSeen = (seen: SeenMap, id: string, at: number): SeenMap => ({
  ...seen,
  [id]: at,
});

export const forget = (seen: SeenMap, id: string): SeenMap =>
  Object.fromEntries(Object.entries(seen).filter(([key]) => key !== id));

export const onlineIds = (seen: SeenMap, now: number): string[] =>
  Object.entries(seen)
    .filter(([, at]) => now - at < PRESENCE_TTL_MS)
    .map(([id]) => id)
    .sort();
