import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  boardElement,
  clientPoint,
  clickPoint,
  dragSetupStonePath,
  markAt,
  placeSetupStone,
  stoneAt,
} from "./support/board";
import { renderApp } from "./support/render";

describe("setup mode", () => {
  it("places either color freely and selects an occupied point on click", () => {
    renderApp();

    placeSetupStone({ x: 1, y: 1 });
    fireEvent.click(screen.getByRole("button", { name: "White" }));
    placeSetupStone({ x: 2, y: 2 });

    expect(stoneAt({ x: 1, y: 1 })?.dataset.stone).toBe("black");
    expect(stoneAt({ x: 2, y: 2 })?.dataset.stone).toBe("white");
    expect(stoneAt({ x: 1, y: 1 })?.dataset.moveNumber).toBeUndefined();

    placeSetupStone({ x: 1, y: 1 }, 2);
    expect(stoneAt({ x: 1, y: 1 })?.dataset.selectedStone).toBe("true");

    placeSetupStone({ x: 1, y: 1 }, 3);
    expect(stoneAt({ x: 1, y: 1 })?.dataset.selectedStone).toBeUndefined();
  });

  it("removes a selected stone and its mark through undoable history", () => {
    renderApp();
    placeSetupStone({ x: 3, y: 3 });
    fireEvent.click(screen.getByRole("button", { name: "Triangle label" }));
    clickPoint({ x: 3, y: 3 });
    fireEvent.click(screen.getByRole("button", { name: "Place stones" }));
    placeSetupStone({ x: 3, y: 3 }, 2);

    fireEvent.keyDown(window, { key: "Delete" });
    expect(stoneAt({ x: 3, y: 3 })).toBeNull();
    expect(markAt({ x: 3, y: 3 })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(stoneAt({ x: 3, y: 3 })?.querySelector("polygon")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(stoneAt({ x: 3, y: 3 })).toBeNull();
  });

  it("previews and commits a turning drag as one history action", () => {
    renderApp();
    const board = dragSetupStonePath([
      { x: 1, y: 1 },
      { x: 4, y: 1 },
      { x: 4, y: 3 },
    ]);

    expect(board.dataset.setupDragState).toBe("preview");
    expect(board.querySelectorAll("[data-preview-point]")).toHaveLength(6);

    fireEvent.pointerUp(board, {
      ...clientPoint({ x: 4, y: 3 }, board),
      button: 0,
      pointerId: 1,
    });
    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(6);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(0);
    expect(
      (screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(6);
  });

  it("supports vertical-first turns without duplicating crossed points", () => {
    renderApp();
    const board = dragSetupStonePath([
      { x: 5, y: 1 },
      { x: 5, y: 4 },
      { x: 3, y: 4 },
      { x: 5, y: 4 },
    ]);

    expect(board.querySelectorAll("[data-preview-point]")).toHaveLength(6);
    fireEvent.pointerUp(board, {
      ...clientPoint({ x: 5, y: 4 }, board),
      button: 0,
      pointerId: 1,
    });
    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(6);
  });

  it("cancels a drag that crosses an occupied point", () => {
    renderApp();
    placeSetupStone({ x: 2, y: 1 });

    const board = dragSetupStonePath([
      { x: 0, y: 1 },
      { x: 4, y: 1 },
    ]);

    expect(board.dataset.setupDragState).toBe("canceled");
    expect(board.querySelectorAll("[data-preview-point]")).toHaveLength(0);

    fireEvent.pointerUp(board, {
      ...clientPoint({ x: 4, y: 1 }, board),
      button: 0,
      pointerId: 1,
    });
    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(0);
  });

  it("cancels moved occupied starts and interrupted drags", () => {
    renderApp();
    placeSetupStone({ x: 1, y: 1 });

    let board = dragSetupStonePath([
      { x: 1, y: 1 },
      { x: 3, y: 1 },
    ]);
    fireEvent.pointerUp(board, {
      ...clientPoint({ x: 3, y: 1 }, board),
      button: 0,
      pointerId: 1,
    });
    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(1);
    expect(stoneAt({ x: 1, y: 1 })?.dataset.selectedStone).toBeUndefined();

    board = dragSetupStonePath([{ x: 4, y: 4 }], 2);
    fireEvent.pointerMove(board, {
      button: 0,
      clientX: 0,
      clientY: 0,
      pointerId: 2,
    });
    fireEvent.pointerCancel(board, { pointerId: 2 });
    expect(stoneAt({ x: 4, y: 4 })).toBeNull();
  });

  it("ignores unrelated pointer input across setup drag boundaries", () => {
    renderApp();
    const board = boardElement();
    const start = clientPoint({ x: 1, y: 1 }, board);

    fireEvent.pointerMove(board, { ...start, pointerId: 90 });
    fireEvent.pointerUp(board, { ...start, pointerId: 90 });
    fireEvent.pointerCancel(board, { pointerId: 90 });

    fireEvent.pointerDown(board, {
      ...start,
      button: 2,
      pointerId: 1,
    });
    fireEvent.pointerDown(board, {
      button: 0,
      clientX: 0,
      clientY: 0,
      pointerId: 2,
    });
    expect(board.dataset.setupDragState).toBeUndefined();

    fireEvent.click(screen.getByRole("button", { name: "Simulation" }));
    fireEvent.pointerDown(board, {
      ...start,
      button: 0,
      pointerId: 3,
    });
    fireEvent.click(screen.getByRole("button", { name: "Setup" }));
    fireEvent.click(screen.getByRole("button", { name: "Triangle label" }));
    fireEvent.pointerDown(board, {
      ...start,
      button: 0,
      pointerId: 4,
    });
    fireEvent.click(screen.getByRole("button", { name: "Place stones" }));

    fireEvent.pointerDown(board, {
      ...start,
      button: 0,
      pointerId: 5,
    });
    fireEvent.pointerMove(board, {
      ...start,
      button: 0,
      pointerId: 5,
    });
    fireEvent.pointerMove(board, {
      ...clientPoint({ x: 4, y: 3 }, board),
      button: 0,
      pointerId: 6,
    });
    fireEvent.pointerUp(board, { ...start, pointerId: 6 });
    fireEvent.pointerCancel(board, { pointerId: 6 });

    fireEvent.pointerMove(board, {
      ...clientPoint({ x: 4, y: 3 }, board),
      button: 0,
      pointerId: 5,
    });
    vi.spyOn(board, "hasPointerCapture").mockReturnValue(false);
    fireEvent.pointerUp(board, {
      ...clientPoint({ x: 4, y: 3 }, board),
      button: 0,
      pointerId: 5,
    });

    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(6);
  });
});
