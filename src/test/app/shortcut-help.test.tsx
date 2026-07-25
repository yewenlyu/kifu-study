import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "./support/render";

describe("shortcut help", () => {
  it("opens, dismisses, and restores focus", () => {
    renderApp();
    const trigger = screen.getByRole("button", {
      name: "Keyboard shortcuts",
    });

    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
    expect(within(dialog).getAllByRole("term")).toHaveLength(9);
    const modeShortcut = within(dialog)
      .getByText("Toggle mode")
      .closest<HTMLElement>(".shortcut-help-row")!;
    const stoneShortcut = within(dialog)
      .getByText("Toggle stone")
      .closest<HTMLElement>(".shortcut-help-row")!;
    expect(
      within(modeShortcut).getByText("S", { selector: "kbd" }),
    ).toBeTruthy();
    expect(
      within(stoneShortcut).getByText("X", { selector: "kbd" }),
    ).toBeTruthy();
    expect(within(dialog).getByText("Right-click")).toBeTruthy();
    expect(within(dialog).getByText("Middle-drag")).toBeTruthy();
    expect(within(dialog).queryByText("Remove stone")).toBeNull();
    expect(within(dialog).queryByText("Deselect stone")).toBeNull();
    fireEvent.keyDown(document, { key: "a" });
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close shortcuts" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
