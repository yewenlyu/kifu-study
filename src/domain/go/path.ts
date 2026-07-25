import type { Point } from "./model";

export type GridAxis = "horizontal" | "vertical";

export function pointsAlongAxis(start: Point, end: Point): Point[] {
  if (start.x !== end.x && start.y !== end.y) {
    return [];
  }

  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY));

  if (steps === 0) {
    return [start];
  }

  return Array.from({ length: steps + 1 }, (_, index) => ({
    x: Math.round(start.x + (deltaX * index) / steps),
    y: Math.round(start.y + (deltaY * index) / steps),
  }));
}

export function pointsAlongOrthogonalPath(
  start: Point,
  end: Point,
  firstAxis: GridAxis,
): Point[] {
  if (start.x === end.x || start.y === end.y) {
    return pointsAlongAxis(start, end);
  }

  const corner =
    firstAxis === "horizontal"
      ? { x: end.x, y: start.y }
      : { x: start.x, y: end.y };

  return [
    ...pointsAlongAxis(start, corner),
    ...pointsAlongAxis(corner, end).slice(1),
  ];
}
