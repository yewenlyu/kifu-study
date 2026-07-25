import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

interface BoardPan {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  startScrollTop: number;
  dragged: boolean;
}

export function useBoardPan() {
  const [isPanning, setIsPanning] = useState(false);
  const boardPan = useRef<BoardPan | null>(null);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 2) {
      return;
    }

    const stage = event.currentTarget;
    const canPan =
      stage.scrollWidth > stage.clientWidth + 1 ||
      stage.scrollHeight > stage.clientHeight + 1;

    if (!canPan) {
      return;
    }

    boardPan.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: stage.scrollLeft,
      startScrollTop: stage.scrollTop,
      dragged: false,
    };

    event.preventDefault();
    stage.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const pan = boardPan.current;
    if (!pan || pan.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - pan.startX;
    const deltaY = event.clientY - pan.startY;
    if (!pan.dragged && Math.hypot(deltaX, deltaY) < 4) {
      return;
    }

    pan.dragged = true;
    event.preventDefault();
    event.currentTarget.scrollLeft = pan.startScrollLeft - deltaX;
    event.currentTarget.scrollTop = pan.startScrollTop - deltaY;
  };

  const finishPointer = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const pan = boardPan.current;
    if (!pan || pan.pointerId !== event.pointerId) {
      return;
    }

    boardPan.current = null;
    setIsPanning(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleLostPointerCapture = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (boardPan.current?.pointerId === event.pointerId) {
      boardPan.current = null;
      setIsPanning(false);
    }
  };

  return {
    isPanning,
    panHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishPointer,
      onPointerCancel: finishPointer,
      onLostPointerCapture: handleLostPointerCapture,
      onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
    },
  };
}
