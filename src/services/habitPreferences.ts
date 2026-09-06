/**
 * Pinned habits: the section types shown as chips under the composer and as
 * dots on the calendar. A device preference like week start and weather;
 * the notes themselves carry the completions.
 */

import { PINNED_HABITS_KEY } from "../utils/constants";
import { isValidHabitName } from "../utils/habits";
import { parseStringArray } from "../storage/parsers";
import { reportError } from "../utils/errorReporter";

const EMPTY: readonly string[] = Object.freeze([]);
const listeners = new Set<() => void>();
// Cached so repeated reads return the same reference (useSyncExternalStore
// compares snapshots by identity).
let cache: readonly string[] | null = null;

function read(): readonly string[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = localStorage.getItem(PINNED_HABITS_KEY);
  if (!raw) return EMPTY;
  try {
    const parsed = parseStringArray(JSON.parse(raw));
    if (!parsed) return EMPTY;
    const valid = parsed.filter(isValidHabitName);
    return valid.length > 0 ? Object.freeze(valid) : EMPTY;
  } catch (error) {
    reportError("habitPreferences.read", error);
    return EMPTY;
  }
}

export function getPinnedHabits(): readonly string[] {
  if (cache === null) cache = read();
  return cache;
}

export function setPinnedHabits(habits: readonly string[]): void {
  const next = Object.freeze(
    [...new Set(habits.filter(isValidHabitName))],
  );
  cache = next.length > 0 ? next : EMPTY;
  if (typeof window !== "undefined") {
    if (next.length === 0) {
      localStorage.removeItem(PINNED_HABITS_KEY);
    } else {
      localStorage.setItem(PINNED_HABITS_KEY, JSON.stringify(next));
    }
  }
  for (const listener of listeners) listener();
}

export function subscribePinnedHabits(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test hook: forget the cached value so the next read hits storage. */
export function resetPinnedHabitsCache(): void {
  cache = null;
}
