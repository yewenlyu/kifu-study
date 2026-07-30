import { expect, test } from "./support/fixtures";

test.use({ viewport: { width: 1440, height: 1600 } });

test("keeps the compact status bar attached to the board viewport", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Zoom in" }).click();

  const layout = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const rect = document.querySelector(selector)!.getBoundingClientRect();
      return {
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
      };
    };

    return {
      footer: bounds(".board-footer"),
      frame: bounds(".board-frame"),
      stage: bounds(".board-stage"),
    };
  });

  expect(layout.footer.height).toBe(36);
  expect(Math.abs(layout.footer.top - layout.stage.bottom)).toBeLessThanOrEqual(
    1,
  );
  expect(
    Math.abs(layout.frame.bottom - layout.footer.bottom),
  ).toBeLessThanOrEqual(1);
});
