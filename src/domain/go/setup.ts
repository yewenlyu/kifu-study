import {
  cloneBoard,
  type Board,
  type Point,
  type StoneColor,
} from "./model";

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
