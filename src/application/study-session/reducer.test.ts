import { describe, expect, it } from "vitest";
import type { Point } from "../../domain/go";
import {
  createStudySession,
  isSimulationStarted,
  type StudySession,
} from "./model";
import {
  studySessionReducer,
  type StudyAction,
} from "./reducer";

function apply(
  session: StudySession,
  ...actions: StudyAction[]
): StudySession {
  return actions.reduce(studySessionReducer, session);
}

describe("studySessionReducer", () => {
  it("commits setup batches atomically and navigates branched history", () => {
    const placed = apply(createStudySession(), {
      type: "setup-stones-placed",
      points: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      color: "black",
    });

    expect(placed.history.present.board[1][1].stone).toBe("black");
    expect(placed.history.past).toHaveLength(1);

    const rejected = studySessionReducer(placed, {
      type: "setup-stones-placed",
      points: [{ x: 1, y: 1 }],
      color: "white",
    });
    expect(rejected).toBe(placed);

    const undone = studySessionReducer(placed, { type: "undo" });
    expect(undone.history.present.board[1][1].stone).toBeNull();
    expect(undone.history.future).toHaveLength(1);

    const redone = studySessionReducer(undone, { type: "redo" });
    expect(redone.history.present.board[1][1].stone).toBe("black");

    const branched = apply(undone, {
      type: "setup-stones-placed",
      points: [{ x: 3, y: 3 }],
      color: "white",
    });
    expect(branched.history.future).toEqual([]);
    expect(branched.history.present.board[3][3].stone).toBe("white");
  });

  it("clears setup points with their labels through history", () => {
    const point = { x: 4, y: 4 };
    const labeled = apply(
      createStudySession(),
      {
        type: "setup-stones-placed",
        points: [point],
        color: "black",
      },
      { type: "tool-changed", tool: "triangle" },
      { type: "point-clicked", point },
    );

    const cleared = studySessionReducer(labeled, {
      type: "point-cleared",
      point,
    });
    expect(cleared.history.present.board[4][4]).toEqual({
      stone: null,
      moveNumber: null,
      mark: null,
    });

    const restored = studySessionReducer(cleared, { type: "undo" });
    expect(restored.history.present.board[4][4]).toMatchObject({
      stone: "black",
      mark: "triangle",
    });
  });

  it("clears only simulation labels and ignores unlabeled points", () => {
    const point = { x: 3, y: 3 };
    const labeled = apply(
      createStudySession(),
      { type: "mode-changed", mode: "simulation" },
      { type: "point-clicked", point },
      { type: "tool-changed", tool: "circle" },
      { type: "point-clicked", point },
    );

    const cleared = studySessionReducer(labeled, {
      type: "point-cleared",
      point,
    });
    expect(cleared.history.present.board[3][3]).toEqual({
      stone: "black",
      moveNumber: 1,
      mark: null,
    });

    const restored = studySessionReducer(cleared, { type: "undo" });
    expect(restored.history.present.board[3][3]).toEqual({
      stone: "black",
      moveNumber: 1,
      mark: "circle",
    });

    expect(
      studySessionReducer(cleared, {
        type: "point-cleared",
        point,
      }),
    ).toBe(cleared);
  });

  it("plays legal simulation moves and reports rejected moves", () => {
    const point = { x: 2, y: 2 };
    let session = apply(
      createStudySession(),
      { type: "mode-changed", mode: "simulation" },
      { type: "first-color-changed", color: "white" },
      { type: "point-clicked", point },
    );

    expect(session.history.present.board[2][2]).toMatchObject({
      stone: "white",
      moveNumber: 1,
    });
    expect(session.history.present.nextColor).toBe("black");
    expect(isSimulationStarted(session)).toBe(true);

    const started = session;
    session = studySessionReducer(session, {
      type: "first-color-changed",
      color: "black",
    });
    expect(session).toBe(started);

    session = studySessionReducer(session, {
      type: "point-clicked",
      point,
    });
    expect(session.notice).toBe("That intersection is occupied.");
    expect(session.history.present.nextMoveNumber).toBe(2);

    session = studySessionReducer(session, { type: "notice-dismissed" });
    expect(session.notice).toBe("");
  });

  it("reports self-capture without committing history", () => {
    const surrounded = [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ];
    const setup = studySessionReducer(createStudySession(), {
      type: "setup-stones-placed",
      points: surrounded,
      color: "black",
    });
    const session = apply(
      setup,
      { type: "mode-changed", mode: "simulation" },
      { type: "first-color-changed", color: "white" },
      { type: "point-clicked", point: { x: 1, y: 1 } },
    );

    expect(session.notice).toBe("Self-capture is not allowed.");
    expect(session.history.past).toHaveLength(setup.history.past.length);
  });

  it("updates first-player history and resets mode-specific state", () => {
    const point = { x: 1, y: 1 };
    let session = apply(
      createStudySession(),
      {
        type: "setup-stones-placed",
        points: [point],
        color: "black",
      },
      { type: "undo" },
      { type: "mode-changed", mode: "simulation" },
      { type: "first-color-changed", color: "white" },
    );

    expect(
      [
        ...session.history.past,
        session.history.present,
        ...session.history.future,
      ].every((snapshot) => snapshot.nextColor === "white"),
    ).toBe(true);

    session = apply(
      session,
      { type: "tool-changed", tool: "circle" },
      { type: "mode-changed", mode: "setup" },
      { type: "selected-color-changed", color: "white" },
    );
    expect(session).toMatchObject({
      mode: "setup",
      tool: "stone",
      selectedColor: "white",
    });
  });

  it("clears content into one undoable setup snapshot", () => {
    const point = { x: 5, y: 5 };
    const simulation = apply(
      createStudySession(),
      {
        type: "setup-stones-placed",
        points: [point],
        color: "black",
      },
      { type: "mode-changed", mode: "simulation" },
      { type: "board-cleared" },
    );

    expect(simulation.mode).toBe("setup");
    expect(simulation.history.present.board[5][5].stone).toBeNull();

    const restored = studySessionReducer(simulation, { type: "undo" });
    expect(restored.history.present.board[5][5].stone).toBe("black");

    const empty = createStudySession();
    expect(
      studySessionReducer(empty, { type: "board-cleared" }),
    ).toBe(empty);
  });

  it("changes board size and handles history no-op boundaries", () => {
    let session = apply(
      createStudySession(),
      { type: "board-size-changed", size: 9 },
      { type: "undo" },
      { type: "redo" },
    );

    expect(session.size).toBe(9);
    expect(session.history.present.board).toHaveLength(9);
    expect(session.history.past).toEqual([]);
    expect(session.history.future).toEqual([]);

    const emptyPoint: Point = { x: 0, y: 0 };
    expect(
      studySessionReducer(session, {
        type: "point-cleared",
        point: emptyPoint,
      }),
    ).toBe(session);
  });
});
