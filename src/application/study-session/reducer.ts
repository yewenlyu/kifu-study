import {
  hasContent,
  oppositeColor,
  placeSetupStones,
  playMove,
  removePoint,
  toggleMark,
  type Board,
  type BoardSize,
  type Point,
  type StoneColor,
} from "../../domain/go";
import {
  commitHistory,
  createHistory,
  mapHistory,
  redoHistory,
  undoHistory,
} from "./history";
import {
  canUndo,
  createStudySnapshot,
  type Mode,
  type StudySession,
  type Tool,
} from "./model";

const MOVE_REJECTION_NOTICES = {
  occupied: "That intersection is occupied.",
  "self-capture": "Self-capture is not allowed.",
  ko: "Simple ko does not allow an immediate recapture.",
} as const;

export type StudyAction =
  | { type: "point-clicked"; point: Point }
  | { type: "point-cleared"; point: Point }
  | {
      type: "setup-stones-placed";
      points: Point[];
      color: StoneColor;
    }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "mode-changed"; mode: Mode }
  | { type: "selected-color-changed"; color: StoneColor }
  | { type: "first-color-changed"; color: StoneColor }
  | { type: "tool-changed"; tool: Tool }
  | { type: "board-size-changed"; size: BoardSize }
  | { type: "board-cleared" }
  | { type: "notice-dismissed" };

function commit(
  session: StudySession,
  snapshot: StudySession["history"]["present"],
): StudySession {
  return {
    ...session,
    notice: "",
    history: commitHistory(session.history, snapshot),
  };
}

function findKoPosition(session: StudySession): Board | undefined {
  const previousMoveNumber =
    session.history.present.nextMoveNumber - 1;

  for (
    let index = session.history.past.length - 1;
    index >= session.simulationHistoryStart;
    index -= 1
  ) {
    const snapshot = session.history.past[index];
    if (snapshot.nextMoveNumber === previousMoveNumber) {
      return snapshot.board;
    }
  }

  return undefined;
}

function handlePointClick(
  session: StudySession,
  point: Point,
): StudySession {
  const present = session.history.present;

  if (session.tool !== "stone") {
    return commit(session, {
      ...present,
      board: toggleMark(present.board, point, session.tool),
    });
  }

  if (session.mode === "setup") {
    return session;
  }

  const result = playMove(
    present.board,
    point,
    present.nextColor,
    present.nextMoveNumber,
    findKoPosition(session),
  );

  if (!result.ok) {
    return {
      ...session,
      notice: MOVE_REJECTION_NOTICES[result.reason],
    };
  }

  return commit(session, {
    board: result.board,
    nextMoveNumber: present.nextMoveNumber + 1,
    nextColor: oppositeColor(present.nextColor),
    captures: {
      ...present.captures,
      [present.nextColor]:
        present.captures[present.nextColor] + result.captured,
    },
  });
}

function handlePointClear(
  session: StudySession,
  point: Point,
): StudySession {
  const present = session.history.present;
  const cell = present.board[point.y]?.[point.x];

  if (!cell) {
    return session;
  }

  if (session.mode === "setup") {
    if (
      cell.stone === null &&
      cell.moveNumber === null &&
      cell.mark === null
    ) {
      return session;
    }

    return commit(session, {
      ...present,
      board: removePoint(present.board, point),
    });
  }

  if (cell.mark === null) {
    return session;
  }

  return commit(session, {
    ...present,
    board: toggleMark(present.board, point, cell.mark),
  });
}

function changeMode(session: StudySession, mode: Mode): StudySession {
  const enteringSimulation =
    mode === "simulation" && session.mode !== "simulation";
  const nextSession = {
    ...session,
    mode,
    simulationHistoryStart: enteringSimulation
      ? session.history.past.length
      : session.simulationHistoryStart,
    tool: "stone" as const,
    notice: "",
  };

  if (mode !== "simulation" || session.history.present.nextMoveNumber !== 1) {
    return nextSession;
  }

  return {
    ...nextSession,
    history: mapHistory(session.history, (snapshot) => ({
      ...snapshot,
      nextColor: session.firstColor,
    })),
  };
}

export function studySessionReducer(
  session: StudySession,
  action: StudyAction,
): StudySession {
  const present = session.history.present;

  switch (action.type) {
    case "point-clicked":
      return handlePointClick(session, action.point);
    case "point-cleared":
      return handlePointClear(session, action.point);
    case "setup-stones-placed": {
      const board = placeSetupStones(
        present.board,
        action.points,
        action.color,
      );
      return board === present.board
        ? session
        : commit(session, { ...present, board });
    }
    case "undo":
      return {
        ...session,
        notice: "",
        history: canUndo(session)
          ? undoHistory(session.history)
          : session.history,
      };
    case "redo":
      return {
        ...session,
        notice: "",
        history: redoHistory(session.history),
      };
    case "mode-changed":
      return changeMode(session, action.mode);
    case "selected-color-changed":
      return { ...session, selectedColor: action.color };
    case "first-color-changed":
      if (
        session.mode === "simulation" &&
        session.history.present.nextMoveNumber > 1
      ) {
        return session;
      }
      return {
        ...session,
        firstColor: action.color,
        history: mapHistory(session.history, (snapshot) => ({
          ...snapshot,
          nextColor: action.color,
        })),
      };
    case "tool-changed":
      return {
        ...session,
        tool: action.tool,
      };
    case "board-size-changed":
      return {
        ...session,
        size: action.size,
        simulationHistoryStart: 0,
        notice: "",
        history: createHistory(
          createStudySnapshot(action.size, session.firstColor),
        ),
      };
    case "board-cleared":
      if (!hasContent(present.board)) {
        return session;
      }
      return commit(
        {
          ...session,
          mode: "setup",
          selectedColor: "black",
          tool: "stone",
        },
        createStudySnapshot(session.size, session.firstColor),
      );
    case "notice-dismissed":
      return { ...session, notice: "" };
  }
}
