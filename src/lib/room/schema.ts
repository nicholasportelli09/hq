import { z } from "zod";
import { LIMITS, type Action } from "./types";

const id = z.string().min(1).max(64);
const text = (max: number) => z.string().trim().min(1).max(max);
const time = z.number().int().nonnegative();

const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("room/create"), name: text(LIMITS.teamName), deadline: time, at: time }),
  z.object({ type: z.literal("room/rename"), name: text(LIMITS.teamName) }),
  z.object({ type: z.literal("room/deadline"), deadline: time }),
  z.object({
    type: z.literal("member/upsert"),
    member: z.object({ id, name: text(LIMITS.memberName) }),
  }),
  z.object({ type: z.literal("task/add"), id, text: text(LIMITS.taskText), at: time }),
  z.object({ type: z.literal("task/done"), id, done: z.boolean() }),
  z.object({ type: z.literal("task/owner"), id, ownerId: id.nullable() }),
  z.object({ type: z.literal("task/remove"), id }),
  z.object({ type: z.literal("idea/add"), id, text: text(LIMITS.ideaText), authorId: id, at: time }),
  z.object({ type: z.literal("idea/vote"), id, memberId: id, on: z.boolean() }),
  z.object({ type: z.literal("idea/remove"), id }),
  z.object({ type: z.literal("idea/lock"), id: id.nullable() }),
  z.object({ type: z.literal("milestone/add"), id, label: text(LIMITS.milestoneLabel), at: time }),
  z.object({ type: z.literal("milestone/remove"), id }),
  z.object({
    type: z.literal("checklist/set"),
    item: z.string().min(1).max(LIMITS.checklistItemId),
    done: z.boolean(),
  }),
]);

/** Validate anything that arrives from storage or the network. */
export function parseAction(input: unknown): Action | null {
  const result = actionSchema.safeParse(input);
  return result.success ? (result.data as Action) : null;
}

export function parseActions(input: unknown): Action[] {
  if (!Array.isArray(input)) return [];
  return input.map(parseAction).filter((a): a is Action => a !== null);
}
