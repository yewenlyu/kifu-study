import { expect, test } from "./support/fixtures";

test.use({ viewport: { width: 390, height: 844 } });

test("keeps every control in two columns without page overflow", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator(".control-group")).toHaveCount(4);
  const columns = await page.locator(".control-panel").evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean),
  );
  expect(columns).toHaveLength(2);

  const pageWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client);

  const controlBadges = page.locator(".control-label .shortcut-badge");
  await expect(controlBadges).toHaveText(["S", "X", "T", "B"]);
  for (const badge of await controlBadges.all()) {
    await expect(badge).toBeVisible();
  }
  const toolbarBadges = page.locator(".shortcut-action .shortcut-badge");
  await expect(toolbarBadges).toHaveText(["U", "R", "C"]);
  for (const badge of await toolbarBadges.all()) {
    await expect(badge).toBeHidden();
  }

  const help = page.getByRole("button", { name: "Keyboard shortcuts" });
  await expect(help).toBeInViewport();
  expect(
    await page
      .locator(".shortcut-help")
      .evaluate((element) => getComputedStyle(element).position),
  ).toBe("fixed");
  await help.click();
  const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await expect(dialog).toBeInViewport();
  await expect(dialog.getByRole("term")).toHaveCount(9);
});
