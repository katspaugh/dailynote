import { describe, expect, it } from "vitest";
import {
  clockAngles,
  pickMomentTime,
  resolveMomentDate,
  scrubberOffset,
} from "../utils/timeScrubber";

describe("pickMomentTime", () => {
  const markers = [
    { top: 0, time: "now" },
    { top: 120, time: "2026-09-04T16:42:00" },
    { top: 300, time: "2026-09-04T13:10:00" },
    { top: 520, time: "2026-09-04T07:02:00" },
  ];

  it("returns null with no markers", () => {
    expect(pickMomentTime([], 100)).toBeNull();
  });

  it("picks the last marker at or above y", () => {
    expect(pickMomentTime(markers, 0)).toBe("now");
    expect(pickMomentTime(markers, 119)).toBe("now");
    expect(pickMomentTime(markers, 120)).toBe("2026-09-04T16:42:00");
    expect(pickMomentTime(markers, 450)).toBe("2026-09-04T13:10:00");
    expect(pickMomentTime(markers, 9999)).toBe("2026-09-04T07:02:00");
  });

  it("falls back to the first marker when y is above all of them", () => {
    expect(pickMomentTime(markers.slice(1), 10)).toBe("2026-09-04T16:42:00");
  });
});

describe("scrubberOffset", () => {
  it("is null when the pane does not scroll", () => {
    expect(scrubberOffset(0, 500, 500, 44, 12)).toBeNull();
    expect(scrubberOffset(0, 400, 500, 44, 12)).toBeNull();
  });

  it("moves from the top margin to the bottom margin with scroll progress", () => {
    expect(scrubberOffset(0, 2000, 500, 44, 12)).toBe(12);
    expect(scrubberOffset(1500, 2000, 500, 44, 12)).toBe(500 - 44 - 12);
    expect(scrubberOffset(750, 2000, 500, 44, 12)).toBe(12 + (500 - 44 - 24) / 2);
  });

  it("clamps overscroll", () => {
    expect(scrubberOffset(-50, 2000, 500, 44, 12)).toBe(12);
    expect(scrubberOffset(5000, 2000, 500, 44, 12)).toBe(500 - 44 - 12);
  });
});

describe("clockAngles", () => {
  it("points both hands at 12 at midnight", () => {
    expect(clockAngles(new Date(2026, 8, 4, 0, 0))).toEqual({ hour: 0, minute: 0 });
  });

  it("advances the hour hand with the minutes", () => {
    expect(clockAngles(new Date(2026, 8, 4, 15, 30))).toEqual({ hour: 105, minute: 180 });
  });

  it("wraps 12-hour", () => {
    expect(clockAngles(new Date(2026, 8, 4, 12, 0)).hour).toBe(0);
  });
});

describe("resolveMomentDate", () => {
  const now = new Date(2026, 8, 4, 13, 7);

  it("treats 'now' as the present", () => {
    expect(resolveMomentDate("now", now)).toBe(now);
  });

  it("parses ISO timestamps", () => {
    expect(resolveMomentDate("2026-09-04T07:02:00", now)?.getHours()).toBe(7);
  });

  it("returns null for garbage", () => {
    expect(resolveMomentDate("not a date", now)).toBeNull();
  });
});
