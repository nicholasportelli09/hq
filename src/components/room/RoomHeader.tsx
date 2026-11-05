"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Member } from "@/lib/room/types";
import { Avatar } from "./Avatar";

const COPIED_MS = 1800;

interface RoomHeaderProps {
  name: string;
  online: readonly Member[];
  meId: string;
  mode: "local" | "live";
  onHelp: () => void;
}

export function RoomHeader({ name, online, meId, mode, onHelp }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(t);
  }, [copied]);

  const invite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", window.location.href);
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 py-5 text-sm">
      <div className="flex min-w-0 items-baseline gap-2">
        <Link href="/" className="font-semibold hover:text-signal">
          hq
        </Link>
        <span className="text-mute">/</span>
        <h1 className="truncate font-medium">{name}</h1>
        {mode === "local" ? (
          <span
            className="hidden shrink-0 text-mute sm:inline"
            title="Demo mode: syncs between tabs in this browser. Add Supabase keys to sync across devices."
          >
            · this browser only
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <ul className="flex -space-x-1.5" aria-label={`${online.length} online`}>
          {online.map((m) => (
            <li key={m.id} title={m.id === meId ? `${m.name} (you)` : m.name} className="rounded-full ring-2 ring-paper">
              <Avatar name={m.name} tone={m.id === meId ? "solid" : "outline"} />
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={invite}
          className="min-w-[5.5rem] rounded-full border border-ink px-3.5 py-1.5 font-medium transition-colors hover:bg-ink hover:text-paper"
        >
          {copied ? "Link copied" : "Invite"}
        </button>
        <button
          type="button"
          onClick={onHelp}
          aria-label="Keyboard shortcuts"
          className="hidden h-8 w-8 place-items-center rounded-full text-mute hover:text-ink sm:grid"
        >
          ?
        </button>
      </div>
    </header>
  );
}
