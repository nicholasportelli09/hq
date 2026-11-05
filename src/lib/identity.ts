import { z } from "zod";
import { uid } from "@/lib/room/ids";
import { LIMITS, type Member } from "@/lib/room/types";

export const ME_KEY = "hq:me";
export const RECENT_KEY = "hq:recent";
const MAX_RECENT = 5;

const memberSchema = z.object({ id: z.string().min(1), name: z.string().min(1).max(LIMITS.memberName) });
const recentSchema = z.array(z.object({ id: z.string(), name: z.string(), deadline: z.number() }));

export type RecentRoom = z.infer<typeof recentSchema>[number];

// --- tiny external store over localStorage, for useSyncExternalStore ---

const listeners = new Set<() => void>();

export function subscribeStorage(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
  listeners.forEach((l) => l());
}

function parse<T>(raw: string | null, schema: z.ZodType<T>): T | null {
  try {
    const parsed = schema.safeParse(JSON.parse(raw ?? "null"));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const parseMe = (raw: string | null): Member | null => parse(raw, memberSchema);
export const parseRecent = (raw: string | null): RecentRoom[] => parse(raw, recentSchema) ?? [];

export const loadMe = (): Member | null => parseMe(localStorage.getItem(ME_KEY));

export function saveMe(name: string): Member {
  const me: Member = { id: loadMe()?.id ?? uid(), name: name.trim().slice(0, LIMITS.memberName) };
  write(ME_KEY, me);
  return me;
}

export function rememberRoom(room: RecentRoom): void {
  const current = parseRecent(localStorage.getItem(RECENT_KEY));
  const top = current[0];
  if (top && top.id === room.id && top.name === room.name && top.deadline === room.deadline) return;
  write(RECENT_KEY, [room, ...current.filter((r) => r.id !== room.id)].slice(0, MAX_RECENT));
}
