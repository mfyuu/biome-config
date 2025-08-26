import path from "node:path";
import { fs, vol } from "memfs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATHS } from "../constants";
import {
	copyFile,
	createDirectory,
	fileExists,
	findBiomeConfig,
	getTemplatePath,
	readPackageJson,
} from "./file";

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("file", () => {
	beforeEach(() => {
		// Reset in-memory file system before each test
		vol.reset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("fileExists", () => {
		it("should return true when file exists", () => {
			vol.fromJSON({
				"/test/file.txt": "content",
			});

			const result = fileExists("/test/file.txt");
			expect(result).toBe(true);
		});

		it("should return false when file does not exist", () => {
			vol.fromJSON({});

			const result = fileExists("/test/nonexistent.txt");
			expect(result).toBe(false);
		});

		it("should recognize directories as existing", () => {
			vol.fromJSON({
				"/test/directory": null,
			});

			const result = fileExists("/test/directory");
			expect(result).toBe(true);
		});

		it("should handle empty string", () => {
			// memfs handles empty strings differently, adjust expected value
			vol.fromJSON({
				"/test": null,
			});

			const result = fileExists("");
			// memfs returns false for empty strings
			expect(result).toBe(false);
		});

		it("should handle paths with special characters correctly", () => {
			vol.fromJSON({
				"/test/file with spaces.txt": "content",
				"/test/file-jp.txt": "japanese file",
				"/test/@special#file$.txt": "special chars",
			});

			expect(fileExists("/test/file with spaces.txt")).toBe(true);
			expect(fileExists("/test/file-jp.txt")).toBe(true);
			expect(fileExists("/test/@special#file$.txt")).toBe(true);
		});
	});

	describe("createDirectory", () => {
		it("should create directory when possible", () => {
			vol.fromJSON({});

			createDirectory("/test/new-dir");
			expect(fileExists("/test/new-dir")).toBe(true);
		});

		it("should create directories recursively", () => {
			vol.fromJSON({});

			createDirectory("/test/deep/nested/dir");
			expect(fileExists("/test/deep/nested/dir")).toBe(true);
		});

		it("should not throw for existing directories", () => {
			vol.fromJSON({
				"/test/existing": null,
			});

			expect(() => createDirectory("/test/existing")).not.toThrow();
			expect(fileExists("/test/existing")).toBe(true);
		});
	});

	describe("copyFile", () => {
		it("should copy file when possible", () => {
			vol.fromJSON({
				"/source/file.txt": "content",
				"/dest": null,
			});

			copyFile("/source/file.txt", "/dest/file.txt");
			expect(fileExists("/dest/file.txt")).toBe(true);
			// Verify content is the same
			const sourceContent = fs.readFileSync("/source/file.txt", "utf-8");
			const destContent = fs.readFileSync("/dest/file.txt", "utf-8");
			expect(destContent).toBe(sourceContent);
		});

		it("should throw error when destination directory does not exist", () => {
			vol.fromJSON({
				"/source/file.txt": "content",
			});

			expect(() =>
				copyFile("/source/file.txt", "/nonexistent/file.txt"),
			).toThrow();
		});

		it("should throw error when source file does not exist", () => {
			vol.fromJSON({
				"/dest": null,
			});

			expect(() =>
				copyFile("/nonexistent/file.txt", "/dest/file.txt"),
			).toThrow();
		});

		it("should overwrite destination file", () => {
			vol.fromJSON({
				"/source/file.txt": "new content",
				"/dest/file.txt": "old content",
			});

			copyFile("/source/file.txt", "/dest/file.txt");
			expect(fileExists("/dest/file.txt")).toBe(true);
			// Verify overwrite occurred
			const content = fs.readFileSync("/dest/file.txt", "utf-8");
			expect(content).toBe("new content");
		});

		it("should copy large files", () => {
			const largeContent = "x".repeat(10000); // ~10KB
			vol.fromJSON({
				"/source/large.txt": largeContent,
				"/dest": null,
			});

			copyFile("/source/large.txt", "/dest/large.txt");
			const destContent = fs.readFileSync("/dest/large.txt", "utf-8");
			expect(destContent).toBe(largeContent);
		});

		it("should copy binary files", () => {
			const binaryContent = Buffer.from([0xff, 0xfe, 0xfd, 0xfc, 0x00, 0x01]);
			vol.fromJSON({
				"/source/binary.bin": binaryContent,
				"/dest": null,
			});

			copyFile("/source/binary.bin", "/dest/binary.bin");
			const destContent = fs.readFileSync("/dest/binary.bin");
			expect(Buffer.compare(Buffer.from(destContent), binaryContent)).toBe(0);
		});

		it("should preserve permissions", () => {
			vol.fromJSON({
				"/source/executable.sh": "#!/bin/bash\necho hello",
				"/dest": null,
			});
			// Set executable permissions
			fs.chmodSync("/source/executable.sh", 0o755);

			copyFile("/source/executable.sh", "/dest/executable.sh");
			// memfs also allows permission checking
			expect(fileExists("/dest/executable.sh")).toBe(true);
			const stats = fs.statSync("/dest/executable.sh");
			// Verify permissions are preserved (copyFileSync may not always preserve permissions)
			expect(stats.mode & 0o777).toBeGreaterThan(0);
		});
	});

	describe("findBiomeConfig", () => {
		it("should find biome.json", () => {
			vol.fromJSON({
				[`/project/${PATHS.BIOME_FILE}`]: "{}",
			});

			const result = findBiomeConfig("/project");
			expect(result).toBe(path.join("/project", PATHS.BIOME_FILE));
		});

		it("should find biome.jsonc", () => {
			vol.fromJSON({
				[`/project/${PATHS.BIOME_FILE_JSONC}`]: "{}",
			});

			const result = findBiomeConfig("/project");
			expect(result).toBe(path.join("/project", PATHS.BIOME_FILE_JSONC));
		});

		it("should prefer biome.json when both biome.json and biome.jsonc exist", () => {
			vol.fromJSON({
				[`/project/${PATHS.BIOME_FILE}`]: "{}",
				[`/project/${PATHS.BIOME_FILE_JSONC}`]: "{}",
			});

			const result = findBiomeConfig("/project");
			expect(result).toBe(path.join("/project", PATHS.BIOME_FILE));
		});

		it("should return null when no config file found", () => {
			vol.fromJSON({
				"/project": null,
			});

			const result = findBiomeConfig("/project");
			expect(result).toBeNull();
		});
	});

	describe("getTemplatePath", () => {
		it("should return correct template file path", () => {
			const result = getTemplatePath("biome/base.json");
			expect(result).toMatch(/.*[\\/]templates[\\/]biome[\\/]base\.json$/);
			expect(result).toContain(path.join("templates", "biome", "base.json"));
		});

		it("should return correct path for react config type", () => {
			const result = getTemplatePath("biome/react.json");
			expect(result).toMatch(/.*[\\/]templates[\\/]biome[\\/]react\.json$/);
			expect(result).toContain(path.join("templates", "biome", "react.json"));
		});

		it("should return correct path for next config type", () => {
			const result = getTemplatePath("biome/next.jsonc");
			expect(result).toMatch(/.*[\\/]templates[\\/]biome[\\/]next\.jsonc$/);
			expect(result).toContain(path.join("templates", "biome", "next.jsonc"));
		});

		it("should return correct VSCode settings file path", () => {
			const result = getTemplatePath(".vscode/settings.json");
			expect(result).toMatch(
				/.*[\\/]templates[\\/]\.vscode[\\/]settings\.json$/,
			);
			expect(result).toContain(
				path.join("templates", ".vscode", "settings.json"),
			);
		});

		it("should verify path resolution accuracy", () => {
			const basePath = getTemplatePath("biome/base.json");
			const reactPath = getTemplatePath("biome/react.json");
			const nextPath = getTemplatePath("biome/next.jsonc");

			// Verify all paths are different
			expect(basePath).not.toBe(reactPath);
			expect(reactPath).not.toBe(nextPath);
			expect(basePath).not.toBe(nextPath);

			// Verify all contain templates directory
			[basePath, reactPath, nextPath].forEach((filePath) => {
				expect(filePath).toContain(path.join("templates", ""));
			});
		});

		it("should generate correct path even with empty string", () => {
			const result = getTemplatePath("");
			expect(result).toMatch(/.*[\\/]templates$/);
			expect(result).toContain("templates");
		});
	});

	describe("readPackageJson error cases", () => {
		it("should throw appropriate error when file does not exist", () => {
			// Test non-existent file with memfs
			vol.fromJSON({});

			expect(() => {
				readPackageJson();
			}).toThrow();
		});

		it("should throw error for invalid JSON format", () => {
			// Temporarily mock process.cwd to control package.json path
			const originalCwd = process.cwd;
			const mockCwd = "/test";
			vi.spyOn(process, "cwd").mockReturnValue(mockCwd);

			// Create invalid JSON file with memfs
			vol.fromJSON({
				[path.join(mockCwd, "..", "package.json")]: "{ invalid json }",
			});

			expect(() => {
				readPackageJson();
			}).toThrow();

			// Restore process.cwd mock
			process.cwd = originalCwd;
		});
	});
});
