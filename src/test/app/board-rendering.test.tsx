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

    expect(screen.getByRole("heading", { name: "Kifu Study" })).toBeTruthy();
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

  it("joins all four outer grid corners", () => {
    renderApp();
    const edgeLines = Array.from(
      boardElement().querySelectorAll(".grid-lines line"),
    ).filter((line) => line.getAttribute("stroke-width") === "2.8");

    expect(edgeLines).toHaveLength(4);
    expect(
      edgeLines.every(
        (line) => line.getAttribute("stroke-linecap") === "square",
      ),
    ).toBe(true);
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

  it("keeps coordinates hidden by default and shows conventional labels when requested", () => {
    renderApp();
    const board = boardElement();
    const toggle = screen.getByRole("button", { name: "Show coordinates" });

    expect(board.querySelector(".board-coordinates")).toBeNull();
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle);

    const topLabels = Array.from(
      board.querySelectorAll('[data-coordinate-edge="top"]'),
      (label) => label.textContent,
    );
    const leftLabels = Array.from(
      board.querySelectorAll('[data-coordinate-edge="left"]'),
      (label) => label.textContent,
    );
    expect(topLabels).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
    ]);
    expect(leftLabels).toEqual([
      "19",
      "18",
      "17",
      "16",
      "15",
      "14",
      "13",
      "12",
      "11",
      "10",
      "9",
      "8",
      "7",
      "6",
      "5",
      "4",
      "3",
      "2",
      "1",
    ]);
    expect(
      board.querySelectorAll('[data-coordinate-edge="bottom"]'),
    ).toHaveLength(19);
    expect(
      board.querySelectorAll('[data-coordinate-edge="right"]'),
    ).toHaveLength(19);
    expect(
      screen.getByRole("button", { name: "Hide coordinates" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = board
      .getAttribute("viewBox")!
      .split(" ")
      .map(Number);
    expect(viewBoxX).toBeLessThan(0);
    expect(viewBoxY).toBeLessThan(0);
    expect(viewBoxWidth).toBeGreaterThan(CANVAS_SIZE);
    expect(viewBoxHeight).toBeGreaterThan(CANVAS_SIZE);

    placeSetupStone({ x: 0, y: 0 });
    expect(stoneAt({ x: 0, y: 0 })?.dataset.stone).toBe("black");
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

  it("shows and clears a stone preview while hovering an empty point", () => {
    renderApp();
    const target = boardElement().querySelector(
      '.hit-targets [data-point="4,4"]',
    );

    fireEvent.mouseEnter(target!);
    expect(boardElement().querySelector(".point-preview circle")).toBeTruthy();

    fireEvent.mouseLeave(target!);
    expect(boardElement().querySelector(".point-preview")).toBeNull();
  });
});
