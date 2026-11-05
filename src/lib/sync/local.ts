import { parseAction, parseActions } from "@/lib/room/schema";
import type { Action, Member } from "@/lib/room/types";
import { forget, HEARTBEAT_MS, markSeen, onlineIds, type SeenMap } from "./presence";
import type { ConnectionHandlers, RoomConnection, SyncAdapter } from "./types";

const storageKey = (roomId: string) => `hq:room:${roomId}`;

type Message =
  | { kind: "action"; action: unknown }
  | { kind: "hello"; memberId: string; reply: boolean }
  | { kind: "bye"; memberId: string };

function readLog(roomId: string): Action[] {
  try {
    return parseActions(JSON.parse(localStorage.getItem(storageKey(roomId)) ?? "[]"));
  } catch {
    return [];
  }
}

function writeLog(roomId: string, log: readonly Action[]): void {
  localStorage.setItem(storageKey(roomId), JSON.stringify(log));
}

/**
 * Demo mode: the event log lives in localStorage and tabs talk over a
 * BroadcastChannel. Open the same room in two tabs to see live sync with
 * zero setup.
 */
export const localAdapter: SyncAdapter = {
  mode: "local",

  async load(roomId) {
    return readLog(roomId);
  },

  async append(roomId, action) {
    writeLog(roomId, [...readLog(roomId), action]);
  },

  connect(roomId: string, me: Member, handlers: ConnectionHandlers): RoomConnection {
    const channel = new BroadcastChannel(`hq:${roomId}`);
    let seen: SeenMap = markSeen({}, me.id, Date.now());
    const emitPresence = () => handlers.onPresence(onlineIds(seen, Date.now()));
    const send = (msg: Message) => channel.postMessage(msg);

    channel.onmessage = (event: MessageEvent<Message>) => {
      const msg = event.data;
      if (msg.kind === "action") {
        const action = parseAction(msg.action);
        if (action) handlers.onAction(action);
        return;
      }
      if (msg.kind === "hello") {
        const isNew = !(msg.memberId in seen);
        seen = markSeen(seen, msg.memberId, Date.now());
        if (isNew && !msg.reply) send({ kind: "hello", memberId: me.id, reply: true });
      }
      if (msg.kind === "bye") seen = forget(seen, msg.memberId);
      emitPresence();
    };

    const beat = () => {
      seen = markSeen(seen, me.id, Date.now());
      send({ kind: "hello", memberId: me.id, reply: false });
      emitPresence();
    };
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);

    return {
      async publish(action) {
        await localAdapter.append(roomId, action);
        send({ kind: "action", action });
      },
      close() {
        clearInterval(timer);
        send({ kind: "bye", memberId: me.id });
        channel.close();
      },
    };
  },
};
