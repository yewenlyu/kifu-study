import { expect, test } from "./support/fixtures";

test("middle-button drag pans only an oversized board with a grabbing cursor", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page.getByRole("button", { name: "Zoom in" }).click();

  const stage = page.locator(".board-stage");
  await expect
    .poll(() =>
      stage.evaluate(
        (element) => element.scrollWidth > element.clientWidth + 1,
      ),
    )
    .toBe(true);

  const box = await stage.boundingBox();
  if (!box) {
    throw new Error("The board stage has no rendered bounds");
  }
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error("The browser page has no viewport");
  }

  const initialScrollLeft = await stage.evaluate(
    (element) => element.scrollLeft,
  );
  const startX = box.x + box.width * 0.7;
  const startY = Math.min(box.y + 100, viewport.height - 40);
  await page.mouse.move(startX, startY);
  await page.mouse.down({ button: "middle" });
  await expect(stage).toHaveClass(/is-panning/);
  await expect
    .poll(() => stage.evaluate((element) => getComputedStyle(element).cursor))
    .toBe("grabbing");

  await page.mouse.move(box.x + box.width * 0.3, startY - 40, {
    steps: 4,
  });
  await expect
    .poll(() => stage.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(initialScrollLeft);

  await page.mouse.up({ button: "middle" });
  await expect(stage).not.toHaveClass(/is-panning/);
});
