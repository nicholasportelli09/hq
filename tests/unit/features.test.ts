import { describe, expect, it } from "vitest";
import {
  CHECKLIST_WINDOW_MS,
  JUNCTION_2026,
  SUBMISSION_CHECKLIST,
  checklistVisible,
  nextMilestone,
  presetMilestoneId,
} from "@/lib/room/junction";
import { apply, replay } from "@/lib/room/reducer";
import { parseAction } from "@/lib/room/schema";
import type { Action, Room } from "@/lib/room/types";
import { restoreIdea, restoreTask } from "@/lib/room/undo";

const H = 3_600_000;
const create: Action = { type: "room/create", name: "T", deadline: 100 * H, at: 0 };

describe("milestones", () => {
  it("adds milestones sorted by time and ignores duplicate ids", () => {
    const room = replay([
      create,
      { type: "milestone/add", id: "b", label: "Dinner", at: 5 * H },
      { type: "milestone/add", id: "a", label: "Draft", at: 2 * H },
      { type: "milestone/add", id: "a", label: "Draft again", at: 9 * H },
    ]) as Room;
    expect(room.milestones.map((m) => m.label)).toEqual(["Draft", "Dinner"]);
  });

  it("removes milestones", () => {
    const room = replay([
      create,
      { type: "milestone/add", id: "a", label: "Draft", at: 2 * H },
      { type: "milestone/remove", id: "a" },
    ]) as Room;
    expect(room.milestones).toEqual([]);
  });

  it("finds the next upcoming milestone", () => {
    const ms = [
      { id: "a", label: "Draft", at: 2 * H },
      { id: "b", label: "Dinner", at: 5 * H },
    ];
    expect(nextMilestone(ms, 1 * H)?.label).toBe("Draft");
    expect(nextMilestone(ms, 3 * H)?.label).toBe("Dinner");
    expect(nextMilestone(ms, 6 * H)).toBeNull();
  });

  it("rejects malformed milestone actions from the network", () => {
    expect(parseAction({ type: "milestone/add", id: "a", label: "", at: 1 })).toBeNull();
    expect(parseAction({ type: "milestone/add", id: "a", label: "x".repeat(41), at: 1 })).toBeNull();
    expect(parseAction({ type: "milestone/add", id: "a", label: "Ok", at: 1 })).not.toBeNull();
  });
});

describe("submission checklist", () => {
  it("ticks and unticks items idempotently", () => {
    const room = replay([
      create,
      { type: "checklist/set", item: "video", done: true },
      { type: "checklist/set", item: "video", done: true },
      { type: "checklist/set", item: "deck", done: true },
      { type: "checklist/set", item: "deck", done: false },
    ]) as Room;
    expect(room.checked).toEqual(["video"]);
  });

  it("appears in the final window, or earlier once anything is ticked", () => {
    const deadline = 100 * H;
    expect(checklistVisible(deadline, deadline - CHECKLIST_WINDOW_MS - 1, [])).toBe(false);
    expect(checklistVisible(deadline, deadline - CHECKLIST_WINDOW_MS, [])).toBe(true);
    expect(checklistVisible(deadline, 0, ["video"])).toBe(true);
  });

  it("covers every Junction 2026 submission requirement with unique ids", () => {
    const ids = SUBMISSION_CHECKLIST.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["video", "deck", "links", "final"]));
  });
});

describe("Junction 2026 preset", () => {
  it("uses the official Helsinki deadline: Sunday 15 Nov 2026, 10:00 EET", () => {
    expect(new Date(JUNCTION_2026.deadline).toISOString()).toBe("2026-11-15T08:00:00.000Z");
  });

  it("only has milestones before the deadline", () => {
    for (const m of JUNCTION_2026.milestones) expect(m.at).toBeLessThan(JUNCTION_2026.deadline);
  });
});

describe("undo", () => {
  it("restores a deleted task with its owner and done state", () => {
    const before = replay([
      create,
      { type: "task/add", id: "t1", text: "Ship", at: 7 },
      { type: "task/owner", id: "t1", ownerId: "m1" },
      { type: "task/done", id: "t1", done: true },
    ]) as Room;
    const task = before.tasks[0];
    const deleted = apply(before, { type: "task/remove", id: "t1" }) as Room;
    const restored = restoreTask(task).reduce<Room | null>(apply, deleted) as Room;
    expect(restored.tasks).toEqual(before.tasks);
  });

  it("restores a deleted idea with its votes and lock", () => {
    const before = replay([
      create,
      { type: "idea/add", id: "i1", text: "Idea", authorId: "m1", at: 3 },
      { type: "idea/vote", id: "i1", memberId: "m1", on: true },
      { type: "idea/vote", id: "i1", memberId: "m2", on: true },
      { type: "idea/lock", id: "i1" },
    ]) as Room;
    const deleted = apply(before, { type: "idea/remove", id: "i1" }) as Room;
    expect(deleted.lockedIdeaId).toBeNull();
    const restored = restoreIdea(before.ideas[0], true).reduce<Room | null>(apply, deleted) as Room;
    expect(restored.ideas).toEqual(before.ideas);
    expect(restored.lockedIdeaId).toBe("i1");
  });
});

describe("preset ids", () => {
  it("adds each Junction milestone once even if two teammates apply the preset", () => {
    const presetActions = (): Action[] =>
      JUNCTION_2026.milestones.map((m, i) => ({
        type: "milestone/add",
        id: presetMilestoneId(i),
        label: m.label,
        at: m.at,
      }));
    const room = replay([create, ...presetActions(), ...presetActions()]) as Room;
    expect(room.milestones).toHaveLength(JUNCTION_2026.milestones.length);
  });
});
