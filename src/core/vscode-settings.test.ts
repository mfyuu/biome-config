import path from "node:path";
import { vol } from "memfs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as fileUtils from "../utils/file.js";
import * as promptUtils from "../utils/prompt.js";
import { createVSCodeSettings } from "./vscode-settings.js";

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

// Mock setup
vi.mock("../utils/logger.js");
vi.mock("../utils/prompt.js");

describe("vscode-settings", () => {
	beforeEach(() => {
		// Mock getTemplatePath to return mock paths instead of actual file paths
		vi.spyOn(fileUtils, "getTemplatePath").mockImplementation(
			(templateName) => {
				return path.join("/templates", templateName);
			},
		);
	});

	afterEach(() => {
		vol.reset();
		vi.restoreAllMocks();
	});

	describe("createVSCodeSettings", () => {
		it("should create new .vscode directory", async () => {
			vol.fromJSON({
				"/project": null,
				"/templates/.vscode/settings.json": JSON.stringify({
					"editor.formatOnSave": true,
				}),
			});

			const result = await createVSCodeSettings("/project");
			expect(result).toEqual({ type: "created" });
			expect(fileUtils.fileExists("/project/.vscode")).toBe(true);
			expect(fileUtils.fileExists("/project/.vscode/settings.json")).toBe(true);
		});

		it("should create new settings.json", async () => {
			vol.fromJSON({
				"/project/.vscode": null,
				"/templates/.vscode/settings.json": JSON.stringify({
					"editor.formatOnSave": true,
				}),
			});

			const result = await createVSCodeSettings("/project");
			expect(result).toEqual({ type: "created" });
			expect(fileUtils.fileExists("/project/.vscode/settings.json")).toBe(true);
		});

		it("should confirm when settings.json exists", async () => {
			vol.fromJSON({
				"/project/.vscode/settings.json": JSON.stringify({
					"editor.fontSize": 14,
				}),
				"/templates/.vscode/settings.json": JSON.stringify({
					"editor.formatOnSave": true,
				}),
			});

			vi.mocked(promptUtils.promptOverwriteConfirmation).mockResolvedValue(
				true,
			);

			const result = await createVSCodeSettings("/project");
			expect(result).toEqual({ type: "overwritten" });
			expect(promptUtils.promptOverwriteConfirmation).toHaveBeenCalled();
		});

		it("should skip when overwrite confirmation is rejected", async () => {
			vol.fromJSON({
				"/project/.vscode/settings.json": "{}",
			});

			vi.mocked(promptUtils.promptOverwriteConfirmation).mockResolvedValue(
				false,
			);

			const result = await createVSCodeSettings("/project");
			expect(result).toEqual({ type: "skipped" });
		});

		it("should overwrite with force option", async () => {
			vol.fromJSON({
				"/project/.vscode/settings.json": "{}",
				"/templates/.vscode/settings.json": JSON.stringify({
					"editor.formatOnSave": true,
				}),
			});

			const result = await createVSCodeSettings("/project", true);
			expect(result).toEqual({ type: "overwritten" });
			expect(promptUtils.promptOverwriteConfirmation).not.toHaveBeenCalled();
		});

		it("should handle directory creation error", async () => {
			vol.fromJSON({
				"/project": null,
				"/templates/.vscode/settings.json": JSON.stringify({
					"editor.formatOnSave": true,
				}),
			});

			// Mock createDirectory to throw an error
			vi.spyOn(fileUtils, "createDirectory").mockImplementation(() => {
				throw new Error("Permission denied");
			});

			const result = await createVSCodeSettings("/project");
			expect(result.type).toBe("error");
			expect(result).toMatchObject({
				type: "error",
				message: "Permission denied",
			});
		});

		it("should handle file copy error", async () => {
			vol.fromJSON({
				"/project/.vscode": null,
				"/templates/.vscode/settings.json": JSON.stringify({
					"editor.formatOnSave": true,
				}),
			});

			// Mock copyFile to throw an error
			vi.spyOn(fileUtils, "copyFile").mockImplementation(() => {
				throw new Error("File copy failed");
			});

			const result = await createVSCodeSettings("/project");
			expect(result.type).toBe("error");
			expect(result).toMatchObject({
				type: "error",
				message: "File copy failed",
			});
		});

		it("should handle missing template file", async () => {
			vol.fromJSON({
				"/project": null,
				"/templates/.vscode": null,
			});

			const result = await createVSCodeSettings("/project");
			expect(result.type).toBe("error");
		});

		it("should work with nested directory structure", async () => {
			vol.fromJSON({
				"/workspace/projects/myapp": null,
				"/templates/.vscode/settings.json": JSON.stringify({
					"editor.formatOnSave": true,
				}),
			});

			const result = await createVSCodeSettings("/workspace/projects/myapp");
			expect(result).toEqual({ type: "created" });
			expect(
				fileUtils.fileExists("/workspace/projects/myapp/.vscode/settings.json"),
			).toBe(true);
		});

		it("should preserve other files in existing .vscode directory", async () => {
			vol.fromJSON({
				"/project/.vscode/extensions.json": JSON.stringify({
					recommendations: ["biomejs.biome"],
				}),
				"/templates/.vscode/settings.json": JSON.stringify({
					"editor.formatOnSave": true,
				}),
			});

			const result = await createVSCodeSettings("/project");
			expect(result).toEqual({ type: "created" });
			expect(fileUtils.fileExists("/project/.vscode/settings.json")).toBe(true);
			expect(fileUtils.fileExists("/project/.vscode/extensions.json")).toBe(
				true,
			);
		});

		describe("settings replacement behavior", () => {
			it("should completely replace existing settings (not merged)", async () => {
				vol.fromJSON({
					"/project/.vscode/settings.json": JSON.stringify(
						{
							"editor.fontSize": 16,
							"editor.tabSize": 2,
							customSetting: true,
						},
						null,
						2,
					),
					"/templates/.vscode/settings.json": JSON.stringify(
						{
							"editor.formatOnSave": true,
							"editor.codeActionsOnSave": {
								"quickfix.biome": "explicit",
							},
						},
						null,
						2,
					),
				});

				vi.mocked(promptUtils.promptOverwriteConfirmation).mockResolvedValue(
					true,
				);

				const result = await createVSCodeSettings("/project");
				expect(result).toEqual({ type: "overwritten" });

				// Verify file content (completely replaced)
				const content = vol.readFileSync(
					"/project/.vscode/settings.json",
					"utf8",
				) as string;
				const settings = JSON.parse(content);

				expect(settings).toEqual({
					"editor.formatOnSave": true,
					"editor.codeActionsOnSave": {
						"quickfix.biome": "explicit",
					},
				});

				// Existing settings are removed
				expect(settings).not.toHaveProperty("editor.fontSize");
				expect(settings).not.toHaveProperty("editor.tabSize");
				expect(settings).not.toHaveProperty("customSetting");
			});

			it("should not preserve JSONc comments (overwrite in JSON format)", async () => {
				vol.fromJSON({
					"/project/.vscode/settings.json": `{
	// User settings comment
	"editor.fontSize": 16,
	/* multi-line comment
	   settings description */
	"editor.tabSize": 2
}`,
					"/templates/.vscode/settings.json": JSON.stringify(
						{
							"editor.formatOnSave": true,
						},
						null,
						2,
					),
				});

				vi.mocked(promptUtils.promptOverwriteConfirmation).mockResolvedValue(
					true,
				);

				const result = await createVSCodeSettings("/project");
				expect(result).toEqual({ type: "overwritten" });

				// Verify file content (comments are lost)
				const content = vol.readFileSync(
					"/project/.vscode/settings.json",
					"utf8",
				) as string;
				expect(content).not.toContain("User settings comment");
				expect(content).not.toContain("multi-line comment");
				expect(content).not.toContain("settings description");

				// Saved in JSON format
				const settings = JSON.parse(content);
				expect(settings).toEqual({
					"editor.formatOnSave": true,
				});
			});

			it("should overwrite invalid JSON format existing settings file", async () => {
				vol.fromJSON({
					"/project/.vscode/settings.json": "{ invalid json syntax",
					"/templates/.vscode/settings.json": JSON.stringify({
						"editor.formatOnSave": true,
					}),
				});

				vi.mocked(promptUtils.promptOverwriteConfirmation).mockResolvedValue(
					true,
				);

				const result = await createVSCodeSettings("/project");
				expect(result).toEqual({ type: "overwritten" });

				// Overwritten with valid JSON
				const content = vol.readFileSync(
					"/project/.vscode/settings.json",
					"utf8",
				) as string;
				const settings = JSON.parse(content); // No parse error occurs
				expect(settings).toEqual({
					"editor.formatOnSave": true,
				});
			});

			it("should replace empty settings.json normally", async () => {
				vol.fromJSON({
					"/project/.vscode/settings.json": "",
					"/templates/.vscode/settings.json": JSON.stringify({
						"editor.formatOnSave": true,
						"editor.codeActionsOnSave": {
							"quickfix.biome": "explicit",
						},
					}),
				});

				vi.mocked(promptUtils.promptOverwriteConfirmation).mockResolvedValue(
					true,
				);

				const result = await createVSCodeSettings("/project");
				expect(result).toEqual({ type: "overwritten" });

				const content = vol.readFileSync(
					"/project/.vscode/settings.json",
					"utf8",
				) as string;
				const settings = JSON.parse(content);
				expect(settings).toEqual({
					"editor.formatOnSave": true,
					"editor.codeActionsOnSave": {
						"quickfix.biome": "explicit",
					},
				});
			});
		});
	});
});
