export const LIMITS = {
  teamName: 60,
  memberName: 32,
  taskText: 200,
  ideaText: 160,
} as const;

export type Member = Readonly<{
  id: string;
  name: string;
}>;

export type Task = Readonly<{
  id: string;
  text: string;
  ownerId: string | null;
  done: boolean;
  createdAt: number;
}>;

export type Idea = Readonly<{
  id: string;
  text: string;
  authorId: string;
  voterIds: readonly string[];
  createdAt: number;
}>;

export type Room = Readonly<{
  name: string;
  createdAt: number;
  deadline: number;
  lockedIdeaId: string | null;
  members: Readonly<Record<string, Member>>;
  tasks: readonly Task[];
  ideas: readonly Idea[];
}>;

/**
 * Every change to a room is one of these. Actions are designed to be
 * idempotent (setters, not toggles) so replaying or receiving one twice
 * never corrupts state.
 */
export type Action =
  | { type: "room/create"; name: string; deadline: number; at: number }
  | { type: "room/rename"; name: string }
  | { type: "room/deadline"; deadline: number }
  | { type: "member/upsert"; member: Member }
  | { type: "task/add"; id: string; text: string; at: number }
  | { type: "task/done"; id: string; done: boolean }
  | { type: "task/owner"; id: string; ownerId: string | null }
  | { type: "task/remove"; id: string }
  | { type: "idea/add"; id: string; text: string; authorId: string; at: number }
  | { type: "idea/vote"; id: string; memberId: string; on: boolean }
  | { type: "idea/remove"; id: string }
  | { type: "idea/lock"; id: string | null };
