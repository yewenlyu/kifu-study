import { fireEvent, screen } from "@testing-library/react";
import type { BoardSize, Point } from "../../../domain/go";

export const CANVAS_SIZE = 720;
export const PADDING = 42;

export function boardElement(): SVGSVGElement {
  const board = screen.getByRole("img", {
    name: /\d+ by \d+ Go board/,
  }) as unknown as SVGSVGElement;

  Object.defineProperty(board, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      bottom: CANVAS_SIZE,
      height: CANVAS_SIZE,
      left: 0,
      right: CANVAS_SIZE,
      top: 0,
      width: CANVAS_SIZE,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });

  return board;
}

function boardSize(board = boardElement()): BoardSize {
  return Number(board.dataset.boardSize) as BoardSize;
}

export function clientPoint(point: Point, board = boardElement()) {
  const step = (CANVAS_SIZE - PADDING * 2) / (boardSize(board) - 1);
  return {
    clientX: PADDING + point.x * step,
    clientY: PADDING + point.y * step,
  };
}

function hitTarget(point: Point, board = boardElement()): SVGCircleElement {
  const target = board.querySelector<SVGCircleElement>(
    `.hit-targets [data-point="${point.x},${point.y}"]`,
  );
  if (!target) {
    throw new Error(`Missing hit target at ${point.x},${point.y}`);
  }
  return target;
}

function groupAt(
  selector: ".stones > g" | ".marks > g",
  point: Point,
  board = boardElement(),
): SVGGElement | null {
  return board.querySelector<SVGGElement>(
    `${selector}[data-point="${point.x},${point.y}"]`,
  );
}

export function stoneAt(point: Point, board = boardElement()) {
  return groupAt(".stones > g", point, board);
}

export function markAt(point: Point, board = boardElement()) {
  return groupAt(".marks > g", point, board);
}

export function placeSetupStone(point: Point, pointerId = 1) {
  const board = boardElement();
  const position = clientPoint(point, board);

  fireEvent.pointerDown(board, {
    ...position,
    button: 0,
    pointerId,
  });
  fireEvent.pointerUp(board, {
    ...position,
    button: 0,
    pointerId,
  });
}

export function clickPoint(point: Point) {
  fireEvent.click(hitTarget(point));
}

export function rightClickPoint(point: Point) {
  fireEvent.contextMenu(hitTarget(point));
}

export function dragSetupStonePath(points: Point[], pointerId = 1) {
  const board = boardElement();
  const [start, ...rest] = points;

  fireEvent.pointerDown(board, {
    ...clientPoint(start, board),
    button: 0,
    pointerId,
  });
  for (const point of rest) {
    fireEvent.pointerMove(board, {
      ...clientPoint(point, board),
      button: 0,
      pointerId,
    });
  }

  return board;
}
