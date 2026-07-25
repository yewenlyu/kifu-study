import { Circle, CircleDot, Triangle } from "lucide-react";
import type {
  Mode,
  Tool,
} from "../../application/study-session";
import {
  BOARD_SIZES,
  type BoardSize,
  type StoneColor,
} from "../../domain/go";
import { SegmentedButton } from "./SegmentedButton";

interface ControlPanelProps {
  mode: Mode;
  selectedColor: StoneColor;
  firstColor: StoneColor;
  tool: Tool;
  size: BoardSize;
  isSimulationStarted: boolean;
  onModeChange: (mode: Mode) => void;
  onSelectedColorChange: (color: StoneColor) => void;
  onFirstColorChange: (color: StoneColor) => void;
  onToolChange: (tool: Tool) => void;
  onSizeChange: (size: BoardSize) => void;
}

export function ControlPanel({
  mode,
  selectedColor,
  firstColor,
  tool,
  size,
  isSimulationStarted,
  onModeChange,
  onSelectedColorChange,
  onFirstColorChange,
  onToolChange,
  onSizeChange,
}: ControlPanelProps) {
  return (
    <aside className="control-panel" aria-label="Board controls">
      <div className="control-group">
        <span className="control-label">
          Mode
          <kbd className="shortcut-badge" aria-hidden="true">
            S
          </kbd>
        </span>
        <div className="segmented wide">
          <SegmentedButton
            value="setup"
            current={mode}
            onSelect={onModeChange}
          >
            Setup
          </SegmentedButton>
          <SegmentedButton
            value="simulation"
            current={mode}
            onSelect={onModeChange}
          >
            Simulation
          </SegmentedButton>
        </div>
      </div>

      <div className="control-group">
        <span className="control-label">
          {mode === "setup" ? "Stone" : "First move"}
          <kbd className="shortcut-badge" aria-hidden="true">
            X
          </kbd>
        </span>
        <div className="segmented wide color-picker">
          <SegmentedButton
            value="black"
            current={mode === "setup" ? selectedColor : firstColor}
            onSelect={
              mode === "setup"
                ? onSelectedColorChange
                : onFirstColorChange
            }
            disabled={mode === "simulation" && isSimulationStarted}
          >
            <span className="stone-swatch black" aria-hidden="true" />
            Black
          </SegmentedButton>
          <SegmentedButton
            value="white"
            current={mode === "setup" ? selectedColor : firstColor}
            onSelect={
              mode === "setup"
                ? onSelectedColorChange
                : onFirstColorChange
            }
            disabled={mode === "simulation" && isSimulationStarted}
          >
            <span className="stone-swatch white" aria-hidden="true" />
            White
          </SegmentedButton>
        </div>
      </div>

      <div className="control-group">
        <span className="control-label">
          Tool
          <kbd className="shortcut-badge" aria-hidden="true">
            T
          </kbd>
        </span>
        <div className="segmented tool-picker">
          <SegmentedButton
            value="stone"
            current={tool}
            onSelect={onToolChange}
            ariaLabel="Place stones"
          >
            <CircleDot size={18} strokeWidth={1.8} />
          </SegmentedButton>
          <SegmentedButton
            value="triangle"
            current={tool}
            onSelect={onToolChange}
            ariaLabel="Triangle label"
          >
            <Triangle size={18} strokeWidth={1.8} />
          </SegmentedButton>
          <SegmentedButton
            value="circle"
            current={tool}
            onSelect={onToolChange}
            ariaLabel="Circle label"
          >
            <Circle size={18} strokeWidth={1.8} />
          </SegmentedButton>
        </div>
      </div>

      <div className="control-group">
        <span className="control-label">
          Board
          <kbd className="shortcut-badge" aria-hidden="true">
            B
          </kbd>
        </span>
        <div className="segmented wide">
          {BOARD_SIZES.map((boardSize) => (
            <SegmentedButton
              key={boardSize}
              value={boardSize}
              current={size}
              onSelect={onSizeChange}
            >
              {boardSize} x {boardSize}
            </SegmentedButton>
          ))}
        </div>
      </div>
    </aside>
  );
}
