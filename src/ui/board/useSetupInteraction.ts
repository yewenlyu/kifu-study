import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  Board,
  BoardSize,
  GridAxis,
  Point,
  StoneColor,
} from "../../domain/go";
import {
  canPlaceSetupStones,
  pointsAlongOrthogonalPath,
} from "../../domain/go";
import type {
  Mode,
  Tool,
} from "../../application/study-session";
import { pointFromClientPosition } from "./geometry";

interface SetupPointerDrag {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  endPoint: Point;
  axis: GridAxis | null;
  points: Point[];
  color: StoneColor;
  status: "previewing" | "canceled";
}

export interface SetupDragPreview {
  points: Point[];
  color: StoneColor;
  status: SetupPointerDrag["status"];
}

interface SetupInteractionOptions {
  board: Board;
  size: BoardSize;
  step: number;
  mode: Mode;
  tool: Tool;
  selectedColor: StoneColor;
  onCommit: (points: Point[], color: StoneColor) => void;
}

function mergePoints(points: Point[], nextPoints: Point[]): Point[] {
  const seen = new Set(points.map(({ x, y }) => `${x}:${y}`));
  const merged = [...points];

  for (const point of nextPoints) {
    const key = `${point.x}:${point.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(point);
    }
  }

  return merged;
}

export function useSetupInteraction({
  board,
  size,
  step,
  mode,
  tool,
  selectedColor,
  onCommit,
}: SetupInteractionOptions) {
  const [hovered, setHovered] = useState<Point | null>(null);
  const [preview, setPreview] = useState<SetupDragPreview | null>(null);
  const pointerDrag = useRef<SetupPointerDrag | null>(null);

  useEffect(() => {
    pointerDrag.current = null;
    setPreview(null);
  }, [board, mode, size, tool]);

  const pointFromPointer = (
    event: ReactPointerEvent<SVGSVGElement>,
  ): Point | null =>
    pointFromClientPosition(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      size,
      step,
    );

  const handlePointerDown = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    if (event.button !== 0 || mode !== "setup" || tool !== "stone") {
      return;
    }

    const point = pointFromPointer(event);
    if (!point) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startedOccupied = board[point.y][point.x].stone !== null;
    const status = startedOccupied ? "canceled" : "previewing";
    const points = startedOccupied ? [] : [point];
    pointerDrag.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      endPoint: point,
      axis: null,
      points,
      color: selectedColor,
      status,
    };
    setHovered(point);
    setPreview({ points, color: selectedColor, status });
  };

  const handlePointerMove = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    const drag = pointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const point = pointFromPointer(event);
    setHovered(point);

    if (!point) {
      return;
    }

    if (drag.endPoint.x === point.x && drag.endPoint.y === point.y) {
      return;
    }

    if (drag.status === "canceled") {
      return;
    }

    const movedHorizontally = drag.endPoint.x !== point.x;
    const movedVertically = drag.endPoint.y !== point.y;
    const firstAxis =
      drag.axis ??
      (movedHorizontally && movedVertically
        ? Math.abs(event.clientX - drag.startClientX) >=
          Math.abs(event.clientY - drag.startClientY)
          ? "horizontal"
          : "vertical"
        : movedHorizontally
          ? "horizontal"
          : "vertical");
    const segment = pointsAlongOrthogonalPath(
      drag.endPoint,
      point,
      firstAxis,
    );

    drag.endPoint = point;
    drag.axis =
      movedHorizontally && movedVertically
        ? firstAxis === "horizontal"
          ? "vertical"
          : "horizontal"
        : movedHorizontally
          ? "horizontal"
          : "vertical";

    if (!canPlaceSetupStones(board, segment)) {
      drag.points = [];
      drag.status = "canceled";
    } else {
      drag.points = mergePoints(drag.points, segment);
    }

    setPreview({
      points: drag.points,
      color: drag.color,
      status: drag.status,
    });
  };

  const finishPointer = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    const drag = pointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    pointerDrag.current = null;
    setPreview(null);

    if (drag.status === "previewing") {
      onCommit(drag.points, drag.color);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const cancelPointer = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    const drag = pointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    pointerDrag.current = null;
    setPreview(null);
  };

  return {
    hovered,
    setHovered,
    preview,
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishPointer,
      onPointerCancel: cancelPointer,
      onLostPointerCapture: cancelPointer,
    },
  };
}
