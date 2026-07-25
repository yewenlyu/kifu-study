import { describe, expect, it } from "vitest";
import {
  BOARD_SIZES,
  canPlaceSetupStones,
  cloneBoard,
  createBoard,
  hasContent,
  oppositeColor,
  placeSetupStone,
  placeSetupStones,
  playMove,
  pointsAlongAxis,
  pointsAlongOrthogonalPath,
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

describe("board utilities", () => {
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
});

describe("playMove", () => {
  it("places and numbers a legal move without mutating the input", () => {
    const board = toggleMark(createBoard(9), { x: 4, y: 4 }, "triangle");
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

  it("captures an entire connected group and clears its move numbers", () => {
    let board = place(createBoard(9), [
      [{ x: 1, y: 1 }, "white"],
      [{ x: 2, y: 1 }, "white"],
      [{ x: 0, y: 1 }, "black"],
      [{ x: 1, y: 0 }, "black"],
      [{ x: 1, y: 2 }, "black"],
      [{ x: 2, y: 0 }, "black"],
      [{ x: 3, y: 1 }, "black"],
    ]);
    board = cloneBoard(board);
    board[1][1].moveNumber = 4;
    board[1][2].moveNumber = 5;

    const result = playMove(board, { x: 2, y: 2 }, "black", 8);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.board[1][1]).toMatchObject({
        stone: null,
        moveNumber: null,
      });
      expect(result.board[1][2]).toMatchObject({
        stone: null,
        moveNumber: null,
      });
      expect(result.captured).toBe(2);
    }
  });

  it("captures multiple disconnected groups with one move", () => {
    const board = place(createBoard(9), [
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
    const centerBoard = place(createBoard(9), [
      [{ x: 0, y: 1 }, "black"],
      [{ x: 1, y: 0 }, "black"],
      [{ x: 2, y: 1 }, "black"],
      [{ x: 1, y: 2 }, "black"],
    ]);
    const edgeBoard = place(createBoard(9), [
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

  it("allows a move that connects to a friendly group with liberties", () => {
    const board = place(createBoard(9), [
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

  it("rejects occupied intersections without mutating the board", () => {
    const board = placeSetupStone(
      createBoard(9),
      { x: 3, y: 3 },
      "white",
    );

    expect(playMove(board, { x: 3, y: 3 }, "black", 2)).toEqual({
      ok: false,
      reason: "occupied",
    });
    expect(board[3][3].stone).toBe("white");
  });
});

describe("setup placement", () => {
  it("places either color without applying captures or self-capture", () => {
    let board = place(createBoard(9), [
      [{ x: 1, y: 1 }, "white"],
      [{ x: 0, y: 1 }, "black"],
      [{ x: 1, y: 0 }, "black"],
      [{ x: 2, y: 1 }, "black"],
    ]);

    board = placeSetupStone(board, { x: 1, y: 2 }, "black");
    board = placeSetupStone(board, { x: 4, y: 4 }, "white");

    expect(board[1][1].stone).toBe("white");
    expect(board[2][1].stone).toBe("black");
    expect(board[4][4].stone).toBe("white");
  });

  it("places a batch atomically and leaves the input unchanged", () => {
    const board = createBoard(9);
    const points = pointsAlongAxis({ x: 3, y: 1 }, { x: 3, y: 4 });

    const result = placeSetupStones(board, points, "black");

    expect(canPlaceSetupStones(board, points)).toBe(true);
    expect(result.slice(1, 5).map((row) => row[3].stone)).toEqual([
      "black",
      "black",
      "black",
      "black",
    ]);
    expect(board[1][3].stone).toBeNull();
  });

  it("rejects the entire batch when any point is occupied", () => {
    const board = placeSetupStone(
      createBoard(9),
      { x: 2, y: 4 },
      "white",
    );
    const points = pointsAlongAxis({ x: 0, y: 4 }, { x: 4, y: 4 });

    const result = placeSetupStones(board, points, "black");

    expect(canPlaceSetupStones(board, points)).toBe(false);
    expect(result).toBe(board);
    expect(board[4][0].stone).toBeNull();
    expect(board[4][4].stone).toBeNull();
  });

  it("rejects empty and out-of-bounds batches", () => {
    const board = createBoard(9);

    expect(canPlaceSetupStones(board, [])).toBe(false);
    expect(canPlaceSetupStones(board, [{ x: -1, y: 0 }])).toBe(false);
    expect(canPlaceSetupStones(board, [{ x: 9, y: 8 }])).toBe(false);
    expect(placeSetupStones(board, [], "black")).toBe(board);
  });
});

describe("path generation", () => {
  it("returns consecutive horizontal and vertical points in either direction", () => {
    expect(pointsAlongAxis({ x: 1, y: 2 }, { x: 5, y: 2 })).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
    ]);
    expect(pointsAlongAxis({ x: 3, y: 4 }, { x: 3, y: 1 })).toEqual([
      { x: 3, y: 4 },
      { x: 3, y: 3 },
      { x: 3, y: 2 },
      { x: 3, y: 1 },
    ]);
    expect(pointsAlongAxis({ x: 4, y: 2 }, { x: 1, y: 2 })).toEqual([
      { x: 4, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ]);
  });

  it("handles a stationary point and rejects a diagonal axis", () => {
    expect(pointsAlongAxis({ x: 2, y: 2 }, { x: 2, y: 2 })).toEqual([
      { x: 2, y: 2 },
    ]);
    expect(pointsAlongAxis({ x: 1, y: 2 }, { x: 5, y: 4 })).toEqual([]);
  });

  it("routes diagonal movement through the selected right-angle corner", () => {
    expect(
      pointsAlongOrthogonalPath(
        { x: 1, y: 1 },
        { x: 4, y: 3 },
        "horizontal",
      ),
    ).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 4, y: 2 },
      { x: 4, y: 3 },
    ]);
    expect(
      pointsAlongOrthogonalPath(
        { x: 4, y: 3 },
        { x: 2, y: 5 },
        "vertical",
      ),
    ).toEqual([
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 2, y: 5 },
    ]);
  });

  it("uses the direct path when the endpoints already share an axis", () => {
    expect(
      pointsAlongOrthogonalPath(
        { x: 2, y: 1 },
        { x: 2, y: 3 },
        "horizontal",
      ),
    ).toEqual([
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ]);
  });
});

describe("board content editing", () => {
  it("clears a point and its stone, move number, and mark immutably", () => {
    let board = toggleMark(
      placeSetupStone(createBoard(9), { x: 4, y: 4 }, "black"),
      { x: 4, y: 4 },
      "triangle",
    );
    board = cloneBoard(board);
    board[4][4].moveNumber = 12;

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
    const board = placeSetupStone(
      createBoard(9),
      { x: 2, y: 2 },
      "white",
    );
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

  it("detects stones, move numbers, and marks as board content", () => {
    const empty = createBoard(9);
    const numbered = cloneBoard(empty);
    numbered[0][0].moveNumber = 1;

    expect(hasContent(empty)).toBe(false);
    expect(
      hasContent(placeSetupStone(empty, { x: 0, y: 0 }, "black")),
    ).toBe(true);
    expect(hasContent(toggleMark(empty, { x: 0, y: 0 }, "circle"))).toBe(
      true,
    );
    expect(hasContent(numbered)).toBe(true);
  });
});
