import { boardPoint } from "./support/board";
import { expect, test } from "./support/fixtures";

test("reveals toolbar shortcut cues on hover and keyboard focus", async ({
  page,
}) => {
  await page.goto("/");

  for (const [name, key] of [
    ["Undo", "U"],
    ["Redo", "R"],
    ["Show coordinates", "N"],
    ["Clear board", "C"],
  ] as const) {
    const button = page.getByRole("button", { name });
    const badge = button.locator(".shortcut-badge");

    await expect(badge).toHaveText(key);
    await expect(badge).toBeHidden();
    await button.hover();
    await expect(badge).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(badge).toBeHidden();
  }

  const point = await boardPoint(page, 3, 3);
  await page.mouse.click(point.x, point.y);
  const undo = page.getByRole("button", { name: "Undo" });
  await expect(undo).toBeEnabled();
  await undo.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(undo).toBeFocused();
  await expect(undo.locator(".shortcut-badge")).toBeVisible();
});
