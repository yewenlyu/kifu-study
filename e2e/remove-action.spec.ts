import { boardPoint } from "./support/board";
import { expect, test } from "./support/fixtures";

test("right-click clears a setup point and remains undoable", async ({
  page,
}) => {
  await page.goto("/");
  const point = await boardPoint(page, 3, 3);

  await page.mouse.click(point.x, point.y);
  await page.getByRole("button", { name: "Triangle label" }).click();
  await page.mouse.click(point.x, point.y);
  await page.mouse.click(point.x, point.y, { button: "right" });

  await expect(page.locator('[data-point="3,3"][data-stone]')).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(
    page.locator('.stones > [data-point="3,3"] polygon'),
  ).toHaveCount(1);
});

test("right-click clears only a simulation label", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Simulation" }).click();
  const point = await boardPoint(page, 4, 4);

  await page.mouse.click(point.x, point.y);
  await page.getByRole("button", { name: "Circle label" }).click();
  await page.mouse.click(point.x, point.y);
  await page.mouse.click(point.x, point.y, { button: "right" });

  const stone = page.locator('.stones > [data-point="4,4"]');
  await expect(stone).toHaveAttribute("data-stone", "black");
  await expect(stone).toHaveAttribute("data-move-number", "1");
  await expect(stone.locator("circle")).toHaveCount(1);
});
