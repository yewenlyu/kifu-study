import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Circle,
  CircleDot,
  CircleHelp,
  Redo2,
  RotateCcw,
  Trash2,
  Triangle,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  BOARD_SIZES,
  canPlaceSetupStones,
  createBoard,
  hasContent,
  oppositeColor,
  placeSetupStone,
  placeSetupStones,
  playMove,
  pointsAlongAxis,
  removePoint,
  toggleMark,
  type Board,
  type BoardSize,
  type Mark,
  type Point,
  type StoneColor,
} from "./go";

type Mode = "setup" | "simulation";
type Tool = "stone" | Mark;

const TOOLS: readonly Tool[] = ["stone", "triangle", "circle"];

interface Captures {
  black: number;
  white: number;
}

interface Snapshot {
  board: Board;
  nextMoveNumber: number;
  nextColor: StoneColor;
  captures: Captures;
}

interface History {
  past: Snapshot[];
  present: Snapshot;
  future: Snapshot[];
}

interface BoardPan {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  startScrollTop: number;
  dragged: boolean;
}

type DragAxis = "horizontal" | "vertical";

interface SetupPointerDrag {
  pointerId: number;
  startPoint: Point;
  startClientX: number;
  startClientY: number;
  axis: DragAxis | null;
  points: Point[];
  color: StoneColor;
  canceled: boolean;
  moved: boolean;
  startedOccupied: boolean;
}

interface SetupDragPreview {
  points: Point[];
  color: StoneColor;
  canceled: boolean;
}

const ZOOM_LEVELS = [80, 100, 125, 160] as const;
const SHORTCUTS = [
  { action: "Toggle mode", keys: "M" },
  { action: "Toggle stone", keys: "S" },
  { action: "Cycle tool", keys: "T" },
  { action: "Cycle board", keys: "B" },
  { action: "Undo", keys: "⌘/Ctrl Z" },
  { action: "Redo", keys: "Shift + ⌘/Ctrl Z" },
  { action: "Remove stone", keys: "Delete / Backspace" },
  { action: "Deselect stone", keys: "Esc" },
  { action: "Pan board", keys: "Right-drag" },
] as const;

function newSnapshot(size: BoardSize, firstColor: StoneColor): Snapshot {
  return {
    board: createBoard(size),
    nextMoveNumber: 1,
    nextColor: firstColor,
    captures: { black: 0, white: 0 },
  };
}

function starPoints(size: BoardSize): Point[] {
  if (size === 9) {
    return [
      { x: 2, y: 2 },
      { x: 6, y: 2 },
      { x: 4, y: 4 },
      { x: 2, y: 6 },
      { x: 6, y: 6 },
    ];
  }

  const positions = size === 13 ? [3, 6, 9] : [3, 9, 15];
  return positions.flatMap((y) => positions.map((x) => ({ x, y })));
}

interface SegmentedButtonProps<T extends string | number> {
  value: T;
  current: T;
  onSelect: (value: T) => void;
  children: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

function SegmentedButton<T extends string | number>({
  value,
  current,
  onSelect,
  children,
  disabled = false,
  ariaLabel,
}: SegmentedButtonProps<T>) {
  return (
    <button
      type="button"
      className="segment"
      data-active={value === current}
      aria-pressed={value === current}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onSelect(value)}
    >
      {children}
    </button>
  );
}

function ShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      trigger.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="shortcut-help" ref={container}>
      {isOpen && (
        <section
          className="shortcut-help-popover"
          id="shortcut-help-popover"
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <div className="shortcut-help-header">
            <h2>Shortcuts</h2>
            <button
              type="button"
              className="shortcut-help-close"
              aria-label="Close shortcuts"
              title="Close"
              onClick={() => {
                setIsOpen(false);
                trigger.current?.focus();
              }}
            >
              <X size={16} />
            </button>
          </div>
          <dl className="shortcut-help-list">
            {SHORTCUTS.map(({ action, keys }) => (
              <div className="shortcut-help-row" key={action}>
                <dt>{action}</dt>
                <dd>
                  <kbd>{keys}</kbd>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <button
        type="button"
        className="shortcut-help-trigger"
        ref={trigger}
        aria-label="Keyboard shortcuts"
        aria-controls="shortcut-help-popover"
        aria-expanded={isOpen}
        title="Keyboard shortcuts"
        onClick={() => setIsOpen((current) => !current)}
      >
        <CircleHelp size={18} strokeWidth={1.6} />
      </button>
    </div>
  );
}

interface GoBoardProps {
  board: Board;
  size: BoardSize;
  mode: Mode;
  tool: Tool;
  selectedColor: StoneColor;
  nextColor: StoneColor;
  selectedPoint: Point | null;
  zoom: number;
  onPointClick: (point: Point) => void;
  onSetupStoneDragCommit: (
    points: Point[],
    color: StoneColor,
  ) => void;
}

function GoBoard({
  board,
  size,
  mode,
  tool,
  selectedColor,
  nextColor,
  selectedPoint,
  zoom,
  onPointClick,
  onSetupStoneDragCommit,
}: GoBoardProps) {
  const [hovered, setHovered] = useState<Point | null>(null);
  const [setupDragPreview, setSetupDragPreview] =
    useState<SetupDragPreview | null>(null);
  const setupPointerDrag = useRef<SetupPointerDrag | null>(null);
  const padding = 42;
  const canvasSize = 720;
  const step = (canvasSize - padding * 2) / (size - 1);
  const gridStrokeWidth = 1.55;
  const edgeGridStrokeWidth = 2.8;
  const stoneStrokeWidth = gridStrokeWidth;
  const stoneRadius = (step - stoneStrokeWidth) / 2;
  const points = useMemo(
    () =>
      Array.from({ length: size * size }, (_, index) => ({
        x: index % size,
        y: Math.floor(index / size),
      })),
    [size],
  );

  const coordinate = (index: number) => padding + index * step;
  const previewColor = mode === "setup" ? selectedColor : nextColor;

  useEffect(() => {
    setupPointerDrag.current = null;
    setSetupDragPreview(null);
  }, [board, mode, size, tool]);

  const pointFromPointer = (
    event: ReactPointerEvent<SVGSVGElement>,
  ): Point | null => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const localX =
      ((event.clientX - bounds.left) * canvasSize) / bounds.width;
    const localY =
      ((event.clientY - bounds.top) * canvasSize) / bounds.height;
    const x = Math.round((localX - padding) / step);
    const y = Math.round((localY - padding) / step);

    if (x < 0 || x >= size || y < 0 || y >= size) {
      return null;
    }

    return Math.hypot(localX - coordinate(x), localY - coordinate(y)) <=
      step * 0.47
      ? { x, y }
      : null;
  };

  const handleSetupPointerDown = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    if (event.button !== 0 || mode !== "setup" || tool !== "stone") {
      return;
    }

    const point = pointFromPointer(event);
    if (!point) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startedOccupied = board[point.y][point.x].stone !== null;
    setupPointerDrag.current = {
      pointerId: event.pointerId,
      startPoint: point,
      startClientX: event.clientX,
      startClientY: event.clientY,
      axis: null,
      points: startedOccupied ? [] : [point],
      color: selectedColor,
      canceled: startedOccupied,
      moved: false,
      startedOccupied,
    };
    setHovered(point);
    setSetupDragPreview({
      points: startedOccupied ? [] : [point],
      color: selectedColor,
      canceled: startedOccupied,
    });
  };

  const handleSetupPointerMove = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    const drag = setupPointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const point = pointFromPointer(event);
    setHovered(point);

    if (!point) {
      return;
    }

    if (
      drag.startPoint.x === point.x &&
      drag.startPoint.y === point.y &&
      drag.axis === null
    ) {
      return;
    }

    drag.moved = true;
    if (drag.canceled) {
      return;
    }

    if (drag.axis === null) {
      drag.axis =
        Math.abs(event.clientX - drag.startClientX) >=
        Math.abs(event.clientY - drag.startClientY)
          ? "horizontal"
          : "vertical";
    }

    const endPoint =
      drag.axis === "horizontal"
        ? { x: point.x, y: drag.startPoint.y }
        : { x: drag.startPoint.x, y: point.y };
    const points = pointsAlongAxis(drag.startPoint, endPoint);

    if (!canPlaceSetupStones(board, points)) {
      drag.points = [];
      drag.canceled = true;
    } else {
      drag.points = points;
    }

    setSetupDragPreview({
      points: drag.points,
      color: drag.color,
      canceled: drag.canceled,
    });
  };

  const finishSetupPointer = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    const drag = setupPointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    setupPointerDrag.current = null;
    setSetupDragPreview(null);

    if (!drag.moved && drag.startedOccupied) {
      onPointClick(drag.startPoint);
    } else if (!drag.canceled) {
      onSetupStoneDragCommit(drag.points, drag.color);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const cancelSetupPointer = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    const drag = setupPointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    setupPointerDrag.current = null;
    setSetupDragPreview(null);
  };

  const renderMark = (
    mark: Mark,
    x: number,
    y: number,
    color: string,
    scale = 1,
  ) => {
    const radius = stoneRadius * 0.48 * scale;
    if (mark === "circle") {
      return (
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={Math.max(2.2, step * 0.065)}
        />
      );
    }

    const height = radius * 1.72;
    const pointsValue = [
      `${x},${y - height * 0.62}`,
      `${x - radius},${y + height * 0.38}`,
      `${x + radius},${y + height * 0.38}`,
    ].join(" ");
    return <polygon points={pointsValue} fill={color} />;
  };

  return (
    <svg
      className="go-board"
      style={{
        width: `${zoom}%`,
        maxWidth: `${(820 * zoom) / 100}px`,
      }}
      viewBox={`0 0 ${canvasSize} ${canvasSize}`}
      role="img"
      aria-label={`${size} by ${size} Go board`}
      data-board-size={size}
      data-setup-drag-state={
        setupDragPreview
          ? setupDragPreview.canceled
            ? "canceled"
            : "preview"
          : undefined
      }
      onPointerDown={handleSetupPointerDown}
      onPointerMove={handleSetupPointerMove}
      onPointerUp={finishSetupPointer}
      onPointerCancel={cancelSetupPointer}
      onLostPointerCapture={cancelSetupPointer}
    >
      <rect width={canvasSize} height={canvasSize} fill="#ffffff" />

      <g className="grid-lines" aria-hidden="true">
        {Array.from({ length: size }, (_, index) => {
          const position = coordinate(index);
          const isEdge = index === 0 || index === size - 1;
          return (
            <g key={index}>
              <line
                x1={padding}
                y1={position}
                x2={canvasSize - padding}
                y2={position}
                strokeWidth={
                  isEdge ? edgeGridStrokeWidth : gridStrokeWidth
                }
              />
              <line
                x1={position}
                y1={padding}
                x2={position}
                y2={canvasSize - padding}
                strokeWidth={
                  isEdge ? edgeGridStrokeWidth : gridStrokeWidth
                }
              />
            </g>
          );
        })}
        {starPoints(size).map(({ x, y }) => (
          <circle
            key={`${x}-${y}`}
            cx={coordinate(x)}
            cy={coordinate(y)}
            r={Math.max(3.5, step * 0.1)}
            fill="#111111"
          />
        ))}
      </g>

      <g className="stones" aria-hidden="true">
        {points.map(({ x, y }) => {
          const cell = board[y][x];
          if (cell.stone === null) {
            return null;
          }

          const centerX = coordinate(x);
          const centerY = coordinate(y);
          const labelColor = cell.stone === "black" ? "#ffffff" : "#111111";
          const isSelected =
            selectedPoint?.x === x && selectedPoint.y === y;
          const numberLength = String(cell.moveNumber ?? "").length;
          const fontSize =
            numberLength >= 3 ? stoneRadius * 0.88 : stoneRadius * 1.12;

          return (
            <g
              key={`${x}-${y}`}
              data-stone={cell.stone}
              data-move-number={cell.moveNumber ?? undefined}
              data-selected-stone={isSelected ? "true" : undefined}
            >
              <circle
                cx={centerX}
                cy={centerY}
                r={stoneRadius}
                fill={cell.stone === "black" ? "#111111" : "#ffffff"}
                stroke="#111111"
                strokeWidth={stoneStrokeWidth}
              />
              {cell.mark
                ? renderMark(
                    cell.mark,
                    centerX,
                    centerY,
                    labelColor,
                    1.02,
                  )
                : cell.moveNumber !== null && (
                    <text
                      x={centerX}
                      y={centerY}
                      fill={labelColor}
                      fontSize={fontSize}
                      fontWeight="500"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {cell.moveNumber}
                    </text>
                  )}
              {isSelected && (
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={stoneRadius * 0.78}
                  fill="none"
                  stroke={labelColor}
                  strokeWidth={Math.max(1.6, step * 0.025)}
                  strokeDasharray={`${step * 0.08} ${step * 0.05}`}
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}
      </g>

      <g className="marks" aria-hidden="true">
        {points.map(({ x, y }) => {
          const cell = board[y][x];
          if (cell.mark === null || cell.stone !== null) {
            return null;
          }

          return (
            <g key={`${x}-${y}`} data-mark={cell.mark}>
              {renderMark(
                cell.mark,
                coordinate(x),
                coordinate(y),
                "#111111",
              )}
            </g>
          );
        })}
      </g>

      {setupDragPreview && !setupDragPreview.canceled && (
        <g
          className="setup-drag-preview"
          data-preview-color={setupDragPreview.color}
          aria-hidden="true"
        >
          {setupDragPreview.points.map(({ x, y }) => (
            <circle
              key={`${x}-${y}`}
              cx={coordinate(x)}
              cy={coordinate(y)}
              r={stoneRadius}
              fill={
                setupDragPreview.color === "black"
                  ? "#111111"
                  : "#ffffff"
              }
              stroke="#111111"
              strokeWidth={stoneStrokeWidth}
              data-preview-point={`${x},${y}`}
            />
          ))}
        </g>
      )}

      {setupDragPreview === null &&
        hovered &&
        (tool !== "stone" ||
          board[hovered.y][hovered.x].stone === null) && (
        <g className="point-preview" aria-hidden="true">
          {tool === "stone" ? (
            <circle
              cx={coordinate(hovered.x)}
              cy={coordinate(hovered.y)}
              r={stoneRadius}
              fill={previewColor === "black" ? "#111111" : "#ffffff"}
              stroke="#111111"
              strokeWidth={stoneStrokeWidth}
            />
          ) : (
            renderMark(
              tool,
              coordinate(hovered.x),
              coordinate(hovered.y),
              board[hovered.y][hovered.x].stone === "black"
                ? "#ffffff"
                : "#111111",
            )
          )}
        </g>
        )}

      <g className="hit-targets">
        {points.map(({ x, y }) => (
          <circle
            key={`${x}-${y}`}
            cx={coordinate(x)}
            cy={coordinate(y)}
            r={step * 0.47}
            fill="transparent"
            data-point={`${x},${y}`}
            onMouseEnter={() => setHovered({ x, y })}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              if (mode !== "setup" || tool !== "stone") {
                onPointClick({ x, y });
              }
            }}
          />
        ))}
      </g>
    </svg>
  );
}

export default function App() {
  const [size, setSize] = useState<BoardSize>(19);
  const [mode, setMode] = useState<Mode>("setup");
  const [selectedColor, setSelectedColor] =
    useState<StoneColor>("black");
  const [firstColor, setFirstColor] = useState<StoneColor>("black");
  const [tool, setTool] = useState<Tool>("stone");
  const [zoom, setZoom] = useState(100);
  const [notice, setNotice] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const boardPan = useRef<BoardPan | null>(null);
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    present: newSnapshot(19, "black"),
    future: [],
  }));

  const { present } = history;

  const commit = useCallback((snapshot: Snapshot) => {
    setHistory((current) => ({
      past: [...current.past, current.present],
      present: snapshot,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) {
        return current;
      }

      const previous = current.past[current.past.length - 1];
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
      };
    });
    setSelectedPoint(null);
    setNotice("");
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) {
        return current;
      }

      const [next, ...remaining] = current.future;
      return {
        past: [...current.past, current.present],
        present: next,
        future: remaining,
      };
    });
    setSelectedPoint(null);
    setNotice("");
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const handlePointClick = (point: Point) => {
    if (tool !== "stone") {
      setSelectedPoint(null);
      commit({
        ...present,
        board: toggleMark(present.board, point, tool),
      });
      setNotice("");
      return;
    }

    if (mode === "setup") {
      const currentCell = present.board[point.y][point.x];
      if (currentCell.stone !== null) {
        setSelectedPoint((current) =>
          current?.x === point.x && current.y === point.y ? null : point,
        );
        setNotice("");
        return;
      }

      setSelectedPoint(null);
      commit({
        ...present,
        board: placeSetupStone(present.board, point, selectedColor),
      });
      setNotice("");
      return;
    }

    setSelectedPoint(null);
    const result = playMove(
      present.board,
      point,
      present.nextColor,
      present.nextMoveNumber,
    );

    if (!result.ok) {
      setNotice(
        result.reason === "occupied"
          ? "That intersection is occupied."
          : "Self-capture is not allowed.",
      );
      return;
    }

    commit({
      board: result.board,
      nextMoveNumber: present.nextMoveNumber + 1,
      nextColor: oppositeColor(present.nextColor),
      captures: {
        ...present.captures,
        [present.nextColor]:
          present.captures[present.nextColor] + result.captured,
      },
    });
    setNotice("");
  };

  const handleSetupStoneDragCommit = (
    points: Point[],
    color: StoneColor,
  ) => {
    const board = placeSetupStones(present.board, points, color);
    if (board === present.board) {
      return;
    }

    setSelectedPoint(null);
    commit({ ...present, board });
    setNotice("");
  };

  const handleBoardPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 2) {
      return;
    }

    const stage = event.currentTarget;
    const canPan =
      stage.scrollWidth > stage.clientWidth + 1 ||
      stage.scrollHeight > stage.clientHeight + 1;

    if (!canPan) {
      return;
    }

    boardPan.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: stage.scrollLeft,
      startScrollTop: stage.scrollTop,
      dragged: false,
    };

    event.preventDefault();
    stage.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };

  const handleBoardPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const pan = boardPan.current;
    if (!pan || pan.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - pan.startX;
    const deltaY = event.clientY - pan.startY;
    if (!pan.dragged && Math.hypot(deltaX, deltaY) < 4) {
      return;
    }

    pan.dragged = true;
    event.preventDefault();
    event.currentTarget.scrollLeft = pan.startScrollLeft - deltaX;
    event.currentTarget.scrollTop = pan.startScrollTop - deltaY;
  };

  const finishBoardPointer = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const pan = boardPan.current;
    if (!pan || pan.pointerId !== event.pointerId) {
      return;
    }

    boardPan.current = null;
    setIsPanning(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setTool("stone");
    setSelectedPoint(null);
    setNotice("");

    if (nextMode === "simulation" && present.nextMoveNumber === 1) {
      setHistory((current) => ({
        past: current.past.map((snapshot) => ({
          ...snapshot,
          nextColor: firstColor,
        })),
        present: { ...current.present, nextColor: firstColor },
        future: current.future.map((snapshot) => ({
          ...snapshot,
          nextColor: firstColor,
        })),
      }));
    }
  };

  const handleFirstColorChange = (color: StoneColor) => {
    setFirstColor(color);
    setHistory((current) => ({
      past: current.past.map((snapshot) => ({
        ...snapshot,
        nextColor: color,
      })),
      present: { ...current.present, nextColor: color },
      future: current.future.map((snapshot) => ({
        ...snapshot,
        nextColor: color,
      })),
    }));
  };

  const handleToolChange = (nextTool: Tool) => {
    setTool(nextTool);
    if (nextTool !== "stone") {
      setSelectedPoint(null);
    }
  };

  const handleSizeChange = (nextSize: BoardSize) => {
    if (
      hasContent(present.board) &&
      !window.confirm("Changing the board size clears the current board.")
    ) {
      return;
    }

    setSize(nextSize);
    setZoom(100);
    setSelectedPoint(null);
    setHistory({
      past: [],
      present: newSnapshot(nextSize, firstColor),
      future: [],
    });
    setNotice("");
  };

  const clearBoard = () => {
    if (!hasContent(present.board)) {
      return;
    }

    setSelectedPoint(null);
    commit(newSnapshot(size, firstColor));
    setNotice("");
  };

  const zoomIndex = ZOOM_LEVELS.indexOf(
    zoom as (typeof ZOOM_LEVELS)[number],
  );
  const canZoomOut = zoomIndex > 0;
  const canZoomIn = zoomIndex < ZOOM_LEVELS.length - 1;
  const isSimulationStarted = present.nextMoveNumber > 1;

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

      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) {
        return;
      }

      if (
        (key === "delete" || key === "backspace") &&
        mode === "setup" &&
        selectedPoint
      ) {
        event.preventDefault();
        const selectedCell =
          present.board[selectedPoint.y]?.[selectedPoint.x];

        if (selectedCell?.stone) {
          commit({
            ...present,
            board: removePoint(present.board, selectedPoint),
          });
        }

        setSelectedPoint(null);
        setNotice("");
        return;
      }

      if (key === "escape" && selectedPoint) {
        event.preventDefault();
        setSelectedPoint(null);
        return;
      }

      switch (key) {
        case "m":
          event.preventDefault();
          handleModeChange(mode === "setup" ? "simulation" : "setup");
          break;
        case "s":
          event.preventDefault();
          if (mode === "setup") {
            setSelectedColor(oppositeColor(selectedColor));
          } else if (!isSimulationStarted) {
            handleFirstColorChange(oppositeColor(firstColor));
          }
          break;
        case "t": {
          event.preventDefault();
          const toolIndex = TOOLS.indexOf(tool);
          handleToolChange(TOOLS[(toolIndex + 1) % TOOLS.length]);
          break;
        }
        case "b": {
          event.preventDefault();
          const boardIndex = BOARD_SIZES.indexOf(size);
          handleSizeChange(
            BOARD_SIZES[(boardIndex + 1) % BOARD_SIZES.length],
          );
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    firstColor,
    isSimulationStarted,
    mode,
    present,
    redo,
    selectedColor,
    selectedPoint,
    size,
    tool,
    undo,
  ]);

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
        <aside className="control-panel" aria-label="Board controls">
          <div className="control-group">
            <span className="control-label">Mode</span>
            <div className="segmented wide">
              <SegmentedButton
                value="setup"
                current={mode}
                onSelect={handleModeChange}
              >
                Setup
              </SegmentedButton>
              <SegmentedButton
                value="simulation"
                current={mode}
                onSelect={handleModeChange}
              >
                Simulation
              </SegmentedButton>
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">
              {mode === "setup" ? "Stone" : "First move"}
            </span>
            <div className="segmented wide color-picker">
              <SegmentedButton
                value="black"
                current={
                  mode === "setup" ? selectedColor : firstColor
                }
                onSelect={
                  mode === "setup"
                    ? setSelectedColor
                    : handleFirstColorChange
                }
                disabled={mode === "simulation" && isSimulationStarted}
              >
                <span className="stone-swatch black" aria-hidden="true" />
                Black
              </SegmentedButton>
              <SegmentedButton
                value="white"
                current={
                  mode === "setup" ? selectedColor : firstColor
                }
                onSelect={
                  mode === "setup"
                    ? setSelectedColor
                    : handleFirstColorChange
                }
                disabled={mode === "simulation" && isSimulationStarted}
              >
                <span className="stone-swatch white" aria-hidden="true" />
                White
              </SegmentedButton>
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">Tool</span>
            <div className="segmented tool-picker">
              <SegmentedButton
                value="stone"
                current={tool}
                onSelect={handleToolChange}
                ariaLabel="Place stones"
              >
                <CircleDot size={18} strokeWidth={1.8} />
              </SegmentedButton>
              <SegmentedButton
                value="triangle"
                current={tool}
                onSelect={handleToolChange}
                ariaLabel="Triangle label"
              >
                <Triangle size={18} strokeWidth={1.8} />
              </SegmentedButton>
              <SegmentedButton
                value="circle"
                current={tool}
                onSelect={handleToolChange}
                ariaLabel="Circle label"
              >
                <Circle size={18} strokeWidth={1.8} />
              </SegmentedButton>
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">Board</span>
            <div className="segmented wide">
              {BOARD_SIZES.map((boardSize) => (
                <SegmentedButton
                  key={boardSize}
                  value={boardSize}
                  current={size}
                  onSelect={handleSizeChange}
                >
                  {boardSize} x {boardSize}
                </SegmentedButton>
              ))}
            </div>
          </div>
        </aside>

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
                    disabled={history.past.length === 0}
                    onClick={undo}
                  >
                    <Undo2 size={18} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Redo"
                    title="Redo"
                    disabled={history.future.length === 0}
                    onClick={redo}
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
                    onClick={() => setZoom(ZOOM_LEVELS[zoomIndex - 1])}
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
                    onClick={() => setZoom(ZOOM_LEVELS[zoomIndex + 1])}
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Reset zoom"
                    title="Reset zoom"
                    disabled={zoom === 100}
                    onClick={() => setZoom(100)}
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
                  onClick={clearBoard}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div
              className={`board-stage${isPanning ? " is-panning" : ""}`}
              onPointerDown={handleBoardPointerDown}
              onPointerMove={handleBoardPointerMove}
              onPointerUp={finishBoardPointer}
              onPointerCancel={finishBoardPointer}
              onLostPointerCapture={(event) => {
                if (boardPan.current?.pointerId === event.pointerId) {
                  boardPan.current = null;
                  setIsPanning(false);
                }
              }}
              onContextMenu={(event) => event.preventDefault()}
            >
              <GoBoard
                board={present.board}
                size={size}
                mode={mode}
                tool={tool}
                selectedColor={selectedColor}
                nextColor={present.nextColor}
                selectedPoint={selectedPoint}
                zoom={zoom}
                onPointClick={handlePointClick}
                onSetupStoneDragCommit={handleSetupStoneDragCommit}
              />
            </div>

            <div className="board-footer">
              <span className="notice" role="status" aria-live="polite">
                {notice}
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
      </div>
      <ShortcutHelp />
    </div>
  );
}
