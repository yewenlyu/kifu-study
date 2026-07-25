import {
  createBoard,
  type Board,
  type BoardSize,
  type Mark,
  type Point,
  type StoneColor,
} from "../../domain/go";
import { createHistory, type History } from "./history";

export type Mode = "setup" | "simulation";
export type Tool = "stone" | Mark;

export const TOOLS: readonly Tool[] = ["stone", "triangle", "circle"];

export interface Captures {
  black: number;
  white: number;
}

export interface StudySnapshot {
  board: Board;
  nextMoveNumber: number;
  nextColor: StoneColor;
  captures: Captures;
}

export interface StudySession {
  size: BoardSize;
  mode: Mode;
  selectedColor: StoneColor;
  firstColor: StoneColor;
  tool: Tool;
  selectedPoint: Point | null;
  notice: string;
  history: History<StudySnapshot>;
}

export function createStudySnapshot(
  size: BoardSize,
  firstColor: StoneColor,
): StudySnapshot {
  return {
    board: createBoard(size),
    nextMoveNumber: 1,
    nextColor: firstColor,
    captures: { black: 0, white: 0 },
  };
}

export function createStudySession(): StudySession {
  const firstColor = "black";
  const size = 19;

  return {
    size,
    mode: "setup",
    selectedColor: "black",
    firstColor,
    tool: "stone",
    selectedPoint: null,
    notice: "",
    history: createHistory(createStudySnapshot(size, firstColor)),
  };
}

export function isSimulationStarted(session: StudySession): boolean {
  return session.history.present.nextMoveNumber > 1;
}
