import { vol } from "memfs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as npmCommand from "../utils/npm-command";
import { addBiomeScripts } from "./scripts";

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

// Mock logger
vi.mock("../utils/logger");

// Mock npm-command module
vi.mock("../utils/npm-command", () => ({
	runNpmPkgSet: vi.fn(),
	createSpinner: vi.fn(() => ({
		start: vi.fn().mockReturnThis(),
		succeed: vi.fn().mockReturnThis(),
		fail: vi.fn().mockReturnThis(),
	})),
}));

describe("scripts", () => {
	const runNpmPkgSetMock = vi.mocked(npmCommand.runNpmPkgSet);

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.clearAllMocks();
	});

	afterEach(() => {
		vol.reset();
		vi.restoreAllMocks();
	});

	describe("addBiomeScripts", () => {
		it("should add all Biome scripts when successful", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					scripts: {},
				}),
			});

			runNpmPkgSetMock.mockResolvedValue(undefined);

			await addBiomeScripts("/project");

			expect(runNpmPkgSetMock).toHaveBeenCalledTimes(4);
			expect(runNpmPkgSetMock).toHaveBeenCalledWith(
				"/project",
				"scripts.format=biome format --write",
			);
			expect(runNpmPkgSetMock).toHaveBeenCalledWith(
				"/project",
				"scripts.lint=biome lint",
			);
			expect(runNpmPkgSetMock).toHaveBeenCalledWith(
				"/project",
				"scripts.lint-fix=biome lint --write",
			);
			expect(runNpmPkgSetMock).toHaveBeenCalledWith(
				"/project",
				"scripts.check=biome check --write",
			);
		});

		it("should handle errors gracefully", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					scripts: {},
				}),
			});

			runNpmPkgSetMock.mockRejectedValue(new Error("Command failed"));

			// Should return "error" instead of throwing
			const result = await addBiomeScripts("/project");
			expect(result).toBe("error");
		});

		it("should work with existing scripts", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					scripts: {
						test: "vitest",
						build: "tsc",
					},
				}),
			});

			runNpmPkgSetMock.mockResolvedValue(undefined);

			await addBiomeScripts("/project");

			expect(runNpmPkgSetMock).toHaveBeenCalledTimes(4);
		});

		it("should work when package.json does not exist", async () => {
			vol.fromJSON({
				"/project/.gitignore": "node_modules",
			});

			runNpmPkgSetMock.mockResolvedValue(undefined);

			// Should not throw even if package.json doesn't exist
			await expect(addBiomeScripts("/project")).resolves.not.toThrow();

			// Should still attempt to run commands
			expect(runNpmPkgSetMock).toHaveBeenCalledTimes(4);
		});
	});
});
