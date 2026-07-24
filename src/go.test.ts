import { describe, expect, it } from "vitest";
import {
  createBoard,
  placeSetupStone,
  playMove,
  removePoint,
  toggleMark,
  type Board,
  type Point,
  type StoneColor,
} from "./go";

function place(
  board: Board,
  stones: Array<[Point, StoneColor]>,
): Board {
  return stones.reduce(
    (current, [point, color]) => placeSetupStone(current, point, color),
    board,
  );
}

describe("playMove", () => {
  it("places and numbers a legal move", () => {
    const result = playMove(createBoard(9), { x: 4, y: 4 }, "black", 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.board[4][4]).toMatchObject({
        stone: "black",
        moveNumber: 1,
      });
      expect(result.captured).toBe(0);
    }
  });

  it("captures a surrounded stone", () => {
    const board = place(createBoard(9), [
      [{ x: 1, y: 1 }, "white"],
      [{ x: 0, y: 1 }, "black"],
      [{ x: 1, y: 0 }, "black"],
      [{ x: 2, y: 1 }, "black"],
    ]);

    const result = playMove(board, { x: 1, y: 2 }, "black", 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.board[1][1].stone).toBeNull();
      expect(result.captured).toBe(1);
    }
  });

  it("captures an entire connected group", () => {
    const board = place(createBoard(9), [
      [{ x: 1, y: 1 }, "white"],
      [{ x: 2, y: 1 }, "white"],
      [{ x: 0, y: 1 }, "black"],
      [{ x: 1, y: 0 }, "black"],
      [{ x: 1, y: 2 }, "black"],
      [{ x: 2, y: 0 }, "black"],
      [{ x: 3, y: 1 }, "black"],
    ]);

    const result = playMove(board, { x: 2, y: 2 }, "black", 8);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.board[1][1].stone).toBeNull();
      expect(result.board[1][2].stone).toBeNull();
      expect(result.captured).toBe(2);
    }
  });

  it("forbids self-capture", () => {
    const board = place(createBoard(9), [
      [{ x: 0, y: 1 }, "black"],
      [{ x: 1, y: 0 }, "black"],
      [{ x: 2, y: 1 }, "black"],
      [{ x: 1, y: 2 }, "black"],
    ]);

    expect(playMove(board, { x: 1, y: 1 }, "white", 1)).toEqual({
      ok: false,
      reason: "self-capture",
    });
  });

  it("allows a move with no initial liberties when it captures", () => {
    const board = place(createBoard(9), [
      [{ x: 0, y: 0 }, "white"],
      [{ x: 1, y: 0 }, "black"],
    ]);

    const result = playMove(board, { x: 0, y: 1 }, "black", 3);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.board[0][0].stone).toBeNull();
      expect(result.board[1][0].stone).toBe("black");
    }
  });

  it("rejects occupied intersections", () => {
    const board = placeSetupStone(
      createBoard(9),
      { x: 3, y: 3 },
      "white",
    );

    expect(playMove(board, { x: 3, y: 3 }, "black", 2)).toEqual({
      ok: false,
      reason: "occupied",
    });
  });
});

describe("removePoint", () => {
  it("clears a setup stone and its mark", () => {
    const board = toggleMark(
      placeSetupStone(createBoard(9), { x: 4, y: 4 }, "black"),
      { x: 4, y: 4 },
      "triangle",
    );

    expect(removePoint(board, { x: 4, y: 4 })[4][4]).toEqual({
      stone: null,
      moveNumber: null,
      mark: null,
    });
  });
});
