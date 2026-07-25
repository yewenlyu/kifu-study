import { describe, expect, it } from "vitest";
import {
  commitHistory,
  createHistory,
  mapHistory,
  redoHistory,
  undoHistory,
} from "./history";

describe("snapshot history", () => {
  it("creates history and commits a new present while clearing redo", () => {
    const initial = createHistory("initial");
    const committed = commitHistory(
      { ...initial, future: ["discarded"] },
      "next",
    );

    expect(initial).toEqual({
      past: [],
      present: "initial",
      future: [],
    });
    expect(committed).toEqual({
      past: ["initial"],
      present: "next",
      future: [],
    });
  });

  it("undoes and redoes snapshots without crossing empty boundaries", () => {
    const initial = createHistory("initial");
    const committed = commitHistory(initial, "next");
    const undone = undoHistory(committed);
    const redone = redoHistory(undone);

    expect(undone).toEqual({
      past: [],
      present: "initial",
      future: ["next"],
    });
    expect(redone).toEqual(committed);
    expect(undoHistory(initial)).toBe(initial);
    expect(redoHistory(committed)).toBe(committed);
  });

  it("maps past, present, and future snapshots", () => {
    const history = {
      past: [1, 2],
      present: 3,
      future: [4, 5],
    };

    expect(mapHistory(history, (value) => value * 10)).toEqual({
      past: [10, 20],
      present: 30,
      future: [40, 50],
    });
  });
});
