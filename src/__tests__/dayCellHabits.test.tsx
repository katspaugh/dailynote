// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { DayCell } from "../components/Calendar/DayCell";
import { DayCellState } from "../types";

describe("DayCell habit dots", () => {
  it("renders the plain note indicator when no habits are given", () => {
    const { container } = render(
      <DayCell day={5} date={new Date(2024, 0, 5)} state={DayCellState.Past} hasNote />,
    );
    expect(container.querySelectorAll("[data-hue-slot]")).toHaveLength(0);
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
  });

  it("renders a note dot followed by one hue dot per habit", () => {
    const { container } = render(
      <DayCell
        day={5}
        date={new Date(2024, 0, 5)}
        state={DayCellState.Past}
        hasNote
        habits={[
          { type: "run", slot: 5 },
          { type: "yoga", slot: 4 },
        ]}
      />,
    );
    const dots = container.querySelectorAll("[aria-hidden='true'] > span");
    expect(dots).toHaveLength(3);
    expect(dots[0].getAttribute("data-hue-slot")).toBeNull();
    expect(dots[1].getAttribute("data-hue-slot")).toBe("5");
    expect(dots[2].getAttribute("data-hue-slot")).toBe("4");
  });

  it("names the habits in the accessible label", () => {
    const { container } = render(
      <DayCell
        day={5}
        date={new Date(2024, 0, 5)}
        state={DayCellState.Past}
        hasNote
        habits={[{ type: "run", slot: 5 }]}
      />,
    );
    const cell = container.querySelector("[role='button']");
    expect(cell?.getAttribute("aria-label")).toContain("has note, habits: run");
  });
});
