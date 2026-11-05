import type { Milestone } from "./types";

const HOUR = 3_600_000;

/** How long before the deadline the submission checklist appears on its own. */
export const CHECKLIST_WINDOW_MS = 6 * HOUR;

// Times are fixed instants in Helsinki time (EET, UTC+2), so the preset is
// right no matter which time zone a teammate's laptop is set to.
const helsinki = (local: string) => Date.parse(`${local}+02:00`);

export interface Preset {
  label: string;
  deadline: number;
  milestones: ReadonlyArray<Omit<Milestone, "id">>;
}

/** From the Junction 2026 Participant Guidebook, "Schedule for Hackers". */
export const JUNCTION_2026: Preset = {
  label: "Junction 2026",
  deadline: helsinki("2026-11-15T10:00:00"),
  milestones: [
    { label: "Dinner", at: helsinki("2026-11-13T19:30:00") },
    { label: "Draft submission (team count)", at: helsinki("2026-11-13T23:59:00") },
    { label: "Submissions open", at: helsinki("2026-11-14T12:00:00") },
    { label: "Lunch", at: helsinki("2026-11-14T13:00:00") },
    { label: "Dinner", at: helsinki("2026-11-14T18:00:00") },
  ],
};

export interface ChecklistItem {
  id: string;
  label: string;
}

/** Junction 2026 final-submission requirements, in the order to tackle them. */
export const SUBMISSION_CHECKLIST: readonly ChecklistItem[] = [
  { id: "basics", label: "Name, punchline and description" },
  { id: "challenge", label: "Challenge and technologies picked" },
  { id: "video", label: "2-minute video, public link (not a second longer)" },
  { id: "links", label: "Demo and source code links" },
  { id: "deck", label: "Pitch deck as PDF" },
  { id: "contacts", label: "Phone numbers and Discord names" },
  { id: "final", label: "Project set to FINAL, not draft" },
];

/** Stable ids: applying the preset twice (or from two laptops) adds each milestone once. */
export const presetMilestoneId = (index: number): string => `junction26-${index}`;

export function nextMilestone(milestones: readonly Milestone[], now: number): Milestone | null {
  return milestones.find((m) => m.at > now) ?? null;
}

export function checklistVisible(deadline: number, now: number, checked: readonly string[]): boolean {
  return checked.length > 0 || deadline - now <= CHECKLIST_WINDOW_MS;
}
