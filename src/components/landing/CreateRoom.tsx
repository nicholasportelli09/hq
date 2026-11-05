"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useHydrated, useMe, useRecentRooms } from "@/hooks/useIdentity";
import { useNow } from "@/hooks/useNow";
import { defaultDeadline, fromLocalInput, toLocalInput } from "@/lib/datetime";
import { saveMe, type RecentRoom } from "@/lib/identity";
import { roomId } from "@/lib/room/ids";
import { JUNCTION_2026, presetMilestoneId } from "@/lib/room/junction";
import { countdown } from "@/lib/room/time";
import { LIMITS } from "@/lib/room/types";
import { sync } from "@/lib/sync";
import { ClockDigits } from "@/components/room/ClockDigits";

const fieldClass =
  "mt-1 w-full border-b border-line bg-transparent py-2 text-lg outline-none transition-colors focus:border-ink";

export function CreateRoom() {
  // The default deadline depends on the visitor's clock and time zone, so the
  // form only renders in the browser.
  return useHydrated() ? <CreateRoomForm /> : null;
}

function CreateRoomForm() {
  const router = useRouter();
  const now = useNow();
  const me = useMe();
  const recent = useRecentRooms();
  const [team, setTeam] = useState("");
  const [name, setName] = useState("");
  const [deadlineInput, setDeadlineInput] = useState(() => toLocalInput(defaultDeadline(Date.now())));
  const [renaming, setRenaming] = useState(false);
  const [junction, setJunction] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const knownName = renaming ? null : (me?.name ?? null);
  const deadline = fromLocalInput(deadlineInput);
  const preview = now !== null && deadline !== null ? countdown(deadline, now) : null;
  const memberName = knownName ?? name.trim();
  const valid = team.trim().length > 0 && memberName.length > 0 && deadline !== null && preview?.phase !== "over";

  const create = async () => {
    if (!valid || deadline === null) return;
    setBusy(true);
    setError(null);
    try {
      const me = saveMe(memberName);
      const id = roomId();
      await sync.append(id, { type: "room/create", name: team.trim(), deadline, at: Date.now() });
      await sync.append(id, { type: "member/upsert", member: me });
      if (junction && deadline === JUNCTION_2026.deadline) {
        for (const [i, m] of JUNCTION_2026.milestones.entries()) {
          await sync.append(id, { type: "milestone/add", id: presetMilestoneId(i), label: m.label, at: m.at });
        }
      }
      router.push(`/r/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create the room.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col px-5 sm:px-10">
      <header className="flex items-center justify-between py-5 text-sm">
        <span className="font-semibold">hq</span>
        <span className="text-mute">For hackathon teams</span>
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <p className="text-sm text-mute">
          {preview ? "Your team will have" : " "}
        </p>
        <ClockDigits value={preview} decorative className="mt-2" />
        <div className="mt-6 h-px w-full bg-ink" />

        <form
          className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end md:gap-8"
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <Field id="team" label="Team">
            <input
              id="team"
              autoFocus
              autoComplete="off"
              maxLength={LIMITS.teamName}
              placeholder="Name your team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field id="deadline" label="Submission deadline">
            <input
              id="deadline"
              type="datetime-local"
              value={deadlineInput}
              onChange={(e) => {
                setDeadlineInput(e.target.value);
                setJunction(false);
              }}
              className={fieldClass}
            />
          </Field>
          {knownName ? (
            <Field id="you" label="You">
              <p className="mt-1 flex items-baseline justify-between border-b border-line py-2 text-lg">
                {knownName}
                <button
                  type="button"
                  onClick={() => setRenaming(true)}
                  className="text-sm text-mute hover:text-ink"
                >
                  Change
                </button>
              </p>
            </Field>
          ) : (
            <Field id="name" label="Your name">
              <input
                id="name"
                autoComplete="given-name"
                maxLength={LIMITS.memberName}
                placeholder="So your team knows"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </Field>
          )}
          <button
            type="submit"
            disabled={!valid || busy}
            className="h-12 rounded-full bg-ink px-7 font-medium text-paper transition-[opacity,transform] hover:-translate-y-px active:translate-y-0 disabled:opacity-25 disabled:hover:translate-y-0"
          >
            Start the clock
          </button>
        </form>
        <p className="mt-5 text-sm text-mute">
          {junction ? (
            <>
              <span className="text-ink">{JUNCTION_2026.label} schedule added</span>: deadline Sun
              10:00 Helsinki time, plus {JUNCTION_2026.milestones.length} milestones.{" "}
              <button
                type="button"
                onClick={() => {
                  setJunction(false);
                  setDeadlineInput(toLocalInput(defaultDeadline(Date.now())));
                }}
                className="underline underline-offset-4 hover:text-ink"
              >
                Undo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setJunction(true);
                setDeadlineInput(toLocalInput(JUNCTION_2026.deadline));
              }}
              className="underline-offset-4 hover:text-ink hover:underline"
            >
              Going to {JUNCTION_2026.label}? Use its schedule
            </button>
          )}
        </p>
        {error ? <p className="mt-4 text-sm text-signal">{error}</p> : null}
        {preview?.phase === "over" ? (
          <p className="mt-4 text-sm text-signal">That deadline has already passed.</p>
        ) : null}
      </main>

      <footer className="grid gap-8 border-t border-line py-8 text-sm md:grid-cols-[1.4fr_2fr] md:gap-8">
        <p className="max-w-sm text-mute">
          A countdown, a task list and a vote. One page your whole team shares live. No accounts,
          just send the link.
        </p>
        {recent.length > 0 ? <RecentRooms rooms={recent} now={now} /> : null}
      </footer>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function RecentRooms({ rooms, now }: { rooms: readonly RecentRoom[]; now: number | null }) {
  return (
    <nav aria-label="Recent rooms">
      <h2 className="font-semibold">Recent</h2>
      <ul className="mt-2">
        {rooms.map((r) => {
          const left = now === null ? null : countdown(r.deadline, now);
          return (
            <li key={r.id}>
              <a
                href={`/r/${r.id}`}
                className="group flex items-baseline justify-between gap-4 border-b border-line py-2 hover:border-ink"
              >
                <span className="truncate group-hover:text-signal">{r.name}</span>
                <span className="shrink-0 tabular-nums text-mute">
                  {left === null ? "" : left.phase === "over" ? "Ended" : `${left.hours}:${left.minutes} left`}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
