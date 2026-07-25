import { useCallback, useEffect, useReducer, useState } from "react";
import {
  createStudySession,
  isSimulationStarted,
  studySessionReducer,
} from "../application/study-session";
import {
  hasContent,
  type BoardSize,
} from "../domain/go";
import { BoardWorkspace } from "../ui/board/BoardWorkspace";
import { ControlPanel } from "../ui/controls/ControlPanel";
import { ShortcutHelp } from "../ui/shortcuts/ShortcutHelp";
import { useKeyboardShortcuts } from "../ui/shortcuts/useKeyboardShortcuts";

export default function App() {
  const [session, dispatch] = useReducer(
    studySessionReducer,
    undefined,
    createStudySession,
  );
  const [zoom, setZoom] = useState(100);
  const { history } = session;

  useEffect(() => {
    if (!session.notice) {
      return;
    }

    const timeout = window.setTimeout(
      () => dispatch({ type: "notice-dismissed" }),
      2400,
    );
    return () => window.clearTimeout(timeout);
  }, [session.notice]);

  const handleSizeChange = useCallback(
    (size: BoardSize) => {
      if (
        hasContent(history.present.board) &&
        !window.confirm("Changing the board size clears the current board.")
      ) {
        return;
      }

      setZoom(100);
      dispatch({ type: "board-size-changed", size });
    },
    [history.present.board],
  );

  useKeyboardShortcuts({
    session,
    dispatch,
    onBoardSizeChange: handleSizeChange,
  });

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          <span />
          <span />
        </div>
        <div>
          <h1>Kipu Study</h1>
          <p>Go study board</p>
        </div>
      </header>

      <div className="workspace">
        <ControlPanel
          mode={session.mode}
          selectedColor={session.selectedColor}
          firstColor={session.firstColor}
          tool={session.tool}
          size={session.size}
          isSimulationStarted={isSimulationStarted(session)}
          onModeChange={(mode) =>
            dispatch({ type: "mode-changed", mode })
          }
          onSelectedColorChange={(color) =>
            dispatch({ type: "selected-color-changed", color })
          }
          onFirstColorChange={(color) =>
            dispatch({ type: "first-color-changed", color })
          }
          onToolChange={(tool) =>
            dispatch({ type: "tool-changed", tool })
          }
          onSizeChange={handleSizeChange}
        />

        <BoardWorkspace
          session={session}
          zoom={zoom}
          onZoomChange={setZoom}
          onUndo={() => dispatch({ type: "undo" })}
          onRedo={() => dispatch({ type: "redo" })}
          onClear={() => dispatch({ type: "board-cleared" })}
          onPointClick={(point) =>
            dispatch({ type: "point-clicked", point })
          }
          onPointClear={(point) =>
            dispatch({ type: "point-cleared", point })
          }
          onSetupStoneDragCommit={(points, color) =>
            dispatch({ type: "setup-stones-placed", points, color })
          }
        />
      </div>
      <ShortcutHelp />
    </div>
  );
}
