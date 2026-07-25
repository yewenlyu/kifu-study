export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

export function commitHistory<T>(
  history: History<T>,
  present: T,
): History<T> {
  return {
    past: [...history.past, history.present],
    present,
    future: [],
  };
}

export function undoHistory<T>(history: History<T>): History<T> {
  if (history.past.length === 0) {
    return history;
  }

  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory<T>(history: History<T>): History<T> {
  if (history.future.length === 0) {
    return history;
  }

  const [next, ...remaining] = history.future;
  return {
    past: [...history.past, history.present],
    present: next,
    future: remaining,
  };
}

export function mapHistory<T>(
  history: History<T>,
  transform: (value: T) => T,
): History<T> {
  return {
    past: history.past.map(transform),
    present: transform(history.present),
    future: history.future.map(transform),
  };
}
