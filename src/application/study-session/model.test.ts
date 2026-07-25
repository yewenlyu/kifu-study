import { describe, expect, it } from "vitest";
import {
  createStudySession,
  createStudySnapshot,
  isSimulationStarted,
} from "./model";

describe("study-session model", () => {
  it("creates a fresh snapshot for the requested board and first player", () => {
    const snapshot = createStudySnapshot(9, "white");

    expect(snapshot.board).toHaveLength(9);
    expect(snapshot.board.flat().every((cell) => cell.stone === null)).toBe(
      true,
    );
    expect(snapshot).toMatchObject({
      nextMoveNumber: 1,
      nextColor: "white",
      captures: { black: 0, white: 0 },
    });
  });

  it("creates the default setup session", () => {
    const session = createStudySession();

    expect(session).toMatchObject({
      size: 19,
      mode: "setup",
      selectedColor: "black",
      firstColor: "black",
      tool: "stone",
      notice: "",
    });
    expect(session.history.past).toEqual([]);
    expect(session.history.future).toEqual([]);
    expect(session.history.present.board).toHaveLength(19);
    expect(session.history.present.nextMoveNumber).toBe(1);
  });

  it("reports whether simulation has advanced beyond the first move", () => {
    const session = createStudySession();
    const started = {
      ...session,
      history: {
        ...session.history,
        present: {
          ...session.history.present,
          nextMoveNumber: 2,
        },
      },
    };

    expect(isSimulationStarted(session)).toBe(false);
    expect(isSimulationStarted(started)).toBe(true);
  });
});
