import {
  cloneBoard,
  oppositeColor,
  type Board,
  type Point,
  type StoneColor,
} from "./model";

export type MoveResult =
  | { ok: true; board: Board; captured: number }
  | { ok: false; reason: "occupied" | "self-capture" | "ko" };

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

function hasSameStonePosition(left: Board, right: Board): boolean {
  return (
    left.length === right.length &&
    left.every(
      (row, y) =>
        row.length === right[y].length &&
        row.every((cell, x) => cell.stone === right[y][x].stone),
    )
  );
}

export function playMove(
  board: Board,
  point: Point,
  color: StoneColor,
  moveNumber: number,
  koPosition?: Board,
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
          mark: null,
        };
      });
    }
  }

  if (collectGroup(nextBoard, point).liberties.size === 0) {
    return { ok: false, reason: "self-capture" };
  }

  if (koPosition && hasSameStonePosition(nextBoard, koPosition)) {
    return { ok: false, reason: "ko" };
  }

  return { ok: true, board: nextBoard, captured };
}
