"use client";

import { useEffect, useState } from "react";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useMe } from "@/hooks/useIdentity";
import { useRoom } from "@/hooks/useRoom";
import { useUndo } from "@/hooks/useUndo";
import { rememberRoom, saveMe } from "@/lib/identity";
import type { Idea, Task } from "@/lib/room/types";
import { restoreIdea, restoreTask } from "@/lib/room/undo";
import { sync } from "@/lib/sync";
import { Clock } from "./Clock";
import { IDEA_INPUT_ID, IdeaList } from "./IdeaList";
import { JoinPrompt } from "./JoinPrompt";
import { MilestonesSheet } from "./MilestonesSheet";
import { NotFound } from "./NotFound";
import { RoomHeader } from "./RoomHeader";
import { Shortcuts } from "./Shortcuts";
import { SubmissionChecklist } from "./SubmissionChecklist";
import { focusTaskRow, TASK_INPUT_ID, TaskList } from "./TaskList";
import { UndoToast } from "./UndoToast";

const focusInput = (id: string) => document.getElementById(id)?.focus();

interface RoomViewProps {
  roomId: string;
}

export function RoomView({ roomId }: RoomViewProps) {
  const stored = useMe();
  const me = stored ?? null;
  const [helpOpen, setHelpOpen] = useState(false);
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [checklistForced, setChecklistForced] = useState(false);
  const { status, room, online, error, dispatch } = useRoom(roomId, me);
  const { offer, propose, undo } = useUndo(dispatch);

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
    m: () => setMilestonesOpen(true),
    s: () => setChecklistForced((v) => !v),
    "?": () => setHelpOpen(true),
    Escape: () => (document.activeElement as HTMLElement | null)?.blur(),
  });

  if (stored === undefined || status === "loading") return null;
  if (status === "missing" || status === "error" || !room) {
    return <NotFound error={status === "error" ? error : null} />;
  }
  if (!me) return <JoinPrompt teamName={room.name} onJoin={(name) => saveMe(name)} />;

  const onlineMembers = online.map((id) => room.members[id] ?? { id, name: "?" });

  const removeTask = (task: Task) => {
    dispatch({ type: "task/remove", id: task.id });
    propose("Task deleted", restoreTask(task));
  };
  const removeIdea = (idea: Idea) => {
    const wasLocked = room.lockedIdeaId === idea.id;
    dispatch({ type: "idea/remove", id: idea.id });
    propose("Idea deleted", restoreIdea(idea, wasLocked));
  };

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
          milestones={room.milestones}
          onDeadlineChange={(deadline) => dispatch({ type: "room/deadline", deadline })}
          onManageMilestones={() => setMilestonesOpen(true)}
        />
        <div className="mt-14 grid gap-14 lg:mt-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-20">
          <TaskList
            tasks={room.tasks}
            members={room.members}
            me={me}
            dispatch={dispatch}
            onRemove={removeTask}
          />
          <div>
            <SubmissionChecklist
              deadline={room.deadline}
              checked={room.checked}
              forced={checklistForced}
              dispatch={dispatch}
            />
            <IdeaList
              ideas={room.ideas}
              lockedIdeaId={room.lockedIdeaId}
              members={room.members}
              me={me}
              dispatch={dispatch}
              onRemove={removeIdea}
            />
          </div>
        </div>
      </main>
      {error ? (
        <p role="status" className="fixed bottom-16 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-paper">
          {error}
        </p>
      ) : null}
      <UndoToast offer={offer} onUndo={undo} />
      <Shortcuts open={helpOpen} onClose={() => setHelpOpen(false)} />
      <MilestonesSheet
        open={milestonesOpen}
        onClose={() => setMilestonesOpen(false)}
        milestones={room.milestones}
        deadline={room.deadline}
        dispatch={dispatch}
      />
    </div>
  );
}
