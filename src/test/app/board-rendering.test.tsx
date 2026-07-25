import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  boardElement,
  CANVAS_SIZE,
  PADDING,
  placeSetupStone,
  stoneAt,
} from "./support/board";
import { isPressed } from "./support/controls";
import { renderApp } from "./support/render";

describe("board rendering", () => {
  it("renders the complete initial 19 by 19 SVG work surface", () => {
    renderApp();
    const board = boardElement();

    expect(screen.getByRole("heading", { name: "Kipu Study" })).toBeTruthy();
    expect(screen.getByLabelText("Board controls")).toBeTruthy();
    expect(board.getAttribute("viewBox")).toBe("0 0 720 720");
    expect(board.dataset.boardSize).toBe("19");
    expect(board.querySelectorAll(".grid-lines line")).toHaveLength(38);
    expect(board.querySelectorAll(".grid-lines > circle")).toHaveLength(9);
    expect(board.querySelectorAll(".hit-targets circle")).toHaveLength(361);
    expect(board.style.width).toBe("100%");
    expect(document.querySelector(".turn-status")?.textContent).toBe(
      "Blacksetup",
    );
    expect(isPressed(screen.getByRole("button", { name: "Setup" }))).toBe(
      true,
    );
  });

  it("renders all supported board sizes with their correct star points", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "9 x 9" }));
    expect(boardElement().querySelectorAll(".hit-targets circle")).toHaveLength(
      81,
    );
    expect(
      boardElement().querySelectorAll(".grid-lines > circle"),
    ).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "13 x 13" }));
    expect(boardElement().querySelectorAll(".hit-targets circle")).toHaveLength(
      169,
    );
    expect(
      boardElement().querySelectorAll(".grid-lines > circle"),
    ).toHaveLength(9);

    fireEvent.click(screen.getByRole("button", { name: "19 x 19" }));
    expect(boardElement().querySelectorAll(".hit-targets circle")).toHaveLength(
      361,
    );
  });

  it("keeps stones tangent and white outlines equal to interior grid lines", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "White" }));
    placeSetupStone({ x: 5, y: 5 });

    const stone = stoneAt({ x: 5, y: 5 });
    const circle = stone?.querySelector("circle");
    const step = (CANVAS_SIZE - PADDING * 2) / 18;
    const radius = Number(circle?.getAttribute("r"));
    const strokeWidth = Number(circle?.getAttribute("stroke-width"));

    expect(stone?.dataset.stone).toBe("white");
    expect(circle?.getAttribute("fill")).toBe("#ffffff");
    expect(strokeWidth).toBe(1.55);
    expect(radius * 2 + strokeWidth).toBeCloseTo(step);
    expect(
      Array.from(boardElement().querySelectorAll(".grid-lines line")).some(
        (line) => line.getAttribute("stroke-width") === "1.55",
      ),
    ).toBe(true);
  });
});
