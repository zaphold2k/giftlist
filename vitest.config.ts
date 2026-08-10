import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globalSetup: "./tests/helpers/db.ts",
    // Tests share a single SQLite file for the whole run (see
    // tests/helpers/db.ts); running test files in parallel would multiply
    // write contention beyond what withRetry() is meant to absorb.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: ["lib/**", "app/**/actions.ts"],
      exclude: ["app/generated/**"],
    },
  },
});
