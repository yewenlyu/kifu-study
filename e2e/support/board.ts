import type { Page } from "@playwright/test";

const CANVAS_SIZE = 720;
const PADDING = 42;

export async function boardPoint(page: Page, x: number, y: number) {
  const board = page.getByRole("img", { name: /\d+ by \d+ Go board/ });
  const box = await board.boundingBox();
  const size = Number(await board.getAttribute("data-board-size"));

  if (!box) {
    throw new Error("The Go board has no rendered bounds");
  }

  const step = (CANVAS_SIZE - PADDING * 2) / (size - 1);
  return {
    x: box.x + ((PADDING + x * step) / CANVAS_SIZE) * box.width,
    y: box.y + ((PADDING + y * step) / CANVAS_SIZE) * box.height,
  };
}
