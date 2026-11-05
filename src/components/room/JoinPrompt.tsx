"use client";

import { useState } from "react";
import { LIMITS } from "@/lib/room/types";

interface JoinPromptProps {
  teamName: string;
  onJoin: (name: string) => void;
}

export function JoinPrompt({ teamName, onJoin }: JoinPromptProps) {
  const [name, setName] = useState("");
  const valid = name.trim().length > 0;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <p className="text-sm text-mute">You&rsquo;ve been invited to</p>
      <h1 className="mt-1 text-4xl font-medium tracking-[-0.03em] text-balance">{teamName}</h1>
      <form
        className="mt-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onJoin(name);
        }}
      >
        <label htmlFor="join-name" className="text-sm font-semibold">
          Your name
        </label>
        <input
          id="join-name"
          autoFocus
          autoComplete="given-name"
          maxLength={LIMITS.memberName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full border-b border-ink bg-transparent py-2 text-2xl outline-none"
        />
        <button
          type="submit"
          disabled={!valid}
          className="mt-8 w-full rounded-full bg-ink py-3 font-medium text-paper transition-opacity disabled:opacity-30"
        >
          Join
        </button>
      </form>
    </main>
  );
}
