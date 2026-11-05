import type { Action, Idea, Room, Task } from "./types";

const updateTask = (room: Room, id: string, patch: Partial<Task>): Room => ({
  ...room,
  tasks: room.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
});

const updateIdea = (room: Room, id: string, fn: (idea: Idea) => Idea): Room => ({
  ...room,
  ideas: room.ideas.map((i) => (i.id === id ? fn(i) : i)),
});

const setVote = (idea: Idea, memberId: string, on: boolean): Idea => {
  const has = idea.voterIds.includes(memberId);
  if (on === has) return idea;
  return {
    ...idea,
    voterIds: on
      ? [...idea.voterIds, memberId]
      : idea.voterIds.filter((v) => v !== memberId),
  };
};

/**
 * Pure reducer. `room` is null until a `room/create` action has been seen;
 * every other action is ignored before that.
 */
export function apply(room: Room | null, action: Action): Room | null {
  if (action.type === "room/create") {
    if (room) return room; // creating twice is a no-op
    return {
      name: action.name,
      createdAt: action.at,
      deadline: action.deadline,
      lockedIdeaId: null,
      members: {},
      tasks: [],
      ideas: [],
      milestones: [],
      checked: [],
    };
  }
  if (!room) return null;

  switch (action.type) {
    case "room/rename":
      return { ...room, name: action.name };
    case "room/deadline":
      return { ...room, deadline: action.deadline };
    case "member/upsert":
      return {
        ...room,
        members: { ...room.members, [action.member.id]: action.member },
      };
    case "task/add":
      if (room.tasks.some((t) => t.id === action.id)) return room;
      return {
        ...room,
        tasks: [
          ...room.tasks,
          { id: action.id, text: action.text, ownerId: null, done: false, createdAt: action.at },
        ],
      };
    case "task/done":
      return updateTask(room, action.id, { done: action.done });
    case "task/owner":
      return updateTask(room, action.id, { ownerId: action.ownerId });
    case "task/remove":
      return { ...room, tasks: room.tasks.filter((t) => t.id !== action.id) };
    case "idea/add":
      if (room.ideas.some((i) => i.id === action.id)) return room;
      return {
        ...room,
        ideas: [
          ...room.ideas,
          { id: action.id, text: action.text, authorId: action.authorId, voterIds: [], createdAt: action.at },
        ],
      };
    case "idea/vote":
      return updateIdea(room, action.id, (i) => setVote(i, action.memberId, action.on));
    case "idea/remove":
      return {
        ...room,
        ideas: room.ideas.filter((i) => i.id !== action.id),
        lockedIdeaId: room.lockedIdeaId === action.id ? null : room.lockedIdeaId,
      };
    case "idea/lock":
      if (action.id !== null && !room.ideas.some((i) => i.id === action.id)) return room;
      return { ...room, lockedIdeaId: action.id };
    case "milestone/add":
      if (room.milestones.some((m) => m.id === action.id)) return room;
      return {
        ...room,
        milestones: [...room.milestones, { id: action.id, label: action.label, at: action.at }].sort(
          (a, b) => a.at - b.at,
        ),
      };
    case "milestone/remove":
      return { ...room, milestones: room.milestones.filter((m) => m.id !== action.id) };
    case "checklist/set": {
      const has = room.checked.includes(action.item);
      if (action.done === has) return room;
      return {
        ...room,
        checked: action.done
          ? [...room.checked, action.item]
          : room.checked.filter((c) => c !== action.item),
      };
    }
  }
}

export const replay = (actions: readonly Action[]): Room | null =>
  actions.reduce<Room | null>(apply, null);
