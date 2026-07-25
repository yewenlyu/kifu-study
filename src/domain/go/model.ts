export const BOARD_SIZES = [9, 13, 19] as const;

export type BoardSize = (typeof BOARD_SIZES)[number];
export type StoneColor = "black" | "white";
export type Mark = "triangle" | "circle";

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
