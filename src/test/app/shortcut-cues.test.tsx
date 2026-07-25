import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "./support/render";

describe("shortcut cues", () => {
  it("associates every keyboard action's key with its control", () => {
    renderApp();

    const controlPanel = screen.getByRole("complementary", {
      name: "Board controls",
    });
    const controlBadges = within(controlPanel).getAllByText(/^[SXTB]$/, {
      selector: "kbd",
    });
    expect(controlBadges.map((badge) => badge.textContent)).toEqual([
      "S",
      "X",
      "T",
      "B",
    ]);

    for (const [name, key] of [
      ["Undo", "U"],
      ["Redo", "R"],
      ["Show coordinates", "N"],
      ["Clear board", "C"],
    ] as const) {
      const button = screen.getByRole("button", { name });
      expect(within(button).getByText(key, { selector: "kbd" })).toBeTruthy();
    }
  });
});
