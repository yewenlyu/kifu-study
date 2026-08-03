import { describe, expect, it } from "vitest";
import {
  createBoard,
  type Board,
  type Point,
  type StoneColor,
} from "./model";
import { playMove } from "./rules";

function boardWith(
  stones: Array<[Point, StoneColor]>,
): Board {
  const board = createBoard(9);
  for (const [{ x, y }, color] of stones) {
    board[y][x].stone = color;
  }
  return board;
}

describe("playMove", () => {
  it("places and numbers a legal move without mutating the input", () => {
    const board = createBoard(9);
    board[4][4].mark = "triangle";

    const result = playMove(board, { x: 4, y: 4 }, "black", 1);

    expect(result.ok).toBe(true);
    expect(board[4][4]).toEqual({
      stone: null,
      moveNumber: null,
      mark: "triangle",
    });
    if (result.ok) {
      expect(result.board[4][4]).toEqual({
        stone: "black",
        moveNumber: 1,
        mark: "triangle",
      });
      expect(result.captured).toBe(0);
    }
  });

  it("captures a surrounded stone", () => {
    const board = boardWith([
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

  it("captures an entire connected group and clears its numbers and marks", () => {
    const board = boardWith([
      [{ x: 1, y: 1 }, "white"],
      [{ x: 2, y: 1 }, "white"],
      [{ x: 0, y: 1 }, "black"],
      [{ x: 1, y: 0 }, "black"],
      [{ x: 1, y: 2 }, "black"],
      [{ x: 2, y: 0 }, "black"],
      [{ x: 3, y: 1 }, "black"],
    ]);
    board[1][1].moveNumber = 4;
    board[1][1].mark = "triangle";
    board[1][2].moveNumber = 5;
    board[1][2].mark = "circle";

    const result = playMove(board, { x: 2, y: 2 }, "black", 8);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.board[1][1]).toMatchObject({
        stone: null,
        moveNumber: null,
        mark: null,
      });
      expect(result.board[1][2]).toMatchObject({
        stone: null,
        moveNumber: null,
        mark: null,
      });
      expect(result.captured).toBe(2);
    }
  });

  it("captures multiple disconnected groups with one move", () => {
    const board = boardWith([
      [{ x: 1, y: 0 }, "white"],
      [{ x: 0, y: 1 }, "white"],
      [{ x: 0, y: 0 }, "black"],
      [{ x: 2, y: 0 }, "black"],
      [{ x: 0, y: 2 }, "black"],
    ]);

    const result = playMove(board, { x: 1, y: 1 }, "black", 9);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.captured).toBe(2);
      expect(result.board[0][1].stone).toBeNull();
      expect(result.board[1][0].stone).toBeNull();
    }
  });

  it("forbids self-capture in the center and at an edge", () => {
    const centerBoard = boardWith([
      [{ x: 0, y: 1 }, "black"],
      [{ x: 1, y: 0 }, "black"],
      [{ x: 2, y: 1 }, "black"],
      [{ x: 1, y: 2 }, "black"],
    ]);
    const edgeBoard = boardWith([
      [{ x: 0, y: 0 }, "black"],
      [{ x: 1, y: 1 }, "black"],
      [{ x: 0, y: 2 }, "black"],
    ]);

    expect(playMove(centerBoard, { x: 1, y: 1 }, "white", 1)).toEqual({
      ok: false,
      reason: "self-capture",
    });
    expect(playMove(edgeBoard, { x: 0, y: 1 }, "white", 1)).toEqual({
      ok: false,
      reason: "self-capture",
    });
  });

  it("allows a move with no initial liberties when it captures", () => {
    const board = boardWith([
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

  it("allows a move that connects to a friendly group with liberties", () => {
    const board = boardWith([
      [{ x: 0, y: 1 }, "white"],
      [{ x: 1, y: 0 }, "white"],
      [{ x: 2, y: 1 }, "white"],
      [{ x: 1, y: 2 }, "black"],
    ]);

    const result = playMove(board, { x: 1, y: 1 }, "black", 6);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.board[1][1].stone).toBe("black");
      expect(result.board[2][1].stone).toBe("black");
    }
  });

  it("rejects an immediate ko recapture based only on stone positions", () => {
    const koPosition = boardWith([
      [{ x: 0, y: 1 }, "black"],
      [{ x: 1, y: 0 }, "black"],
      [{ x: 2, y: 1 }, "black"],
      [{ x: 1, y: 1 }, "white"],
      [{ x: 0, y: 2 }, "white"],
      [{ x: 2, y: 2 }, "white"],
      [{ x: 1, y: 3 }, "white"],
    ]);
    koPosition[1][1].moveNumber = 42;
    koPosition[1][1].mark = "circle";

    const capture = playMove(
      koPosition,
      { x: 1, y: 2 },
      "black",
      1,
    );
    expect(capture.ok).toBe(true);
    if (!capture.ok) {
      return;
    }

    expect(
      playMove(
        capture.board,
        { x: 1, y: 1 },
        "white",
        2,
        koPosition,
      ),
    ).toEqual({ ok: false, reason: "ko" });
  });

  it("allows a ko recapture after an intervening exchange", () => {
    const koPosition = boardWith([
      [{ x: 0, y: 1 }, "black"],
      [{ x: 1, y: 0 }, "black"],
      [{ x: 2, y: 1 }, "black"],
      [{ x: 1, y: 1 }, "white"],
      [{ x: 0, y: 2 }, "white"],
      [{ x: 2, y: 2 }, "white"],
      [{ x: 1, y: 3 }, "white"],
    ]);
    const capture = playMove(
      koPosition,
      { x: 1, y: 2 },
      "black",
      1,
    );
    expect(capture.ok).toBe(true);
    if (!capture.ok) {
      return;
    }

    const threat = playMove(
      capture.board,
      { x: 5, y: 5 },
      "white",
      2,
      koPosition,
    );
    expect(threat.ok).toBe(true);
    if (!threat.ok) {
      return;
    }

    const response = playMove(
      threat.board,
      { x: 6, y: 5 },
      "black",
      3,
      capture.board,
    );
    expect(response.ok).toBe(true);
    if (!response.ok) {
      return;
    }

    const recapture = playMove(
      response.board,
      { x: 1, y: 1 },
      "white",
      4,
      threat.board,
    );
    expect(recapture.ok).toBe(true);
    if (recapture.ok) {
      expect(recapture.board[1][1].stone).toBe("white");
      expect(recapture.board[2][1].stone).toBeNull();
    }
  });

  it("rejects occupied intersections without mutating the board", () => {
    const board = boardWith([[{ x: 3, y: 3 }, "white"]]);

    expect(playMove(board, { x: 3, y: 3 }, "black", 2)).toEqual({
      ok: false,
      reason: "occupied",
    });
    expect(board[3][3].stone).toBe("white");
  });
});
