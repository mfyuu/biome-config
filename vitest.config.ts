import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		passWithNoTests: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"coverage/**",
				"dist/**",
				"**/*.d.ts",
				"**/*.config.*",
				"**/*.test.*",
				"templates/**",
				"configs/**",
				"e2e/**",
				"src/cli.ts",
				"__mocks__/**",
				"src/types/**",
			],
		},
	},
});
