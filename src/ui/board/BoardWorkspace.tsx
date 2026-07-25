import {
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  canUndo,
  type StudySession,
} from "../../application/study-session";
import {
  hasContent,
  type Point,
  type StoneColor,
} from "../../domain/go";
import { GoBoard } from "./GoBoard";
import { useBoardPan } from "./useBoardPan";

export const ZOOM_LEVELS = [80, 100, 125, 160] as const;

interface BoardWorkspaceProps {
  session: StudySession;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onPointClick: (point: Point) => void;
  onPointClear: (point: Point) => void;
  onSetupStoneDragCommit: (
    points: Point[],
    color: StoneColor,
  ) => void;
}

export function BoardWorkspace({
  session,
  zoom,
  onZoomChange,
  onUndo,
  onRedo,
  onClear,
  onPointClick,
  onPointClear,
  onSetupStoneDragCommit,
}: BoardWorkspaceProps) {
  const { history, mode, selectedColor, size, tool } = session;
  const { present } = history;
  const { isPanning, panHandlers } = useBoardPan();
  const zoomIndex = ZOOM_LEVELS.indexOf(
    zoom as (typeof ZOOM_LEVELS)[number],
  );
  const canZoomOut = zoomIndex > 0;
  const canZoomIn = zoomIndex < ZOOM_LEVELS.length - 1;

  return (
    <main className="board-area">
      <section className="board-frame" aria-label="Kipu Study board">
        <div className="board-toolbar">
          <div className="turn-status" aria-live="polite">
            {mode === "setup" ? (
              <>
                <span
                  className={`status-stone ${selectedColor}`}
                  aria-hidden="true"
                />
                <strong>
                  {selectedColor === "black" ? "Black" : "White"}
                </strong>
                <span>setup</span>
              </>
            ) : (
              <>
                <span
                  className={`status-stone ${present.nextColor}`}
                  aria-hidden="true"
                />
                <strong>
                  {present.nextColor === "black" ? "Black" : "White"}
                </strong>
                <span>
                  to play
                  {present.nextMoveNumber > 1
                    ? ` · Move ${present.nextMoveNumber}`
                    : ""}
                </span>
              </>
            )}
          </div>

          <div className="toolbar-actions">
            <div className="icon-group">
              <button
                type="button"
                className="icon-button"
                aria-label="Undo"
                title="Undo"
                disabled={!canUndo(session)}
                onClick={onUndo}
              >
                <Undo2 size={18} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Redo"
                title="Redo"
                disabled={history.future.length === 0}
                onClick={onRedo}
              >
                <Redo2 size={18} />
              </button>
            </div>

            <div className="icon-group">
              <button
                type="button"
                className="icon-button"
                aria-label="Zoom out"
                title="Zoom out"
                disabled={!canZoomOut}
                onClick={() => onZoomChange(ZOOM_LEVELS[zoomIndex - 1])}
              >
                <ZoomOut size={18} />
              </button>
              <span className="zoom-value">{zoom}%</span>
              <button
                type="button"
                className="icon-button"
                aria-label="Zoom in"
                title="Zoom in"
                disabled={!canZoomIn}
                onClick={() => onZoomChange(ZOOM_LEVELS[zoomIndex + 1])}
              >
                <ZoomIn size={18} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Reset zoom"
                title="Reset zoom"
                disabled={zoom === 100}
                onClick={() => onZoomChange(100)}
              >
                <RotateCcw size={17} />
              </button>
            </div>

            <button
              type="button"
              className="icon-button"
              aria-label="Clear board"
              title="Clear board"
              disabled={!hasContent(present.board)}
              onClick={onClear}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div
          className={`board-stage${isPanning ? " is-panning" : ""}`}
          {...panHandlers}
        >
          <GoBoard
            board={present.board}
            size={size}
            mode={mode}
            tool={tool}
            selectedColor={selectedColor}
            nextColor={present.nextColor}
            zoom={zoom}
            onPointClick={onPointClick}
            onPointClear={onPointClear}
            onSetupStoneDragCommit={onSetupStoneDragCommit}
          />
        </div>

        <div className="board-footer">
          <span className="notice" role="status" aria-live="polite">
            {session.notice}
          </span>
          {mode === "simulation" && (
            <span className="capture-count">
              Captures&nbsp; B {present.captures.black}
              <span aria-hidden="true"> · </span>W{" "}
              {present.captures.white}
            </span>
          )}
        </div>
      </section>
    </main>
  );
}
