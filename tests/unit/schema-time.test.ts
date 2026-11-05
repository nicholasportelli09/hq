import { describe, expect, it } from "vitest";
import { parseAction, parseActions } from "@/lib/room/schema";
import { countdown, initials, progress } from "@/lib/room/time";
import { isRoomId, roomId } from "@/lib/room/ids";

describe("parseAction", () => {
  it("accepts a valid action and trims text", () => {
    expect(parseAction({ type: "task/add", id: "t1", text: "  Ship  ", at: 1 })).toEqual({
      type: "task/add",
      id: "t1",
      text: "Ship",
      at: 1,
    });
  });

  it("rejects unknown types, empty text and oversized text", () => {
    expect(parseAction({ type: "nuke" })).toBeNull();
    expect(parseAction({ type: "task/add", id: "t1", text: "   ", at: 1 })).toBeNull();
    expect(parseAction({ type: "task/add", id: "t1", text: "x".repeat(201), at: 1 })).toBeNull();
  });

  it("drops invalid entries from a list instead of failing the whole room", () => {
    const list = parseActions([{ type: "task/remove", id: "t1" }, { bad: true }, null]);
    expect(list).toEqual([{ type: "task/remove", id: "t1" }]);
    expect(parseActions("not an array")).toEqual([]);
  });
});

describe("countdown", () => {
  const H = 3_600_000;

  it("shows total hours without wrapping into days", () => {
    expect(countdown(41 * H + 12 * 60_000 + 9_000, 0)).toMatchObject({
      hours: "41",
      minutes: "12",
      seconds: "09",
      phase: "running",
    });
  });

  it("enters the final phase inside the last hour and stops at zero", () => {
    expect(countdown(H, 0).phase).toBe("final");
    expect(countdown(H + 1, 0).phase).toBe("running");
    expect(countdown(100, 500)).toMatchObject({ hours: "00", seconds: "00", phase: "over" });
  });

  it("rounds partial seconds up so the clock never shows 0 while time remains", () => {
    expect(countdown(400, 0)).toMatchObject({ seconds: "01", phase: "final" });
  });
});

describe("progress", () => {
  it("clamps between 0 and 1", () => {
    expect(progress(0, 100, -5)).toBe(0);
    expect(progress(0, 100, 50)).toBe(0.5);
    expect(progress(0, 100, 500)).toBe(1);
    expect(progress(100, 100, 100)).toBe(1);
  });
});

describe("initials", () => {
  it("uses first and last name, or the first two letters", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("Grace Brewster Hopper")).toBe("GH");
    expect(initials("nico")).toBe("NI");
    expect(initials("   ")).toBe("?");
  });
});

describe("room ids", () => {
  it("generates readable, valid ids", () => {
    const id = roomId();
    expect(isRoomId(id)).toBe(true);
    expect(isRoomId("short")).toBe(false);
    expect(isRoomId("OOOOOOOOOOOO")).toBe(false);
  });
});
