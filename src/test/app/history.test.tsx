import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  boardElement,
  clickPoint,
  markAt,
  placeSetupStone,
  stoneAt,
} from "./support/board";
import { isPressed } from "./support/controls";
import { renderApp } from "./support/render";

describe("snapshot history", () => {
  it("clears the board, returns to setup, and makes the clear undoable", () => {
    renderApp();
    placeSetupStone({ x: 4, y: 4 });
    fireEvent.click(screen.getByRole("button", { name: "Simulation" }));

    fireEvent.keyDown(window, { key: "c" });
    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(0);
    expect(isPressed(screen.getByRole("button", { name: "Setup" }))).toBe(
      true,
    );

    fireEvent.keyDown(window, { key: "u" });
    expect(stoneAt({ x: 4, y: 4 })?.dataset.stone).toBe("black");

    fireEvent.click(screen.getByRole("button", { name: "Clear board" }));
    expect(
      (screen.getByRole("button", { name: "Clear board" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("clears redo when a new board-changing branch is committed", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Triangle label" }));
    clickPoint({ x: 4, y: 4 });
    clickPoint({ x: 5, y: 5 });

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(markAt({ x: 4, y: 4 })).toBeTruthy();
    expect(markAt({ x: 5, y: 5 })).toBeNull();

    clickPoint({ x: 6, y: 6 });
    expect(
      (screen.getByRole("button", { name: "Redo" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
