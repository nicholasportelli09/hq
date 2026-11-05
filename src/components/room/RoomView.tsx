"use client";

import { useEffect, useState } from "react";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useMe } from "@/hooks/useIdentity";
import { useRoom } from "@/hooks/useRoom";
import { rememberRoom, saveMe } from "@/lib/identity";
import { sync } from "@/lib/sync";
import { Clock } from "./Clock";
import { IDEA_INPUT_ID, IdeaList } from "./IdeaList";
import { JoinPrompt } from "./JoinPrompt";
import { NotFound } from "./NotFound";
import { RoomHeader } from "./RoomHeader";
import { Shortcuts } from "./Shortcuts";
import { focusTaskRow, TASK_INPUT_ID, TaskList } from "./TaskList";

const focusInput = (id: string) => document.getElementById(id)?.focus();

export function RoomView({ roomId }: { roomId: string }) {
  const stored = useMe();
  const me = stored ?? null;
  const [helpOpen, setHelpOpen] = useState(false);
  const { status, room, online, error, dispatch } = useRoom(roomId, me);

  // Make sure everyone in the room knows our current name.
  const knownName = me && room ? room.members[me.id]?.name : undefined;
  useEffect(() => {
    if (me && room && knownName !== me.name) dispatch({ type: "member/upsert", member: me });
  }, [me, room, knownName, dispatch]);

  const roomName = room?.name;
  const roomDeadline = room?.deadline;
  useEffect(() => {
    if (roomName !== undefined && roomDeadline !== undefined) {
      rememberRoom({ id: roomId, name: roomName, deadline: roomDeadline });
    }
  }, [roomId, roomName, roomDeadline]);

  useHotkeys({
    n: () => focusInput(TASK_INPUT_ID),
    i: () => focusInput(IDEA_INPUT_ID),
    j: () => focusTaskRow(null, 1),
    k: () => focusTaskRow(null, -1),
    "?": () => setHelpOpen(true),
    Escape: () => (document.activeElement as HTMLElement | null)?.blur(),
  });

  if (stored === undefined || status === "loading") return null;
  if (status === "missing" || status === "error" || !room) {
    return <NotFound error={status === "error" ? error : null} />;
  }
  if (!me) return <JoinPrompt teamName={room.name} onJoin={(name) => saveMe(name)} />;

  const onlineMembers = online.map((id) => room.members[id] ?? { id, name: "?" });

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 sm:px-10">
      <RoomHeader
        name={room.name}
        online={onlineMembers}
        meId={me.id}
        mode={sync.mode}
        onHelp={() => setHelpOpen(true)}
      />
      <main>
        <Clock
          start={room.createdAt}
          deadline={room.deadline}
          onDeadlineChange={(deadline) => dispatch({ type: "room/deadline", deadline })}
        />
        <div className="mt-14 grid gap-14 lg:mt-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-20">
          <TaskList tasks={room.tasks} members={room.members} me={me} dispatch={dispatch} />
          <IdeaList
            ideas={room.ideas}
            lockedIdeaId={room.lockedIdeaId}
            members={room.members}
            me={me}
            dispatch={dispatch}
          />
        </div>
      </main>
      {error ? (
        <p role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-paper">
          {error}
        </p>
      ) : null}
      <Shortcuts open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
