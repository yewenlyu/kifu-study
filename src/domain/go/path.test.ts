import { describe, expect, it } from "vitest";
import {
  pointsAlongAxis,
  pointsAlongOrthogonalPath,
} from "./path";

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
