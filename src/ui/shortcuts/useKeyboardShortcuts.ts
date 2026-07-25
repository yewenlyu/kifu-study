import { useEffect, type Dispatch } from "react";
import {
  TOOLS,
  isSimulationStarted,
  type StudyAction,
  type StudySession,
} from "../../application/study-session";
import {
  BOARD_SIZES,
  oppositeColor,
  type BoardSize,
} from "../../domain/go";

interface KeyboardShortcutOptions {
  session: StudySession;
  dispatch: Dispatch<StudyAction>;
  onBoardSizeChange: (size: BoardSize) => void;
}

export function useKeyboardShortcuts({
  session,
  dispatch,
  onBoardSizeChange,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (isEditable) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) {
        return;
      }

      if (
        (key === "delete" || key === "backspace") &&
        session.mode === "setup" &&
        session.selectedPoint
      ) {
        event.preventDefault();
        dispatch({ type: "selected-stone-removed" });
        return;
      }

      if (key === "escape" && session.selectedPoint) {
        event.preventDefault();
        dispatch({ type: "selection-cleared" });
        return;
      }

      switch (key) {
        case "u":
          event.preventDefault();
          dispatch({ type: "undo" });
          break;
        case "r":
          event.preventDefault();
          dispatch({ type: "redo" });
          break;
        case "m":
          event.preventDefault();
          dispatch({
            type: "mode-changed",
            mode: session.mode === "setup" ? "simulation" : "setup",
          });
          break;
        case "s":
          event.preventDefault();
          if (session.mode === "setup") {
            dispatch({
              type: "selected-color-changed",
              color: oppositeColor(session.selectedColor),
            });
          } else if (!isSimulationStarted(session)) {
            dispatch({
              type: "first-color-changed",
              color: oppositeColor(session.firstColor),
            });
          }
          break;
        case "t": {
          event.preventDefault();
          const toolIndex = TOOLS.indexOf(session.tool);
          dispatch({
            type: "tool-changed",
            tool: TOOLS[(toolIndex + 1) % TOOLS.length],
          });
          break;
        }
        case "b": {
          event.preventDefault();
          const boardIndex = BOARD_SIZES.indexOf(session.size);
          onBoardSizeChange(
            BOARD_SIZES[(boardIndex + 1) % BOARD_SIZES.length],
          );
          break;
        }
        case "c":
          event.preventDefault();
          dispatch({ type: "board-cleared" });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, onBoardSizeChange, session]);
}
