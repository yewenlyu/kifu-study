import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  boardElement,
  placeSetupStone,
  stoneAt,
} from "./support/board";
import { isPressed } from "./support/controls";
import { renderApp } from "./support/render";

describe("keyboard shortcuts", () => {
  it("supports mode, color, tool, board, undo, and redo commands", () => {
    renderApp();

    fireEvent.keyDown(window, { key: "x" });
    expect(isPressed(screen.getByRole("button", { name: "White" }))).toBe(true);

    fireEvent.keyDown(window, { key: "t" });
    expect(
      isPressed(screen.getByRole("button", { name: "Triangle label" })),
    ).toBe(true);
    fireEvent.keyDown(window, { key: "t" });
    expect(
      isPressed(screen.getByRole("button", { name: "Circle label" })),
    ).toBe(true);
    fireEvent.keyDown(window, { key: "t" });
    expect(
      isPressed(screen.getByRole("button", { name: "Place stones" })),
    ).toBe(true);

    fireEvent.keyDown(window, { key: "m" });
    expect(isPressed(screen.getByRole("button", { name: "Setup" }))).toBe(true);
    fireEvent.keyDown(window, { key: "s" });
    expect(
      isPressed(screen.getByRole("button", { name: "Simulation" })),
    ).toBe(true);
    fireEvent.keyDown(window, { key: "x" });
    expect(isPressed(screen.getByRole("button", { name: "White" }))).toBe(true);
    expect(isPressed(screen.getByRole("button", { name: "Black" }))).toBe(
      false,
    );
    fireEvent.keyDown(window, { key: "s" });
    expect(isPressed(screen.getByRole("button", { name: "Setup" }))).toBe(true);

    fireEvent.keyDown(window, { key: "b" });
    expect(boardElement().dataset.boardSize).toBe("9");
    fireEvent.keyDown(window, { key: "b" });
    expect(boardElement().dataset.boardSize).toBe("13");
    fireEvent.keyDown(window, { key: "b" });
    expect(boardElement().dataset.boardSize).toBe("19");

    placeSetupStone({ x: 2, y: 2 });
    fireEvent.keyDown(window, { key: "u" });
    expect(stoneAt({ x: 2, y: 2 })).toBeNull();
    fireEvent.keyDown(window, { key: "r" });
    expect(stoneAt({ x: 2, y: 2 })).toBeTruthy();
  });

  it("leaves an empty board unchanged when clear is requested", () => {
    renderApp();

    fireEvent.keyDown(window, { key: "c" });

    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(0);
    expect(
      (screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("does not remove setup stones with Delete or Backspace", () => {
    renderApp();
    placeSetupStone({ x: 2, y: 2 });
    placeSetupStone({ x: 2, y: 2 }, 2);

    fireEvent.keyDown(window, { key: "Delete" });
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(stoneAt({ x: 2, y: 2 })?.dataset.stone).toBe("black");
  });

  it("ignores commands from editable targets, modifiers, and repeats", () => {
    const { container } = renderApp();
    const editableElements = [
      document.createElement("input"),
      document.createElement("textarea"),
      document.createElement("select"),
      document.createElement("div"),
    ];
    Object.defineProperty(editableElements[3], "isContentEditable", {
      configurable: true,
      value: true,
    });
    container.append(...editableElements);

    for (const element of editableElements) {
      fireEvent.keyDown(element, { key: "x" });
    }
    for (const ignoredState of [
      { metaKey: true },
      { ctrlKey: true },
      { altKey: true },
      { repeat: true },
    ]) {
      fireEvent.keyDown(window, { key: "x", ...ignoredState });
    }
    expect(isPressed(screen.getByRole("button", { name: "Black" }))).toBe(true);

    fireEvent.keyDown(window, { key: "x" });
    expect(isPressed(screen.getByRole("button", { name: "White" }))).toBe(true);
  });
});
