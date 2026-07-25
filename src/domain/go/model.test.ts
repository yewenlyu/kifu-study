import { describe, expect, it } from "vitest";
import {
  BOARD_SIZES,
  cloneBoard,
  createBoard,
  hasContent,
  oppositeColor,
  removePoint,
  toggleMark,
} from "./model";

describe("board model", () => {
  it.each(BOARD_SIZES)("creates an empty %s by %s board", (size) => {
    const board = createBoard(size);

    expect(board).toHaveLength(size);
    expect(board.every((row) => row.length === size)).toBe(true);
    expect(board.flat().every((cell) => cell.stone === null)).toBe(true);
  });

  it("creates independent cells and deeply clones a board", () => {
    const board = createBoard(9);
    const clone = cloneBoard(board);

    clone[0][0].stone = "black";
    clone[0][1].mark = "circle";

    expect(board[0][0].stone).toBeNull();
    expect(board[0][1].mark).toBeNull();
    expect(clone).not.toBe(board);
    expect(clone[0]).not.toBe(board[0]);
    expect(clone[0][0]).not.toBe(board[0][0]);
  });

  it("returns the opposite color", () => {
    expect(oppositeColor("black")).toBe("white");
    expect(oppositeColor("white")).toBe("black");
  });

  it("clears a point and its content immutably", () => {
    const board = createBoard(9);
    board[4][4] = {
      stone: "black",
      moveNumber: 12,
      mark: "triangle",
    };

    const result = removePoint(board, { x: 4, y: 4 });

    expect(result[4][4]).toEqual({
      stone: null,
      moveNumber: null,
      mark: null,
    });
    expect(board[4][4]).toEqual({
      stone: "black",
      moveNumber: 12,
      mark: "triangle",
    });
  });

  it("adds, replaces, and removes marks while preserving stone data", () => {
    const board = createBoard(9);
    board[2][2].stone = "white";

    const triangle = toggleMark(board, { x: 2, y: 2 }, "triangle");
    const circle = toggleMark(triangle, { x: 2, y: 2 }, "circle");
    const removed = toggleMark(circle, { x: 2, y: 2 }, "circle");

    expect(triangle[2][2]).toEqual({
      stone: "white",
      moveNumber: null,
      mark: "triangle",
    });
    expect(circle[2][2].mark).toBe("circle");
    expect(removed[2][2].mark).toBeNull();
    expect(board[2][2].mark).toBeNull();
  });

  it("detects each kind of board content", () => {
    const empty = createBoard(9);
    const withStone = cloneBoard(empty);
    const withMoveNumber = cloneBoard(empty);
    const withMark = cloneBoard(empty);
    withStone[0][0].stone = "black";
    withMoveNumber[0][0].moveNumber = 1;
    withMark[0][0].mark = "circle";

    expect(hasContent(empty)).toBe(false);
    expect(hasContent(withStone)).toBe(true);
    expect(hasContent(withMoveNumber)).toBe(true);
    expect(hasContent(withMark)).toBe(true);
  });
});
