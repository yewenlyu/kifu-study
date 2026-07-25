import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { boardElement } from "./support/board";
import { renderApp } from "./support/render";

function makeStageScrollable(stage: HTMLDivElement) {
  Object.defineProperties(stage, {
    clientHeight: { configurable: true, value: 400 },
    clientWidth: { configurable: true, value: 500 },
    scrollHeight: { configurable: true, value: 900 },
    scrollWidth: { configurable: true, value: 1000 },
  });
}

describe("board panning", () => {
  it("pans only an oversized board with a moved right-drag", () => {
    const { container } = renderApp();
    const stage = container.querySelector<HTMLDivElement>(".board-stage")!;
    makeStageScrollable(stage);
    stage.scrollLeft = 100;
    stage.scrollTop = 80;

    fireEvent.pointerDown(stage, {
      button: 2,
      clientX: 10,
      clientY: 10,
      pointerId: 7,
    });
    expect(stage.classList.contains("is-panning")).toBe(true);

    fireEvent.pointerMove(stage, {
      clientX: 12,
      clientY: 12,
      pointerId: 7,
    });
    expect(stage.scrollLeft).toBe(100);
    expect(stage.scrollTop).toBe(80);

    fireEvent.pointerMove(stage, {
      clientX: 30,
      clientY: 40,
      pointerId: 7,
    });
    expect(stage.scrollLeft).toBe(80);
    expect(stage.scrollTop).toBe(50);

    fireEvent.pointerUp(stage, { pointerId: 7 });
    expect(stage.classList.contains("is-panning")).toBe(false);
  });

  it("leaves a fitting board and stationary right-click unchanged", () => {
    const { container } = renderApp();
    const stage = container.querySelector<HTMLDivElement>(".board-stage")!;

    fireEvent.pointerDown(stage, {
      button: 0,
      clientX: 10,
      clientY: 10,
      pointerId: 1,
    });
    fireEvent.pointerDown(stage, {
      button: 2,
      clientX: 10,
      clientY: 10,
      pointerId: 2,
    });
    fireEvent.pointerUp(stage, { pointerId: 2 });
    expect(stage.classList.contains("is-panning")).toBe(false);
    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(0);
    expect(fireEvent.contextMenu(stage)).toBe(false);
  });

  it("ends panning when pointer capture is lost", () => {
    const { container } = renderApp();
    const stage = container.querySelector<HTMLDivElement>(".board-stage")!;
    makeStageScrollable(stage);

    fireEvent.pointerDown(stage, { button: 2, pointerId: 4 });
    expect(stage.classList.contains("is-panning")).toBe(true);
    fireEvent.lostPointerCapture(stage, { pointerId: 4 });
    expect(stage.classList.contains("is-panning")).toBe(false);
  });
});
