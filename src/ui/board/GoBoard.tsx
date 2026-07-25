import { useMemo } from "react";
import type {
  Board,
  BoardSize,
  Mark,
  Point,
  StoneColor,
} from "../../domain/go";
import type {
  Mode,
  Tool,
} from "../../application/study-session";
import {
  BOARD_CANVAS_SIZE,
  BOARD_PADDING,
  EDGE_GRID_STROKE_WIDTH,
  GRID_STROKE_WIDTH,
  boardCoordinate,
  boardPoints,
  createBoardGeometry,
  starPoints,
} from "./geometry";
import { useSetupInteraction } from "./useSetupInteraction";

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

export function GoBoard({
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
  const geometry = useMemo(() => createBoardGeometry(size), [size]);
  const points = useMemo(() => boardPoints(size), [size]);
  const { step, stoneRadius } = geometry;
  const {
    hovered,
    setHovered,
    preview,
    pointerHandlers,
  } = useSetupInteraction({
    board,
    size,
    step,
    mode,
    tool,
    selectedColor,
    onPointClick,
    onCommit: onSetupStoneDragCommit,
  });
  const coordinate = (index: number) => boardCoordinate(index, step);
  const previewColor = mode === "setup" ? selectedColor : nextColor;

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
      viewBox={`0 0 ${BOARD_CANVAS_SIZE} ${BOARD_CANVAS_SIZE}`}
      role="img"
      aria-label={`${size} by ${size} Go board`}
      data-board-size={size}
      data-setup-drag-state={
        preview?.status === "previewing" ? "preview" : preview?.status
      }
      {...pointerHandlers}
    >
      <rect
        width={BOARD_CANVAS_SIZE}
        height={BOARD_CANVAS_SIZE}
        fill="#ffffff"
      />

      <g className="grid-lines" aria-hidden="true">
        {Array.from({ length: size }, (_, index) => {
          const position = coordinate(index);
          const isEdge = index === 0 || index === size - 1;
          return (
            <g key={index}>
              <line
                x1={BOARD_PADDING}
                y1={position}
                x2={BOARD_CANVAS_SIZE - BOARD_PADDING}
                y2={position}
                strokeWidth={
                  isEdge
                    ? EDGE_GRID_STROKE_WIDTH
                    : GRID_STROKE_WIDTH
                }
              />
              <line
                x1={position}
                y1={BOARD_PADDING}
                x2={position}
                y2={BOARD_CANVAS_SIZE - BOARD_PADDING}
                strokeWidth={
                  isEdge
                    ? EDGE_GRID_STROKE_WIDTH
                    : GRID_STROKE_WIDTH
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
          const labelColor =
            cell.stone === "black" ? "#ffffff" : "#111111";
          const isSelected =
            selectedPoint?.x === x && selectedPoint.y === y;
          const numberLength = String(cell.moveNumber ?? "").length;
          const fontSize =
            numberLength >= 3 ? stoneRadius * 0.88 : stoneRadius * 1.12;

          return (
            <g
              key={`${x}-${y}`}
              data-point={`${x},${y}`}
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
                strokeWidth={GRID_STROKE_WIDTH}
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
            <g
              key={`${x}-${y}`}
              data-point={`${x},${y}`}
              data-mark={cell.mark}
            >
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

      {preview?.status === "previewing" && (
        <g
          className="setup-drag-preview"
          data-preview-color={preview.color}
          aria-hidden="true"
        >
          {preview.points.map(({ x, y }) => (
            <circle
              key={`${x}-${y}`}
              cx={coordinate(x)}
              cy={coordinate(y)}
              r={stoneRadius}
              fill={preview.color === "black" ? "#111111" : "#ffffff"}
              stroke="#111111"
              strokeWidth={GRID_STROKE_WIDTH}
              data-preview-point={`${x},${y}`}
            />
          ))}
        </g>
      )}

      {preview === null &&
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
                strokeWidth={GRID_STROKE_WIDTH}
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
