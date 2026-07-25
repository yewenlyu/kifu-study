import type { BoardSize, Point } from "../../domain/go";

export const BOARD_CANVAS_SIZE = 720;
export const BOARD_PADDING = 42;
export const GRID_STROKE_WIDTH = 1.55;
export const EDGE_GRID_STROKE_WIDTH = 2.8;

export interface BoardGeometry {
  step: number;
  stoneRadius: number;
}

export function createBoardGeometry(size: BoardSize): BoardGeometry {
  const step =
    (BOARD_CANVAS_SIZE - BOARD_PADDING * 2) / (size - 1);
  return {
    step,
    stoneRadius: (step - GRID_STROKE_WIDTH) / 2,
  };
}

export function boardCoordinate(index: number, step: number): number {
  return BOARD_PADDING + index * step;
}

export function boardPoints(size: BoardSize): Point[] {
  return Array.from({ length: size * size }, (_, index) => ({
    x: index % size,
    y: Math.floor(index / size),
  }));
}

export function starPoints(size: BoardSize): Point[] {
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

export function pointFromClientPosition(
  clientX: number,
  clientY: number,
  bounds: Pick<DOMRect, "left" | "top" | "width" | "height">,
  size: BoardSize,
  step: number,
): Point | null {
  const localX =
    ((clientX - bounds.left) * BOARD_CANVAS_SIZE) / bounds.width;
  const localY =
    ((clientY - bounds.top) * BOARD_CANVAS_SIZE) / bounds.height;
  const x = Math.round((localX - BOARD_PADDING) / step);
  const y = Math.round((localY - BOARD_PADDING) / step);

  if (x < 0 || x >= size || y < 0 || y >= size) {
    return null;
  }

  return Math.hypot(
    localX - boardCoordinate(x, step),
    localY - boardCoordinate(y, step),
  ) <=
    step * 0.47
    ? { x, y }
    : null;
}
