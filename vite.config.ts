import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "src/domain/**/*.test.ts",
            "src/application/**/*.test.ts",
          ],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "architecture",
          include: ["src/test/architecture.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          include: ["src/test/app/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: [
        "src/app/**/*.{ts,tsx}",
        "src/application/**/*.{ts,tsx}",
        "src/domain/**/*.{ts,tsx}",
        "src/ui/**/*.{ts,tsx}",
      ],
      exclude: ["src/**/*.test.{ts,tsx}"],
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        perFile: true,
        statements: 90,
      },
    },
  },
});
