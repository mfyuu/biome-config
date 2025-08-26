import os from "node:os";
import { vol } from "memfs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATHS } from "../constants";
import { findGitRoot } from "./git";

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("git", () => {
	const mockHomeDir = "/home/user";

	beforeEach(() => {
		// Reset in-memory file system
		vol.reset();
		// Mock os.homedir
		vi.spyOn(os, "homedir").mockReturnValue(mockHomeDir);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("findGitRoot", () => {
		it("should find .git in current directory", () => {
			vol.fromJSON({
				[`/project/${PATHS.GIT_DIR}`]: null,
				"/project/src": null,
			});

			const result = findGitRoot("/project");
			expect(result).toBe("/project");
		});

		it("should find .git in parent directory", () => {
			vol.fromJSON({
				[`/project/${PATHS.GIT_DIR}`]: null,
				"/project/src/utils": null,
			});

			const result = findGitRoot("/project/src/utils");
			expect(result).toBe("/project");
		});

		it("should find .git multiple levels up", () => {
			vol.fromJSON({
				[`/workspace/${PATHS.GIT_DIR}`]: null,
				"/workspace/projects/myapp/src/components/file.ts": "content",
			});

			const result = findGitRoot("/workspace/projects/myapp/src/components");
			expect(result).toBe("/workspace");
		});

		it("should return null when .git not found", () => {
			vol.fromJSON({
				"/project/src/utils": null,
				[mockHomeDir]: null,
			});

			const result = findGitRoot("/project/src/utils");
			expect(result).toBeNull();
		});

		it("should return null when reaching home directory", () => {
			vol.fromJSON({
				[`${mockHomeDir}/projects/myapp`]: null,
			});

			const result = findGitRoot(`${mockHomeDir}/projects/myapp`);
			expect(result).toBeNull();
		});

		it("should find .git in home directory itself", () => {
			vol.fromJSON({
				[`${mockHomeDir}/${PATHS.GIT_DIR}`]: null,
				[`${mockHomeDir}/projects`]: null,
			});

			const result = findGitRoot(`${mockHomeDir}/projects`);
			expect(result).toBe(mockHomeDir);
		});

		it("should return null when reaching root directory", () => {
			// Simulate state where home directory is not set
			vi.spyOn(os, "homedir").mockReturnValue("/nonexistent");

			vol.fromJSON({
				"/project/src": null,
			});

			const result = findGitRoot("/project/src");
			expect(result).toBeNull();
		});

		it("should detect .git even when it's a file", () => {
			vol.fromJSON({
				[`/project/${PATHS.GIT_DIR}`]: "gitfile: /path/to/git/dir",
				"/project/src": null,
			});

			const result = findGitRoot("/project/src");
			expect(result).toBe("/project");
		});

		it("should return closest .git when nested .git directories exist", () => {
			vol.fromJSON({
				[`/workspace/${PATHS.GIT_DIR}`]: null,
				[`/workspace/project/${PATHS.GIT_DIR}`]: null,
				"/workspace/project/src": null,
			});

			const result = findGitRoot("/workspace/project/src");
			expect(result).toBe("/workspace/project");
		});

		it("should not loop in same directory", () => {
			// Test case where parent directory cannot be obtained due to parse errors, etc.
			const startDir = "/";
			vol.fromJSON({
				"/test": null,
			});

			const result = findGitRoot(startDir);
			expect(result).toBeNull();
		});

		it("should skip and continue even when git directory is being deleted (ENOENT)", () => {
			// Case where .git directory does not exist
			vol.fromJSON({
				[`/workspace/${PATHS.GIT_DIR}`]: null,
				"/workspace/project/src": null,
			});

			const result = findGitRoot("/workspace/project/src");
			// Can find .git in parent even with ENOENT error (file not found)
			expect(result).toBe("/workspace");
		});

		it("should handle case with .git in multiple directories", () => {
			vol.fromJSON({
				[`/workspace/${PATHS.GIT_DIR}`]: null,
				[`/workspace/protected/${PATHS.GIT_DIR}`]: null,
				[`/workspace/protected/locked/${PATHS.GIT_DIR}`]: null,
				"/workspace/protected/locked/src/file.ts": "content",
			});

			const result = findGitRoot("/workspace/protected/locked/src");
			// Closest .git directory is found
			expect(result).toBe("/workspace/protected/locked");
		});
	});
});
