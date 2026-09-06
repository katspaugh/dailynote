import { describe, it, expect } from "vitest";
import {
  computeStreak,
  habitDaysCount,
  habitDoneOn,
  habitMarksOn,
  isValidHabitName,
  MAX_HABIT_DOTS,
  sortByDaysCount,
  withTodaySections,
  type NoteSections,
} from "../utils/habits";
import { sectionHueSlot } from "../utils/sectionTypes";

// Saturday 6 September 2026
const TODAY = new Date(2026, 8, 6);

function sections(entries: Record<string, string[]>): NoteSections {
  return new Map(Object.entries(entries));
}

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    const s = sections({
      "06-09-2026": ["run"],
      "05-09-2026": ["run", "read"],
      "04-09-2026": ["run"],
      "02-09-2026": ["run"],
    });
    expect(computeStreak(s, "run", TODAY)).toBe(3);
  });

  it("survives until the day is over when today is not done yet", () => {
    const s = sections({
      "05-09-2026": ["run"],
      "04-09-2026": ["run"],
    });
    expect(computeStreak(s, "run", TODAY)).toBe(2);
  });

  it("is zero when neither today nor yesterday has the habit", () => {
    const s = sections({ "04-09-2026": ["run"] });
    expect(computeStreak(s, "run", TODAY)).toBe(0);
  });

  it("ignores other section types on the same day", () => {
    const s = sections({ "06-09-2026": ["dream"] });
    expect(computeStreak(s, "run", TODAY)).toBe(0);
  });

  it("crosses a month boundary", () => {
    const s = sections({
      "02-09-2026": ["run"],
      "01-09-2026": ["run"],
      "31-08-2026": ["run"],
      "30-08-2026": ["run"],
    });
    expect(computeStreak(s, "run", new Date(2026, 8, 2))).toBe(4);
  });
});

describe("habitDoneOn", () => {
  it("reads a day's section types", () => {
    const s = sections({ "06-09-2026": ["run"] });
    expect(habitDoneOn(s, "run", "06-09-2026")).toBe(true);
    expect(habitDoneOn(s, "read", "06-09-2026")).toBe(false);
    expect(habitDoneOn(s, "run", "05-09-2026")).toBe(false);
  });
});

describe("habitDaysCount / sortByDaysCount", () => {
  it("counts each type once per day and sorts by days then name", () => {
    const s = sections({
      "06-09-2026": ["run", "run", "read"],
      "05-09-2026": ["run"],
      "04-09-2026": ["dream"],
    });
    const counts = habitDaysCount(s);
    expect(counts.get("run")).toBe(2);
    expect(counts.get("read")).toBe(1);
    expect(counts.get("dream")).toBe(1);
    expect(sortByDaysCount(counts)).toEqual([
      { type: "run", days: 2 },
      { type: "dream", days: 1 },
      { type: "read", days: 1 },
    ]);
  });
});

describe("habitMarksOn", () => {
  const s = sections({
    "06-09-2026": ["run", "read", "dream", "yoga", "walk"],
    "05-09-2026": ["dream"],
  });

  it("returns pinned habits done that day, in pin order, with hue slots", () => {
    expect(habitMarksOn(s, ["read", "run"], "06-09-2026")).toEqual([
      { type: "read", slot: sectionHueSlot("read") },
      { type: "run", slot: sectionHueSlot("run") },
    ]);
  });

  it("omits pinned habits not done that day", () => {
    expect(habitMarksOn(s, ["run"], "05-09-2026")).toEqual([]);
  });

  it("caps the number of marks a cell carries", () => {
    const marks = habitMarksOn(s, ["run", "read", "dream", "yoga", "walk"], "06-09-2026");
    expect(marks).toHaveLength(MAX_HABIT_DOTS);
  });

  it("returns a stable empty array when nothing applies", () => {
    expect(habitMarksOn(s, [], "06-09-2026")).toBe(habitMarksOn(s, ["run"], "01-01-2026"));
  });
});

describe("withTodaySections", () => {
  it("overrides today's entry without touching the source map", () => {
    const s = sections({ "05-09-2026": ["run"] });
    const merged = withTodaySections(s, "06-09-2026", ["yoga"]);
    expect(merged.get("06-09-2026")).toEqual(["yoga"]);
    expect(merged.get("05-09-2026")).toEqual(["run"]);
    expect(s.has("06-09-2026")).toBe(false);
  });

  it("returns the source map for an invalid date", () => {
    const s = sections({});
    expect(withTodaySections(s, "not-a-date", ["run"])).toBe(s);
  });
});

describe("isValidHabitName", () => {
  it("matches the section type grammar", () => {
    expect(isValidHabitName("run")).toBe(true);
    expect(isValidHabitName("book-notes")).toBe(true);
    expect(isValidHabitName("Run")).toBe(false);
    expect(isValidHabitName("-run")).toBe(false);
    expect(isValidHabitName("")).toBe(false);
    expect(isValidHabitName("run 2")).toBe(false);
  });
});

describe("sectionHueSlot", () => {
  it("stays within the palette", () => {
    for (const type of ["run", "read", "dream", "meditate", "yoga", "a", "zz-zz"]) {
      const slot = sectionHueSlot(type);
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(8);
    }
  });
});
