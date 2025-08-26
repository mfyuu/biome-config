import path from "node:path";
import { vol } from "memfs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROJECT_TYPES } from "../constants";
import * as fileUtils from "../utils/file";
import * as promptUtils from "../utils/prompt";
import { createBiomeConfig } from "./biome-config";

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

// Mock setup
vi.mock("../utils/logger");
vi.mock("../utils/prompt");

describe("biome-config", () => {
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

	describe("createBiomeConfig", () => {
		it("should create new config when biome.json does not exist", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					dependencies: {
						react: "^18.0.0",
					},
				}),
				"/templates/biome/base.jsonc": `${JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/base"],
					},
					null,
					"\t",
				)}\n// Customization comments`,
				"/templates/biome/react.jsonc": `${JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/react"],
					},
					null,
					"\t",
				)}\n// React-specific comments`,
				"/templates/biome/next.jsonc": `${JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/next"],
					},
					null,
					"\t",
				)}\n// Next.js-specific comments`,
			});

			const result = await createBiomeConfig("/project", {});
			expect(result).toEqual({ type: "created" });
			expect(fileUtils.fileExists("/project/biome.jsonc")).toBe(true);
		});

		it("should prompt for confirmation when biome.json exists", async () => {
			vol.fromJSON({
				"/project/biome.json": "{}",
				"/project/package.json": JSON.stringify({
					name: "test-project",
				}),
				"/templates/biome/base.json": JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/base"],
					},
					null,
					2,
				),
			});

			vi.mocked(promptUtils.promptBiomeOverwriteConfirmation).mockResolvedValue(
				true,
			);

			const result = await createBiomeConfig("/project", {});
			expect(result).toEqual({ type: "overwritten" });
			expect(promptUtils.promptBiomeOverwriteConfirmation).toHaveBeenCalled();
		});

		it("should skip when user chooses not to overwrite", async () => {
			vol.fromJSON({
				"/project/biome.json": "{}",
			});

			vi.mocked(promptUtils.promptBiomeOverwriteConfirmation).mockResolvedValue(
				false,
			);

			const result = await createBiomeConfig("/project", {});
			expect(result).toEqual({ type: "skipped" });
		});

		it("should force overwrite when force option is true", async () => {
			vol.fromJSON({
				"/project/biome.json": "{}",
				"/project/package.json": JSON.stringify({
					name: "test-project",
				}),
				"/templates/biome/base.json": JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/base"],
					},
					null,
					2,
				),
			});

			const result = await createBiomeConfig("/project", { force: true });
			expect(result).toEqual({ type: "overwritten" });
			expect(
				promptUtils.promptBiomeOverwriteConfirmation,
			).not.toHaveBeenCalled();
		});

		it("should auto-detect project type", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					dependencies: {
						react: "^18.0.0",
						"react-dom": "^18.0.0",
					},
				}),
				"/templates/biome/react.jsonc": `${JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/react"],
					},
					null,
					"\t",
				)}\n// React-specific comments`,
			});

			const result = await createBiomeConfig("/project", {});
			expect(result).toEqual({ type: "created" });
			expect(fileUtils.fileExists("/project/biome.jsonc")).toBe(true);
		});

		it("should use specified project type from options", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
				}),
				"/templates/biome/next.jsonc": `${JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/next"],
					},
					null,
					"\t",
				)}\n// Next.js-specific comments`,
			});

			const result = await createBiomeConfig("/project", {
				type: PROJECT_TYPES.NEXT,
			});
			expect(result).toEqual({ type: "created" });
			expect(promptUtils.promptProjectType).not.toHaveBeenCalled();
		});

		it("should prompt for project type when package.json is missing", async () => {
			vol.fromJSON({
				"/project": null,
				"/templates/biome/base.jsonc": `${JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/base"],
					},
					null,
					"\t",
				)}\n// Customization comments`,
			});

			vi.mocked(promptUtils.promptProjectType).mockResolvedValue(
				PROJECT_TYPES.BASE,
			);

			const result = await createBiomeConfig("/project", {});
			expect(result).toEqual({ type: "created" });
			expect(promptUtils.promptProjectType).toHaveBeenCalled();
		});

		it("should prompt when package.json has invalid format", async () => {
			vol.fromJSON({
				"/project/package.json": "{ invalid json",
				"/templates/biome/base.jsonc": `${JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/base"],
					},
					null,
					"\t",
				)}\n// Customization comments`,
			});

			vi.mocked(promptUtils.promptProjectType).mockResolvedValue(
				PROJECT_TYPES.BASE,
			);

			const result = await createBiomeConfig("/project", {});
			expect(result).toEqual({ type: "created" });
			expect(promptUtils.promptProjectType).toHaveBeenCalled();
		});

		it("should use BASE when no framework is detected", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					dependencies: {
						express: "^4.0.0",
						lodash: "^4.17.0",
					},
				}),
				"/templates/biome/base.jsonc": `${JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/base"],
					},
					null,
					"\t",
				)}\n// Customization comments`,
			});

			const result = await createBiomeConfig("/project", {});
			expect(result).toEqual({ type: "created" });
			expect(promptUtils.promptProjectType).not.toHaveBeenCalled();
			expect(fileUtils.getTemplatePath).toHaveBeenCalledWith(
				expect.stringContaining("base"),
			);
		});

		it("should maintain same extension when biome.jsonc exists", async () => {
			vol.fromJSON({
				"/project/biome.jsonc": "{}",
				"/project/package.json": JSON.stringify({
					name: "test-project",
				}),
				"/templates/biome/base.jsonc": "// Base config with comments\n{}",
			});

			vi.mocked(promptUtils.promptBiomeOverwriteConfirmation).mockResolvedValue(
				true,
			);

			const result = await createBiomeConfig("/project", {});
			expect(result).toEqual({ type: "overwritten" });
			expect(fileUtils.fileExists("/project/biome.jsonc")).toBe(true);
		});

		it("should detect and configure Next.js project", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					dependencies: {
						next: "^14.0.0",
						react: "^18.0.0",
					},
				}),
				"/templates/biome/next.jsonc": `${JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/next"],
					},
					null,
					"\t",
				)}\n// Next.js-specific comments`,
			});

			const result = await createBiomeConfig("/project", {});
			expect(result).toEqual({ type: "created" });
			expect(fileUtils.getTemplatePath).toHaveBeenCalledWith(
				expect.stringContaining("next"),
			);
		});

		it("should handle error when template file is not found", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
				}),
				"/templates/biome": null,
			});

			const result = await createBiomeConfig("/project", {});
			expect(result.type).toBe("error");
			expect(result).toHaveProperty("message");
		});

		it("should handle disk write error", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
				}),
				"/templates/biome/base.jsonc": `${JSON.stringify(
					{
						$schema: "./node_modules/@biomejs/biome/configuration_schema.json",
						extends: ["@mfyuu/biome-config/base"],
					},
					null,
					"\t",
				)}\n// Customization comments`,
			});

			// Mock copyFile to throw an error
			vi.spyOn(fileUtils, "copyFile").mockImplementation(() => {
				throw new Error("Permission denied");
			});

			const result = await createBiomeConfig("/project", {});
			expect(result.type).toBe("error");
			expect(result).toMatchObject({
				type: "error",
				message: "Permission denied",
			});
		});
	});
});
