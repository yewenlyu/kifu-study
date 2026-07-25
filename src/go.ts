export const BOARD_SIZES = [9, 13, 19] as const;

export type BoardSize = (typeof BOARD_SIZES)[number];
export type StoneColor = "black" | "white";
export type Mark = "triangle" | "circle";
export type GridAxis = "horizontal" | "vertical";

export interface Cell {
  stone: StoneColor | null;
  moveNumber: number | null;
  mark: Mark | null;
}

export type Board = Cell[][];

export interface Point {
  x: number;
  y: number;
}

export type MoveResult =
  | { ok: true; board: Board; captured: number }
  | { ok: false; reason: "occupied" | "self-capture" };

const emptyCell = (): Cell => ({
  stone: null,
  moveNumber: null,
  mark: null,
});

export function createBoard(size: BoardSize): Board {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, emptyCell),
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function oppositeColor(color: StoneColor): StoneColor {
  return color === "black" ? "white" : "black";
}

function pointKey({ x, y }: Point): string {
  return `${x}:${y}`;
}

function neighbors(point: Point, size: number): Point[] {
  const candidates = [
    { x: point.x - 1, y: point.y },
    { x: point.x + 1, y: point.y },
    { x: point.x, y: point.y - 1 },
    { x: point.x, y: point.y + 1 },
  ];

  return candidates.filter(
    ({ x, y }) => x >= 0 && x < size && y >= 0 && y < size,
  );
}

function collectGroup(board: Board, start: Point): {
  stones: Point[];
  liberties: Set<string>;
} {
  const color = board[start.y][start.x].stone;
  const stones: Point[] = [];
  const liberties = new Set<string>();
  const visited = new Set<string>();
  const stack = [start];

  while (stack.length > 0) {
    const point = stack.pop()!;
    const key = pointKey(point);

    if (visited.has(key)) {
      continue;
    }

    visited.add(key);
    stones.push(point);

    for (const neighbor of neighbors(point, board.length)) {
      const neighborCell = board[neighbor.y][neighbor.x];
      if (neighborCell.stone === null) {
        liberties.add(pointKey(neighbor));
      } else if (
        neighborCell.stone === color &&
        !visited.has(pointKey(neighbor))
      ) {
        stack.push(neighbor);
      }
    }
  }

  return { stones, liberties };
}

export function playMove(
  board: Board,
  point: Point,
  color: StoneColor,
  moveNumber: number,
): MoveResult {
  if (board[point.y][point.x].stone !== null) {
    return { ok: false, reason: "occupied" };
  }

  const nextBoard = cloneBoard(board);
  nextBoard[point.y][point.x] = {
    ...nextBoard[point.y][point.x],
    stone: color,
    moveNumber,
  };

  const opponent = oppositeColor(color);
  const checkedOpponentStones = new Set<string>();
  let captured = 0;

  for (const neighbor of neighbors(point, nextBoard.length)) {
    if (
      nextBoard[neighbor.y][neighbor.x].stone !== opponent ||
      checkedOpponentStones.has(pointKey(neighbor))
    ) {
      continue;
    }

    const group = collectGroup(nextBoard, neighbor);
    group.stones.forEach((stone) =>
      checkedOpponentStones.add(pointKey(stone)),
    );

    if (group.liberties.size === 0) {
      captured += group.stones.length;
      group.stones.forEach(({ x, y }) => {
        nextBoard[y][x] = {
          ...nextBoard[y][x],
          stone: null,
          moveNumber: null,
        };
      });
    }
  }

  if (collectGroup(nextBoard, point).liberties.size === 0) {
    return { ok: false, reason: "self-capture" };
  }

  return { ok: true, board: nextBoard, captured };
}

export function placeSetupStone(
  board: Board,
  point: Point,
  color: StoneColor,
): Board {
  return placeSetupStones(board, [point], color);
}

export function placeSetupStones(
  board: Board,
  points: Point[],
  color: StoneColor,
): Board {
  if (!canPlaceSetupStones(board, points)) {
    return board;
  }

  const nextBoard = cloneBoard(board);
  for (const { x, y } of points) {
    nextBoard[y][x] = {
      ...nextBoard[y][x],
      stone: color,
      moveNumber: null,
    };
  }

  return nextBoard;
}

export function canPlaceSetupStones(
  board: Board,
  points: Point[],
): boolean {
  return (
    points.length > 0 &&
    points.every(({ x, y }) => board[y]?.[x]?.stone === null)
  );
}

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

export function removePoint(board: Board, point: Point): Board {
  const nextBoard = cloneBoard(board);
  nextBoard[point.y][point.x] = emptyCell();
  return nextBoard;
}

export function toggleMark(
  board: Board,
  point: Point,
  mark: Mark,
): Board {
  const nextBoard = cloneBoard(board);
  const current = nextBoard[point.y][point.x];
  nextBoard[point.y][point.x] = {
    ...current,
    mark: current.mark === mark ? null : mark,
  };
  return nextBoard;
}

export function hasContent(board: Board): boolean {
  return board.some((row) =>
    row.some(
      (cell) =>
        cell.stone !== null ||
        cell.moveNumber !== null ||
        cell.mark !== null,
    ),
  );
}
