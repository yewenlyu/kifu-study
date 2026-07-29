import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  clickPoint,
  markAt,
  placeSetupStone,
  stoneAt,
} from "./support/board";
import { renderApp } from "./support/render";

describe("diagram marks", () => {
  it("renders an opaque circle marker on an empty point", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Circle label" }));
    clickPoint({ x: 2, y: 0 });

    const circle = markAt({ x: 2, y: 0 })?.querySelector("circle");
    expect(circle?.getAttribute("fill")).toBe("#ffffff");
    expect(circle?.getAttribute("stroke")).toBe("#111111");
  });

  it("toggles both mark types with contrast on black, white, and empty points", () => {
    renderApp();
    placeSetupStone({ x: 0, y: 0 });
    fireEvent.click(screen.getByRole("button", { name: "White" }));
    placeSetupStone({ x: 1, y: 0 });

    fireEvent.click(screen.getByRole("button", { name: "Triangle label" }));
    clickPoint({ x: 0, y: 0 });
    clickPoint({ x: 1, y: 0 });
    clickPoint({ x: 2, y: 0 });

    expect(
      stoneAt({ x: 0, y: 0 })?.querySelector("polygon")?.getAttribute("fill"),
    ).toBe("#ffffff");
    expect(
      stoneAt({ x: 1, y: 0 })?.querySelector("polygon")?.getAttribute("fill"),
    ).toBe("#111111");
    expect(markAt({ x: 2, y: 0 })?.dataset.mark).toBe("triangle");
    expect(markAt({ x: 2, y: 0 })?.querySelector("polygon")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Circle label" }));
    clickPoint({ x: 0, y: 0 });
    const circle = stoneAt({ x: 0, y: 0 })?.querySelectorAll("circle")[1];
    expect(circle?.getAttribute("fill")).toBe("none");
    expect(circle?.getAttribute("stroke")).toBe("#ffffff");

    clickPoint({ x: 0, y: 0 });
    expect(stoneAt({ x: 0, y: 0 })?.querySelectorAll("circle")).toHaveLength(
      1,
    );
  });
});
