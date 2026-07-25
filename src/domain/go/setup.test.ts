import { describe, expect, it } from "vitest";
import { createBoard } from "./model";
import {
  canPlaceSetupStones,
  placeSetupStone,
  placeSetupStones,
} from "./setup";

describe("setup placement", () => {
  it("places either color without applying captures or self-capture", () => {
    let board = createBoard(9);
    board = placeSetupStone(board, { x: 1, y: 1 }, "white");
    board = placeSetupStone(board, { x: 0, y: 1 }, "black");
    board = placeSetupStone(board, { x: 1, y: 0 }, "black");
    board = placeSetupStone(board, { x: 2, y: 1 }, "black");
    board = placeSetupStone(board, { x: 1, y: 2 }, "black");
    board = placeSetupStone(board, { x: 4, y: 4 }, "white");

    expect(board[1][1].stone).toBe("white");
    expect(board[2][1].stone).toBe("black");
    expect(board[4][4].stone).toBe("white");
  });

  it("places a batch atomically and leaves the input unchanged", () => {
    const board = createBoard(9);
    const points = [
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
    ];

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
    const points = [
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ];

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
