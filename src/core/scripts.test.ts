import { vol } from "memfs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addBiomeScripts } from "./scripts";

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

// Mock logger
vi.mock("../utils/logger");

const execSyncMock = vi.fn();
vi.mock("node:child_process", () => ({
	execSync: execSyncMock,
}));

describe("scripts", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		execSyncMock.mockReset();
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

			await addBiomeScripts("/project");

			expect(execSyncMock).toHaveBeenCalledTimes(4);
			expect(execSyncMock).toHaveBeenCalledWith(
				'npm pkg set scripts.format="biome format --write"',
				{
					cwd: "/project",
					stdio: "pipe",
				},
			);
			expect(execSyncMock).toHaveBeenCalledWith(
				'npm pkg set scripts.lint="biome lint"',
				{
					cwd: "/project",
					stdio: "pipe",
				},
			);
			expect(execSyncMock).toHaveBeenCalledWith(
				'npm pkg set scripts.lint-fix="biome lint --write"',
				{
					cwd: "/project",
					stdio: "pipe",
				},
			);
			expect(execSyncMock).toHaveBeenCalledWith(
				'npm pkg set scripts.check="biome check --write"',
				{
					cwd: "/project",
					stdio: "pipe",
				},
			);
		});

		it("should handle execSync errors gracefully", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					scripts: {},
				}),
			});

			execSyncMock.mockImplementation(() => {
				throw new Error("Command failed");
			});

			// Should not throw
			await expect(addBiomeScripts("/project")).resolves.not.toThrow();
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

			await addBiomeScripts("/project");

			expect(execSyncMock).toHaveBeenCalledTimes(4);
		});

		it("should work when package.json does not exist", async () => {
			vol.fromJSON({
				"/project/.gitignore": "node_modules",
			});

			// Should not throw even if package.json doesn't exist
			await expect(addBiomeScripts("/project")).resolves.not.toThrow();

			// Should still attempt to run commands
			expect(execSyncMock).toHaveBeenCalledTimes(4);
		});
	});
});
