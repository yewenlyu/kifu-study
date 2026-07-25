import { boardPoint } from "./support/board";
import { expect, test } from "./support/fixtures";

test("commits a turning setup drag as one SVG history action", async ({
  page,
}) => {
  await page.goto("/");

  const start = await boardPoint(page, 1, 1);
  const corner = await boardPoint(page, 4, 1);
  const end = await boardPoint(page, 4, 3);

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(corner.x, corner.y);
  await page.mouse.move(end.x, end.y);
  await expect(page.locator("[data-preview-point]")).toHaveCount(6);
  await page.mouse.up();

  await expect(page.locator(".stones > [data-stone]")).toHaveCount(6);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".stones > [data-stone]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
});
