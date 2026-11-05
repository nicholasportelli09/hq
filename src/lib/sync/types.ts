import type { Action, Member } from "@/lib/room/types";

export interface ConnectionHandlers {
  onAction: (action: Action) => void;
  /** Ids of members currently online, including yourself. */
  onPresence: (memberIds: readonly string[]) => void;
  /**
   * Fired each time the live channel (re)connects. Changes made before that
   * moment may have been missed, so the caller should resync.
   */
  onLive: () => void;
}

export interface RoomConnection {
  publish: (action: Action) => Promise<void>;
  close: () => void;
}

export interface SyncAdapter {
  /** "local" = this browser only (tabs sync), "live" = shared across devices. */
  readonly mode: "local" | "live";
  load: (roomId: string) => Promise<Action[]>;
  append: (roomId: string, action: Action) => Promise<void>;
  connect: (roomId: string, me: Member, handlers: ConnectionHandlers) => RoomConnection;
}
