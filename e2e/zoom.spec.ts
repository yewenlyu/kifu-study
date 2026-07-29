import { expect, test } from "./support/fixtures";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
];

for (const viewport of viewports) {
  test.describe(viewport.name, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
    });

    test("keeps the application fixed while the enlarged board scrolls", async ({
      page,
    }) => {
      await page.goto("/");

      const measureLayout = () =>
        page.evaluate(() => {
          const height = (selector: string) =>
            Math.round(
              document.querySelector(selector)!.getBoundingClientRect()
                .height,
            );
          const stage = document.querySelector(".board-stage")!;

          return {
            appHeight: height(".app"),
            frameHeight: height(".board-frame"),
            stageHeight: height(".board-stage"),
            pageWidth: document.documentElement.scrollWidth,
            stageClientHeight: stage.clientHeight,
            stageClientWidth: stage.clientWidth,
            stageScrollHeight: stage.scrollHeight,
            stageScrollWidth: stage.scrollWidth,
          };
        });

      const beforeZoom = await measureLayout();

      await page.getByRole("button", { name: "Zoom in" }).click();
      await page.getByRole("button", { name: "Zoom in" }).click();

      const afterZoom = await measureLayout();

      expect(afterZoom.appHeight).toBe(beforeZoom.appHeight);
      expect(afterZoom.frameHeight).toBe(beforeZoom.frameHeight);
      expect(afterZoom.stageHeight).toBe(beforeZoom.stageHeight);
      expect(afterZoom.pageWidth).toBe(beforeZoom.pageWidth);
      expect(afterZoom.stageScrollWidth).toBeGreaterThan(
        afterZoom.stageClientWidth,
      );
      expect(afterZoom.stageScrollHeight).toBeGreaterThan(
        afterZoom.stageClientHeight,
      );
    });
  });
}
