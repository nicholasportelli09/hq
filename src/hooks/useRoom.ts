"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { replay } from "@/lib/room/reducer";
import type { Action, Member, Room } from "@/lib/room/types";
import { sync, type RoomConnection } from "@/lib/sync";

export type RoomStatus = "loading" | "ready" | "missing" | "error";

export interface UseRoom {
  status: RoomStatus;
  room: Room | null;
  online: readonly string[];
  error: string | null;
  dispatch: (action: Action) => void;
}

const message = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/**
 * Loads a room's event log, keeps it live, and exposes `dispatch`.
 * Changes are applied locally first, so the UI never waits on the network.
 */
export function useRoom(roomId: string, me: Member | null): UseRoom {
  const [log, setLog] = useState<readonly Action[] | null>(null);
  const [online, setOnline] = useState<readonly string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const connection = useRef<RoomConnection | null>(null);
  /** Local actions dispatched but not yet confirmed saved. */
  const pending = useRef<readonly Action[]>([]);
  const meId = me?.id;
  const meName = me?.name;

  useEffect(() => {
    let cancelled = false;
    let latestRequest = 0;
    /** Live actions received while a reload is in flight; null when none is. */
    let inFlight: Action[] | null = null;
    pending.current = [];

    // Replace the log with the server snapshot, then re-apply anything that
    // arrived or was dispatched meanwhile. The reducer is idempotent, so a
    // re-applied action that the snapshot already contains is harmless.
    const reload = () => {
      const request = ++latestRequest;
      inFlight = [];
      return sync
        .load(roomId)
        .then((actions) => {
          if (cancelled || request !== latestRequest) return; // a newer reload wins
          setLog([...actions, ...(inFlight ?? []), ...pending.current]);
          inFlight = null;
        })
        .catch((e: unknown) => {
          if (!cancelled && request === latestRequest) setError(message(e));
        });
    };

    if (meId && meName) {
      connection.current = sync.connect(roomId, { id: meId, name: meName }, {
        onAction: (action) => {
          if (inFlight) inFlight = [...inFlight, action];
          setLog((prev) => (prev ? [...prev, action] : prev));
        },
        onPresence: setOnline,
        onLive: () => void reload(),
      });
    }
    void reload();

    const onVisible = () => document.visibilityState === "visible" && void reload();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      connection.current?.close();
      connection.current = null;
    };
  }, [roomId, meId, meName]);

  const dispatch = useCallback(
    (action: Action) => {
      setLog((prev) => [...(prev ?? []), action]);
      pending.current = [...pending.current, action];
      const settle = () => {
        pending.current = pending.current.filter((a) => a !== action);
      };
      const publish = connection.current
        ? connection.current.publish(action)
        : sync.append(roomId, action);
      publish
        .then(() => {
          settle();
          setError(null);
        })
        .catch((e: unknown) => {
          // Roll back: drop the unsaved action and let replay rebuild state.
          settle();
          setLog((prev) => (prev ? prev.filter((a) => a !== action) : prev));
          setError(message(e));
        });
    },
    [roomId],
  );

  const room = useMemo(() => (log ? replay(log) : null), [log]);
  const status: RoomStatus =
    log === null ? (error ? "error" : "loading") : room ? "ready" : "missing";

  return { status, room, online, error, dispatch };
}
