/**
 * Habit tracking, derived entirely from the section types present in notes.
 * A habit is a section type (`+run`) the user has pinned; doing it on a day
 * means that day's note contains a section of that type. Nothing here is
 * stored separately from the notes themselves.
 */

import { formatDate, parseDate } from "./date";
import { sectionHueSlot } from "./sectionTypes";

/** Section types per note date ("DD-MM-YYYY"). */
export type NoteSections = ReadonlyMap<string, readonly string[]>;

/** Section type names are `[a-z][a-z-]*`, the same rule the editor enforces. */
const HABIT_NAME_RE = /^[a-z][a-z-]*$/;

export function isValidHabitName(name: string): boolean {
  return HABIT_NAME_RE.test(name);
}

/** Most habit dots a calendar cell shows; more than this stops reading. */
export const MAX_HABIT_DOTS = 3;

function shiftDay(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** True when the note for `date` contains a `+type` section. */
export function habitDoneOn(
  sections: NoteSections,
  type: string,
  date: string,
): boolean {
  return sections.get(date)?.includes(type) ?? false;
}

/**
 * Consecutive days with the habit, ending today or yesterday. A streak is not
 * broken until the day it would have to happen on is over, so a run done
 * every morning still reads as unbroken before today's entry is written.
 */
export function computeStreak(
  sections: NoteSections,
  type: string,
  today: Date,
): number {
  let cursor = today;
  if (!habitDoneOn(sections, type, formatDate(cursor))) {
    cursor = shiftDay(cursor, -1);
    if (!habitDoneOn(sections, type, formatDate(cursor))) return 0;
  }
  let streak = 0;
  while (habitDoneOn(sections, type, formatDate(cursor))) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

/** Number of days each section type appears on, for every type seen. */
export function habitDaysCount(sections: NoteSections): Map<string, number> {
  const counts = new Map<string, number>();
  for (const types of sections.values()) {
    for (const type of new Set(types)) {
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
  }
  return counts;
}

/** A pinned habit done on a day, with the palette slot that colours it. */
export interface HabitMark {
  type: string;
  slot: number;
}

const NO_MARKS: HabitMark[] = [];

/**
 * Pinned habits done on `date`, in pin order, capped so a calendar cell never
 * carries more dots than it can show.
 */
export function habitMarksOn(
  sections: NoteSections,
  pinned: readonly string[],
  date: string,
): HabitMark[] {
  const done = sections.get(date);
  if (!done || done.length === 0 || pinned.length === 0) return NO_MARKS;
  const marks: HabitMark[] = [];
  for (const type of pinned) {
    if (done.includes(type)) {
      marks.push({ type, slot: sectionHueSlot(type) });
      if (marks.length === MAX_HABIT_DOTS) break;
    }
  }
  return marks.length > 0 ? marks : NO_MARKS;
}

/** Sort section types by days seen (desc), then name, for a stable list. */
export function sortByDaysCount(
  counts: ReadonlyMap<string, number>,
): Array<{ type: string; days: number }> {
  return [...counts.entries()]
    .map(([type, days]) => ({ type, days }))
    .sort((a, b) => b.days - a.days || a.type.localeCompare(b.type));
}

/** Merge today's live content into the stored map so streaks respond to
 *  the entry just written, before the database subscription catches up. */
export function withTodaySections(
  sections: NoteSections,
  today: string,
  todayTypes: readonly string[],
): NoteSections {
  if (!parseDate(today)) return sections;
  const merged = new Map(sections);
  merged.set(today, todayTypes);
  return merged;
}
