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
  const meId = me?.id;
  const meName = me?.name;

  useEffect(() => {
    let cancelled = false;
    let buffered: Action[] = [];
    let loaded = false;

    const reload = () =>
      sync
        .load(roomId)
        .then((actions) => {
          if (cancelled) return;
          loaded = true;
          setLog([...actions, ...buffered]);
          buffered = [];
        })
        .catch((e: unknown) => !cancelled && setError(message(e)));

    if (meId && meName) {
      connection.current = sync.connect(roomId, { id: meId, name: meName }, {
        onAction: (action) => {
          if (!loaded) buffered = [...buffered, action];
          else setLog((prev) => [...(prev ?? []), action]);
        },
        onPresence: setOnline,
        onReconnect: reload,
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
      const publish = connection.current
        ? connection.current.publish(action)
        : sync.append(roomId, action);
      publish.then(() => setError(null)).catch((e: unknown) => setError(message(e)));
    },
    [roomId],
  );

  const room = useMemo(() => (log ? replay(log) : null), [log]);
  const status: RoomStatus =
    log === null ? (error ? "error" : "loading") : room ? "ready" : "missing";

  return { status, room, online, error, dispatch };
}
