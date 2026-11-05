import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseAction, parseActions } from "@/lib/room/schema";
import type { Member } from "@/lib/room/types";
import type { ConnectionHandlers, RoomConnection, SyncAdapter } from "./types";

/**
 * Live mode. Events are stored through two RPCs (see
 * supabase/migrations) so the table itself is never readable as a whole;
 * live updates and presence go over a Realtime channel per room.
 */
export function createSupabaseAdapter(url: string, key: string): SyncAdapter {
  const client: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  const adapter: SyncAdapter = {
    mode: "live",

    async load(roomId) {
      const { data, error } = await client.rpc("hq_load", { p_room: roomId });
      if (error) throw new Error(`Could not load room: ${error.message}`);
      return parseActions(data);
    },

    async append(roomId, action) {
      const { error } = await client.rpc("hq_append", { p_room: roomId, p_action: action });
      if (error) throw new Error(`Could not save change: ${error.message}`);
    },

    connect(roomId: string, me: Member, handlers: ConnectionHandlers): RoomConnection {
      const channel = client.channel(`room:${roomId}`, {
        config: { broadcast: { self: false }, presence: { key: me.id } },
      });
      let subscribedOnce = false;

      channel
        .on("broadcast", { event: "action" }, ({ payload }) => {
          const action = parseAction(payload);
          if (action) handlers.onAction(action);
        })
        .on("presence", { event: "sync" }, () => {
          handlers.onPresence(Object.keys(channel.presenceState()).sort());
        })
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") return;
          void channel.track({ at: Date.now() });
          if (subscribedOnce) handlers.onReconnect();
          subscribedOnce = true;
        });

      return {
        async publish(action) {
          await adapter.append(roomId, action);
          await channel.send({ type: "broadcast", event: "action", payload: action });
        },
        close() {
          void client.removeChannel(channel);
        },
      };
    },
  };

  return adapter;
}
