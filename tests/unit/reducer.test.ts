import { describe, expect, it } from "vitest";
import { apply, replay } from "@/lib/room/reducer";
import type { Action, Room } from "@/lib/room/types";

const create: Action = { type: "room/create", name: "Team", deadline: 2_000, at: 1_000 };
const base = (): Room => replay([create]) as Room;

describe("room reducer", () => {
  it("ignores every action until the room is created", () => {
    expect(apply(null, { type: "task/add", id: "t1", text: "x", at: 1 })).toBeNull();
  });

  it("creates a room once and treats a second create as a no-op", () => {
    const room = base();
    const again = apply(room, { ...create, name: "Other" } as Action);
    expect(again).toBe(room);
    expect(room.name).toBe("Team");
  });

  it("adds tasks idempotently so a duplicated event never doubles a task", () => {
    const add: Action = { type: "task/add", id: "t1", text: "Build API", at: 5 };
    const room = replay([create, add, add]) as Room;
    expect(room.tasks).toHaveLength(1);
    expect(room.tasks[0]).toMatchObject({ text: "Build API", done: false, ownerId: null });
  });

  it("sets done and owner without mutating the previous state", () => {
    const before = replay([create, { type: "task/add", id: "t1", text: "a", at: 1 }]) as Room;
    const after = apply(before, { type: "task/done", id: "t1", done: true }) as Room;
    const owned = apply(after, { type: "task/owner", id: "t1", ownerId: "m1" }) as Room;
    expect(before.tasks[0].done).toBe(false);
    expect(after.tasks[0].done).toBe(true);
    expect(owned.tasks[0].ownerId).toBe("m1");
  });

  it("removes tasks", () => {
    const room = replay([
      create,
      { type: "task/add", id: "t1", text: "a", at: 1 },
      { type: "task/remove", id: "t1" },
    ]) as Room;
    expect(room.tasks).toEqual([]);
  });

  it("counts each member's vote once no matter how many times it arrives", () => {
    const room = replay([
      create,
      { type: "idea/add", id: "i1", text: "Idea", authorId: "m1", at: 1 },
      { type: "idea/vote", id: "i1", memberId: "m2", on: true },
      { type: "idea/vote", id: "i1", memberId: "m2", on: true },
      { type: "idea/vote", id: "i1", memberId: "m3", on: true },
      { type: "idea/vote", id: "i1", memberId: "m3", on: false },
    ]) as Room;
    expect(room.ideas[0].voterIds).toEqual(["m2"]);
  });

  it("only locks ideas that exist, and unlocks when the locked idea is removed", () => {
    const withIdea = replay([
      create,
      { type: "idea/add", id: "i1", text: "Idea", authorId: "m1", at: 1 },
    ]) as Room;
    expect(apply(withIdea, { type: "idea/lock", id: "nope" })).toBe(withIdea);

    const locked = apply(withIdea, { type: "idea/lock", id: "i1" }) as Room;
    expect(locked.lockedIdeaId).toBe("i1");

    const removed = apply(locked, { type: "idea/remove", id: "i1" }) as Room;
    expect(removed.lockedIdeaId).toBeNull();
  });

  it("upserts members by id", () => {
    const room = replay([
      create,
      { type: "member/upsert", member: { id: "m1", name: "Ada" } },
      { type: "member/upsert", member: { id: "m1", name: "Ada L" } },
    ]) as Room;
    expect(room.members).toEqual({ m1: { id: "m1", name: "Ada L" } });
  });

  it("updates name and deadline", () => {
    const room = replay([
      create,
      { type: "room/rename", name: "New" },
      { type: "room/deadline", deadline: 9_000 },
    ]) as Room;
    expect(room).toMatchObject({ name: "New", deadline: 9_000 });
  });
});
