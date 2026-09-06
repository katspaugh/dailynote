// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  getPinnedHabits,
  setPinnedHabits,
  subscribePinnedHabits,
  resetPinnedHabitsCache,
} from "../services/habitPreferences";
import { PINNED_HABITS_KEY } from "../utils/constants";

describe("habitPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPinnedHabitsCache();
  });

  it("is empty by default", () => {
    expect(getPinnedHabits()).toEqual([]);
  });

  it("round-trips through localStorage", () => {
    setPinnedHabits(["run", "read"]);
    resetPinnedHabitsCache();
    expect(getPinnedHabits()).toEqual(["run", "read"]);
    expect(JSON.parse(localStorage.getItem(PINNED_HABITS_KEY)!)).toEqual(["run", "read"]);
  });

  it("returns the same reference between writes", () => {
    setPinnedHabits(["run"]);
    expect(getPinnedHabits()).toBe(getPinnedHabits());
  });

  it("drops invalid names and duplicates", () => {
    setPinnedHabits(["run", "Run", "run", "", "book-notes"]);
    expect(getPinnedHabits()).toEqual(["run", "book-notes"]);
  });

  it("clears storage when nothing is pinned", () => {
    setPinnedHabits(["run"]);
    setPinnedHabits([]);
    expect(localStorage.getItem(PINNED_HABITS_KEY)).toBeNull();
    expect(getPinnedHabits()).toEqual([]);
  });

  it("ignores malformed stored values", () => {
    localStorage.setItem(PINNED_HABITS_KEY, "{not json");
    expect(getPinnedHabits()).toEqual([]);
    resetPinnedHabitsCache();
    localStorage.setItem(PINNED_HABITS_KEY, JSON.stringify({ run: true }));
    expect(getPinnedHabits()).toEqual([]);
    resetPinnedHabitsCache();
    localStorage.setItem(PINNED_HABITS_KEY, JSON.stringify(["run", 3]));
    expect(getPinnedHabits()).toEqual([]);
  });

  it("notifies subscribers on change and stops after unsubscribe", () => {
    let calls = 0;
    const unsubscribe = subscribePinnedHabits(() => {
      calls += 1;
    });
    setPinnedHabits(["run"]);
    expect(calls).toBe(1);
    unsubscribe();
    setPinnedHabits(["read"]);
    expect(calls).toBe(1);
  });
});
