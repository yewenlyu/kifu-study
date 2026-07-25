import { expect, test as base } from "@playwright/test";

interface ReliabilityFixtures {
  browserErrors: string[];
}

export const test = base.extend<ReliabilityFixtures>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") {
          errors.push(message.text());
        }
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await use(errors);

      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
