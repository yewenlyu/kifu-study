import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  clickPoint,
  placeSetupStone,
  stoneAt,
} from "./support/board";
import { renderApp } from "./support/render";

describe("simulation mode", () => {
  it("honors the chosen first player, alternates colors, and numbers moves", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Simulation" }));
    fireEvent.click(screen.getByRole("button", { name: "White" }));

    clickPoint({ x: 3, y: 3 });
    clickPoint({ x: 4, y: 3 });

    expect(stoneAt({ x: 3, y: 3 })?.dataset.stone).toBe("white");
    expect(stoneAt({ x: 3, y: 3 })?.dataset.moveNumber).toBe("1");
    expect(stoneAt({ x: 4, y: 3 })?.dataset.stone).toBe("black");
    expect(stoneAt({ x: 4, y: 3 })?.dataset.moveNumber).toBe("2");
    expect(screen.getByText(/to play · Move 3/)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Black" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "White" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.keyDown(window, { key: "s" });
    expect(screen.getByText(/to play · Move 3/)).toBeTruthy();
  });

  it("rejects occupied moves without advancing the turn and clears the notice", () => {
    vi.useFakeTimers();
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Simulation" }));
    clickPoint({ x: 2, y: 2 });
    clickPoint({ x: 2, y: 2 });

    expect(screen.getByRole("status").textContent).toBe(
      "That intersection is occupied.",
    );
    expect(screen.getByText(/to play · Move 2/)).toBeTruthy();

    act(() => vi.advanceTimersByTime(2400));
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("rejects self-capture without creating history", () => {
    renderApp();
    for (const point of [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ]) {
      placeSetupStone(point);
    }

    fireEvent.click(screen.getByRole("button", { name: "Simulation" }));
    fireEvent.click(screen.getByRole("button", { name: "White" }));
    clickPoint({ x: 1, y: 1 });

    expect(stoneAt({ x: 1, y: 1 })).toBeNull();
    expect(screen.getByRole("status").textContent).toBe(
      "Self-capture is not allowed.",
    );
    expect(document.querySelector(".turn-status")?.textContent).toBe(
      "Whiteto play",
    );
  });

  it("captures connected groups and restores captures through undo and redo", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "White" }));
    placeSetupStone({ x: 1, y: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Black" }));
    for (const point of [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 2, y: 1 },
    ]) {
      placeSetupStone(point);
    }

    fireEvent.click(screen.getByRole("button", { name: "Simulation" }));
    clickPoint({ x: 1, y: 2 });

    expect(stoneAt({ x: 1, y: 1 })).toBeNull();
    expect(document.querySelector(".capture-count")?.textContent).toBe(
      "Captures  B 1 · W 0",
    );

    fireEvent.keyDown(window, { key: "u" });
    expect(stoneAt({ x: 1, y: 1 })?.dataset.stone).toBe("white");
    expect(stoneAt({ x: 1, y: 2 })).toBeNull();
    expect(document.querySelector(".capture-count")?.textContent).toBe(
      "Captures  B 0 · W 0",
    );

    fireEvent.keyDown(window, { key: "r" });
    expect(stoneAt({ x: 1, y: 1 })).toBeNull();
    expect(stoneAt({ x: 1, y: 2 })?.dataset.moveNumber).toBe("1");
    expect(document.querySelector(".capture-count")?.textContent).toBe(
      "Captures  B 1 · W 0",
    );
  });

  it("keeps a changed first player across past and future snapshots", () => {
    renderApp();
    placeSetupStone({ x: 0, y: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    fireEvent.click(screen.getByRole("button", { name: "Simulation" }));
    fireEvent.click(screen.getByRole("button", { name: "White" }));
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    clickPoint({ x: 2, y: 2 });

    expect(stoneAt({ x: 2, y: 2 })?.dataset.stone).toBe("white");
    expect(stoneAt({ x: 2, y: 2 })?.dataset.moveNumber).toBe("1");
  });

  it("renders triple-digit move numbers on stones", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Simulation" }));

    for (let y = 0; y < 19; y += 2) {
      for (let x = 0; x < 19; x += 2) {
        clickPoint({ x, y });
      }
    }

    const hundredth = stoneAt({ x: 18, y: 18 });
    const first = stoneAt({ x: 0, y: 0 });
    expect(hundredth?.dataset.moveNumber).toBe("100");
    expect(
      Number(hundredth?.querySelector("text")?.getAttribute("font-size")),
    ).toBeLessThan(
      Number(first?.querySelector("text")?.getAttribute("font-size")),
    );
  });
});
