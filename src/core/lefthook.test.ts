import path from "node:path";
import { vol } from "memfs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as fileUtils from "../utils/file";
import * as npmCommand from "../utils/npm-command";
import * as promptUtils from "../utils/prompt";
import { addLefthookScript, createLefthookConfig } from "./lefthook";

// Mock setup
vi.mock("node:fs");
vi.mock("node:fs/promises");
vi.mock("../utils/logger");
vi.mock("../utils/prompt");

// Mock npm-command module
vi.mock("../utils/npm-command", () => ({
	runNpmPkgSet: vi.fn(),
	createSpinner: vi.fn(() => ({
		start: vi.fn().mockReturnThis(),
		succeed: vi.fn().mockReturnThis(),
		fail: vi.fn().mockReturnThis(),
	})),
}));

describe("lefthook", () => {
	const runNpmPkgSetMock = vi.mocked(npmCommand.runNpmPkgSet);

	beforeEach(() => {
		// Mock getTemplatePath to return mock paths
		vi.spyOn(fileUtils, "getTemplatePath").mockImplementation(
			(templateName) => {
				return path.join("/templates", templateName);
			},
		);
		vi.clearAllMocks();
	});

	afterEach(() => {
		vol.reset();
		vi.restoreAllMocks();
	});

	describe("createLefthookConfig", () => {
		it("should create new lefthook.yml for npm", async () => {
			vol.fromJSON({
				"/project": null,
				"/templates/lefthook/npm.yml": `pre-commit:
  commands:
    check:
      glob: "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}"
      run: npx @biomejs/biome check --write --no-errors-on-unmatched --files-ignore-unknown=true --colors=off {staged_files}
      stage_fixed: true`,
			});

			const result = await createLefthookConfig("/project", "npm");
			expect(result).toEqual({ type: "created" });
			expect(fileUtils.fileExists("/project/lefthook.yml")).toBe(true);
		});

		it("should create new lefthook.yml for pnpm", async () => {
			vol.fromJSON({
				"/project": null,
				"/templates/lefthook/pnpm.yml": `pre-commit:
  commands:
    check:
      glob: "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}"
      run: pnpm exec biome check --write --no-errors-on-unmatched --files-ignore-unknown=true --colors=off {staged_files}
      stage_fixed: true`,
			});

			const result = await createLefthookConfig("/project", "pnpm");
			expect(result).toEqual({ type: "created" });
			expect(fileUtils.fileExists("/project/lefthook.yml")).toBe(true);
		});

		it("should create new lefthook.yml for yarn", async () => {
			vol.fromJSON({
				"/project": null,
				"/templates/lefthook/yarn.yml": `pre-commit:
  commands:
    check:
      glob: "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}"
      run: yarn exec biome check --write --no-errors-on-unmatched --files-ignore-unknown=true --colors=off {staged_files}
      stage_fixed: true`,
			});

			const result = await createLefthookConfig("/project", "yarn");
			expect(result).toEqual({ type: "created" });
			expect(fileUtils.fileExists("/project/lefthook.yml")).toBe(true);
		});

		it("should create new lefthook.yml for bun", async () => {
			vol.fromJSON({
				"/project": null,
				"/templates/lefthook/bun.yml": `pre-commit:
  commands:
    check:
      glob: "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}"
      run: bunx @biomejs/biome check --write --no-errors-on-unmatched --files-ignore-unknown=true --colors=off {staged_files}
      stage_fixed: true`,
			});

			const result = await createLefthookConfig("/project", "bun");
			expect(result).toEqual({ type: "created" });
			expect(fileUtils.fileExists("/project/lefthook.yml")).toBe(true);
		});

		it("should skip when lefthook.yml already exists and user declines overwrite", async () => {
			vol.fromJSON({
				"/project/lefthook.yml": "existing content",
				"/templates/lefthook/npm.yml": "new content",
			});

			vi.spyOn(promptUtils, "promptOverwriteLefthook").mockResolvedValue(false);

			const result = await createLefthookConfig("/project", "npm");
			expect(result).toEqual({ type: "skipped" });
			expect(promptUtils.promptOverwriteLefthook).toHaveBeenCalled();
			// Verify file content unchanged
			const content = vol.readFileSync("/project/lefthook.yml", "utf8");
			expect(content).toBe("existing content");
		});

		it("should overwrite when lefthook.yml already exists and user confirms overwrite", async () => {
			vol.fromJSON({
				"/project/lefthook.yml": "existing content",
				"/templates/lefthook/npm.yml": "new content",
			});

			vi.spyOn(promptUtils, "promptOverwriteLefthook").mockResolvedValue(true);

			const result = await createLefthookConfig("/project", "npm");
			expect(result).toEqual({ type: "overwritten" });
			expect(promptUtils.promptOverwriteLefthook).toHaveBeenCalled();
			// Verify file content changed
			const content = vol.readFileSync("/project/lefthook.yml", "utf8");
			expect(content).toBe("new content");
		});

		it("should overwrite with force option without prompting", async () => {
			vol.fromJSON({
				"/project/lefthook.yml": "existing content",
				"/templates/lefthook/npm.yml": "new content",
			});

			const promptSpy = vi.spyOn(promptUtils, "promptOverwriteLefthook");

			const result = await createLefthookConfig("/project", "npm", true);
			expect(result).toEqual({ type: "overwritten" });
			expect(promptSpy).not.toHaveBeenCalled();
			// Verify file content changed
			const content = vol.readFileSync("/project/lefthook.yml", "utf8");
			expect(content).toBe("new content");
		});

		it("should handle missing template file", async () => {
			vol.fromJSON({
				"/project": null,
				// No template file
			});

			const result = await createLefthookConfig("/project", "npm");
			expect(result).toEqual({ type: "error", message: "Template not found" });
			expect(fileUtils.fileExists("/project/lefthook.yml")).toBe(false);
		});

		it("should handle file copy error", async () => {
			vol.fromJSON({
				"/project": null,
				"/templates/lefthook/npm.yml": "content",
			});

			// Mock copyFile to throw an error
			vi.spyOn(fileUtils, "copyFile").mockImplementation(() => {
				throw new Error("Permission denied");
			});

			const result = await createLefthookConfig("/project", "npm");
			expect(result.type).toBe("error");
			expect(result).toMatchObject({
				type: "error",
				message: "Permission denied",
			});
		});

		it("should handle nested directory structure", async () => {
			vol.fromJSON({
				"/workspace/projects/myapp": null,
				"/templates/lefthook/pnpm.yml": "content",
			});

			const result = await createLefthookConfig(
				"/workspace/projects/myapp",
				"pnpm",
			);
			expect(result).toEqual({ type: "created" });
			expect(
				fileUtils.fileExists("/workspace/projects/myapp/lefthook.yml"),
			).toBe(true);
		});
	});

	describe("addLefthookScript", () => {
		it("should add prepare script successfully", async () => {
			runNpmPkgSetMock.mockResolvedValue(undefined);

			const result = await addLefthookScript("/project");
			expect(result).toBe("success");
			expect(runNpmPkgSetMock).toHaveBeenCalledWith(
				"/project",
				"scripts.prepare=lefthook install",
			);
		});

		it("should handle npm command error", async () => {
			runNpmPkgSetMock.mockRejectedValue(new Error("Command failed"));

			const result = await addLefthookScript("/project");
			expect(result).toBe("error");
		});

		it("should work with nested directory structure", async () => {
			runNpmPkgSetMock.mockResolvedValue(undefined);

			const result = await addLefthookScript("/workspace/projects/myapp");
			expect(result).toBe("success");
			expect(runNpmPkgSetMock).toHaveBeenCalledWith(
				"/workspace/projects/myapp",
				"scripts.prepare=lefthook install",
			);
		});
	});
});
