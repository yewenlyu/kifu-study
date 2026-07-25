import { useEffect, useRef, useState } from "react";
import { CircleHelp, X } from "lucide-react";

const SHORTCUTS = [
  { action: "Toggle mode", keys: "S" },
  { action: "Toggle stone", keys: "X" },
  { action: "Cycle tool", keys: "T" },
  { action: "Cycle board", keys: "B" },
  { action: "Toggle coordinates", keys: "N" },
  { action: "Clear board", keys: "C" },
  { action: "Clear point / label", keys: "Right-click" },
  { action: "Undo", keys: "U" },
  { action: "Redo", keys: "R" },
  { action: "Pan board", keys: "Middle-drag" },
] as const;

export function ShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      trigger.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="shortcut-help" ref={container}>
      {isOpen && (
        <section
          className="shortcut-help-popover"
          id="shortcut-help-popover"
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <div className="shortcut-help-header">
            <h2>Shortcuts</h2>
            <button
              type="button"
              className="shortcut-help-close"
              aria-label="Close shortcuts"
              title="Close"
              onClick={() => {
                setIsOpen(false);
                trigger.current?.focus();
              }}
            >
              <X size={16} />
            </button>
          </div>
          <dl className="shortcut-help-list">
            {SHORTCUTS.map(({ action, keys }) => (
              <div className="shortcut-help-row" key={action}>
                <dt>{action}</dt>
                <dd>
                  <kbd>{keys}</kbd>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <button
        type="button"
        className="shortcut-help-trigger"
        ref={trigger}
        aria-label="Keyboard shortcuts"
        aria-controls="shortcut-help-popover"
        aria-expanded={isOpen}
        title="Keyboard shortcuts"
        onClick={() => setIsOpen((current) => !current)}
      >
        <CircleHelp size={18} strokeWidth={1.6} />
      </button>
    </div>
  );
}
