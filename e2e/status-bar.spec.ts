import { expect, test } from "./support/fixtures";

test.use({ viewport: { width: 1440, height: 1600 } });

test("fills the desktop work surface and keeps the status bar attached", async ({
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
      board: bounds(".go-board"),
      footer: bounds(".board-footer"),
      frame: bounds(".board-frame"),
      stage: bounds(".board-stage"),
      viewportBottom: window.innerHeight,
    };
  });

  expect(layout.viewportBottom - layout.frame.bottom).toBe(24);
  expect(
    Math.abs(
      layout.board.top -
        layout.stage.top -
        (layout.stage.bottom - layout.board.bottom),
    ),
  ).toBeLessThanOrEqual(1);
  expect(layout.footer.height).toBe(36);
  expect(Math.abs(layout.footer.top - layout.stage.bottom)).toBeLessThanOrEqual(
    1,
  );
  expect(
    Math.abs(layout.frame.bottom - layout.footer.bottom),
  ).toBeLessThanOrEqual(1);
});
