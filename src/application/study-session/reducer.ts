import {
  hasContent,
  oppositeColor,
  placeSetupStones,
  playMove,
  removePoint,
  toggleMark,
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
  createStudySnapshot,
  type Mode,
  type StudySession,
  type Tool,
} from "./model";

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
  );

  if (!result.ok) {
    return {
      ...session,
      notice:
        result.reason === "occupied"
          ? "That intersection is occupied."
          : "Self-capture is not allowed.",
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
  const nextSession = {
    ...session,
    mode,
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
        history: undoHistory(session.history),
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
          tool: "stone",
        },
        createStudySnapshot(session.size, session.firstColor),
      );
    case "notice-dismissed":
      return { ...session, notice: "" };
  }
}
