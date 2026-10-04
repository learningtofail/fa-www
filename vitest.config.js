import { defineConfig } from "vitest/config";

// Unit tests only. E2E journeys live in tests/e2e and run under Playwright.
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.{js,jsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/unit/setup.js"],
    coverage: {
      provider: "v8",
      // Phase 4 exit criterion: pure logic in src/lib stays at or above 90 percent.
      include: ["src/lib/**/*.js"],
      reporter: ["text-summary", "text"],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
