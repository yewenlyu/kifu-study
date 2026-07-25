import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

const capturedPointers = new WeakMap<Element, Set<number>>();

Element.prototype.setPointerCapture = function (pointerId: number) {
  const pointers = capturedPointers.get(this) ?? new Set<number>();
  pointers.add(pointerId);
  capturedPointers.set(this, pointers);
};

Element.prototype.hasPointerCapture = function (pointerId: number) {
  return capturedPointers.get(this)?.has(pointerId) ?? false;
};

Element.prototype.releasePointerCapture = function (pointerId: number) {
  capturedPointers.get(this)?.delete(pointerId);
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
