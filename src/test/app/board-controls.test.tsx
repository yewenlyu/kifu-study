import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  boardElement,
  placeSetupStone,
  stoneAt,
} from "./support/board";
import { renderApp } from "./support/render";

describe("board controls", () => {
  it("steps through every zoom level and resets zoom", () => {
    renderApp();
    const zoomOut = screen.getByRole("button", { name: "Zoom out" });
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    const reset = screen.getByRole("button", { name: "Reset zoom" });

    expect(screen.getByText("100%")).toBeTruthy();
    expect((reset as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(zoomOut);
    expect(screen.getByText("80%")).toBeTruthy();
    expect(boardElement().style.width).toBe("80%");
    expect((zoomOut as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    expect(screen.getByText("160%")).toBeTruthy();
    expect(boardElement().style.maxWidth).toBe("1312px");
    expect((zoomIn as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(reset);
    expect(screen.getByText("100%")).toBeTruthy();
    expect((reset as HTMLButtonElement).disabled).toBe(true);
  });

  it("confirms destructive size changes and resets board history and zoom", () => {
    renderApp();
    placeSetupStone({ x: 1, y: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    fireEvent.click(screen.getByRole("button", { name: "9 x 9" }));
    expect(confirm).toHaveBeenCalledWith(
      "Changing the board size clears the current board.",
    );
    expect(boardElement().dataset.boardSize).toBe("19");
    expect(stoneAt({ x: 1, y: 1 })).toBeTruthy();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "9 x 9" }));
    expect(boardElement().dataset.boardSize).toBe("9");
    expect(boardElement().querySelectorAll("[data-stone]")).toHaveLength(0);
    expect(screen.getByText("100%")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
