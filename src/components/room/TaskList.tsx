"use client";

import type { KeyboardEvent } from "react";
import { uid } from "@/lib/room/ids";
import { LIMITS, type Action, type Member, type Task } from "@/lib/room/types";
import { Avatar } from "./Avatar";
import { AddInput, SectionHead } from "./SectionHead";

export const TASK_INPUT_ID = "new-task";
const ROW = "[data-task-row]";

interface TaskListProps {
  tasks: readonly Task[];
  members: Readonly<Record<string, Member>>;
  me: Member;
  dispatch: (action: Action) => void;
}

/** Move focus between task rows. Exported for the global j/k shortcuts. */
export function focusTaskRow(from: Element | null, step: 1 | -1): void {
  const rows = Array.from(document.querySelectorAll<HTMLElement>(ROW));
  if (rows.length === 0) return;
  const current = from?.closest(ROW);
  const index = current ? rows.indexOf(current as HTMLElement) : step === 1 ? -1 : rows.length;
  rows[Math.min(rows.length - 1, Math.max(0, index + step))]?.focus();
}

export function TaskList({ tasks, members, me, dispatch }: TaskListProps) {
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <section aria-labelledby="tasks-title">
      <SectionHead
        id="tasks-title"
        title="Tasks"
        meta={tasks.length > 0 ? `${open.length} open · ${done.length} done` : null}
      />
      <AddInput
        id={TASK_INPUT_ID}
        label="New task"
        placeholder="Add a task"
        maxLength={LIMITS.taskText}
        onSubmit={(text) => dispatch({ type: "task/add", id: uid(), text, at: Date.now() })}
      />
      {tasks.length === 0 ? (
        <p className="py-6 text-sm text-mute">
          Nothing yet. Write the first thing that has to happen, then press Enter.
        </p>
      ) : (
        <ul>
          {[...open, ...done].map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              owner={task.ownerId ? members[task.ownerId] : undefined}
              me={me}
              dispatch={dispatch}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface TaskRowProps {
  task: Task;
  owner: Member | undefined;
  me: Member;
  dispatch: (action: Action) => void;
}

function TaskRow({ task, owner, me, dispatch }: TaskRowProps) {
  const mine = task.ownerId === me.id;
  const toggleDone = () => dispatch({ type: "task/done", id: task.id, done: !task.done });
  const toggleClaim = () =>
    dispatch({ type: "task/owner", id: task.id, ownerId: mine ? null : me.id });
  const remove = (row: HTMLElement) => {
    focusTaskRow(row, 1);
    dispatch({ type: "task/remove", id: task.id });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.target instanceof HTMLInputElement) return;
    const keys: Record<string, () => void> = {
      x: toggleDone,
      c: toggleClaim,
      Backspace: () => remove(e.currentTarget),
      Delete: () => remove(e.currentTarget),
      j: () => focusTaskRow(e.currentTarget, 1),
      ArrowDown: () => focusTaskRow(e.currentTarget, 1),
      k: () => focusTaskRow(e.currentTarget, -1),
      ArrowUp: () => focusTaskRow(e.currentTarget, -1),
    };
    const run = keys[e.key];
    if (!run) return;
    e.preventDefault();
    e.stopPropagation();
    run();
  };

  return (
    <li
      data-task-row
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label={`${task.text}${task.done ? ", done" : ""}${owner ? `, ${owner.name}` : ""}`}
      className="animate-rise group -mx-2 flex items-center gap-3 border-b border-line px-2 py-2.5 outline-none focus-visible:bg-raise focus-visible:outline-none hover:bg-raise/60"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? "Mark as not done" : "Mark as done"}
        onClick={toggleDone}
        tabIndex={-1}
        className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[3px] border transition-colors ${task.done ? "border-ink bg-ink text-paper" : "border-ink/40 hover:border-ink"}`}
      >
        {task.done ? (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
            <path d="M2 6.5 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        ) : null}
      </button>

      <span
        className={`min-w-0 flex-1 break-words text-[15px] ${task.done ? "text-mute line-through decoration-mute/60" : ""}`}
      >
        {task.text}
      </span>

      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => remove(e.currentTarget.closest("li") as HTMLElement)}
        className="text-xs text-mute opacity-0 transition-opacity hover:text-signal group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        Delete
      </button>

      <button
        type="button"
        tabIndex={-1}
        onClick={toggleClaim}
        title={mine ? "Unclaim" : owner ? `${owner.name} — take it` : "Claim"}
        aria-label={mine ? "Unclaim task" : "Claim task"}
        className="shrink-0"
      >
        {owner ? (
          <Avatar name={owner.name} tone={mine ? "solid" : "outline"} size="sm" />
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-ink/30 text-xs text-mute transition-colors hover:border-ink hover:text-ink">
            +
          </span>
        )}
      </button>
    </li>
  );
}
