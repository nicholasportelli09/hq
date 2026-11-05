import type { Action, Idea, Task } from "./types";

// Undo is just more events: re-add the item under its old id and re-apply
// its state. Everyone in the room sees the restore, and replay stays pure.

export function restoreTask(task: Task): Action[] {
  return [
    { type: "task/add", id: task.id, text: task.text, at: task.createdAt },
    ...(task.ownerId ? [{ type: "task/owner", id: task.id, ownerId: task.ownerId } as const] : []),
    ...(task.done ? [{ type: "task/done", id: task.id, done: true } as const] : []),
  ];
}

export function restoreIdea(idea: Idea, wasLocked: boolean): Action[] {
  return [
    { type: "idea/add", id: idea.id, text: idea.text, authorId: idea.authorId, at: idea.createdAt },
    ...idea.voterIds.map((memberId) => ({ type: "idea/vote", id: idea.id, memberId, on: true }) as const),
    ...(wasLocked ? [{ type: "idea/lock", id: idea.id } as const] : []),
  ];
}
