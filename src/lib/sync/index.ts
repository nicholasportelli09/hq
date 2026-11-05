import { localAdapter } from "./local";
import { createSupabaseAdapter } from "./supabase";
import type { SyncAdapter } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Live sync when Supabase is configured, otherwise demo mode. */
export const sync: SyncAdapter = url && key ? createSupabaseAdapter(url, key) : localAdapter;

export type { SyncAdapter, RoomConnection } from "./types";
