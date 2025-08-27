import { vol } from "memfs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEPENDENCIES } from "../constants";
import * as packageUtils from "../utils/package";
import * as packageManagerUtils from "../utils/package-manager";
import * as promptUtils from "../utils/prompt";
import { handleDependencies } from "./dependencies";

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

// Mock setup
vi.mock("../utils/logger");
vi.mock("../utils/prompt");

const execSyncMock = vi.fn();
vi.mock("node:child_process", () => ({
	execSync: execSyncMock,
}));

describe("dependencies", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		execSyncMock.mockReset();
	});

	afterEach(() => {
		vol.reset();
		vi.restoreAllMocks();
	});

	describe("handleDependencies", () => {
		it("should skip when already installed", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {
						[DEPENDENCIES.BIOME]: "^2.2.0",
						[DEPENDENCIES.CONFIG]: "^1.0.0",
					},
				}),
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "already-installed",
				formatterChoice: "biome-only",
			});
		});

		it("should install when packages are missing", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
				"/project/pnpm-lock.yaml": "",
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			execSyncMock.mockImplementation((command: string) => {
				// Verify command format is correct
				if (command.includes("@biomejs/biome")) {
					expect(command).toBe(
						"pnpm add --save-dev --save-exact @biomejs/biome",
					);
				} else if (command.includes("@mfyuu/biome-config")) {
					expect(command).toBe("pnpm add --save-dev @mfyuu/biome-config");
				}
				return Buffer.from("Dependencies installed successfully\n");
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "installed",
				formatterChoice: "biome-only",
			});
			expect(promptUtils.promptInstallDependencies).toHaveBeenCalledWith([
				DEPENDENCIES.BIOME,
				DEPENDENCIES.CONFIG,
			]);
			expect(execSyncMock).toHaveBeenCalledTimes(2);
		});

		it("should install when only some packages are installed", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {
						[DEPENDENCIES.BIOME]: "^2.2.0",
					},
				}),
				"/project/yarn.lock": "",
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			execSyncMock.mockImplementation((command: string) => {
				// Verify command format is correct
				expect(command).toBe("yarn add --dev @mfyuu/biome-config");
				return Buffer.from("Dependencies installed successfully\n");
			});

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "installed",
				formatterChoice: "biome-only",
			});
			expect(promptUtils.promptInstallDependencies).toHaveBeenCalledWith([
				DEPENDENCIES.CONFIG,
			]);
			expect(execSyncMock).toHaveBeenCalledTimes(1);
		});

		it("should auto-detect package manager", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
				"/project/package-lock.json": "{}",
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			execSyncMock.mockImplementation((command: string) => {
				// Verify npm is auto-detected and command format is correct
				if (command.includes("--save-exact")) {
					expect(command).toBe("npm i --save-dev --save-exact @biomejs/biome");
				} else {
					expect(command).toContain("npm i --save-dev");
				}
				return Buffer.from("Dependencies installed successfully\n");
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			await handleDependencies("/project", {});
			expect(execSyncMock).toHaveBeenCalledTimes(2);
			expect(execSyncMock).toHaveBeenCalledWith(
				expect.stringContaining("npm"),
				expect.any(Object),
			);
		});

		it("should use specified package manager: npm", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			execSyncMock.mockImplementation((command: string) => {
				// Verify npm is specified and command format is correct
				if (command.includes("--save-exact")) {
					expect(command).toBe("npm i --save-dev --save-exact @biomejs/biome");
				} else {
					expect(command).toContain("npm i --save-dev");
				}
				return Buffer.from("Dependencies installed successfully\n");
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			await handleDependencies("/project", { useNpm: true });
			expect(execSyncMock).toHaveBeenCalledTimes(2);
			expect(execSyncMock).toHaveBeenCalled();
		});

		it("should use specified package manager: yarn", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			execSyncMock.mockImplementation((command: string) => {
				// Verify yarn is specified and command format is correct
				if (command.includes("--exact")) {
					expect(command).toBe("yarn add --dev --exact @biomejs/biome");
				} else {
					expect(command).toContain("yarn add --dev");
				}
				return Buffer.from("Dependencies installed successfully\n");
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			await handleDependencies("/project", { useYarn: true });
			expect(execSyncMock).toHaveBeenCalledTimes(2);
			expect(execSyncMock).toHaveBeenCalled();
		});

		it("should use specified package manager: pnpm", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			execSyncMock.mockImplementation((command: string) => {
				// Verify pnpm is specified and command format is correct
				if (command.includes("--save-exact")) {
					expect(command).toBe(
						"pnpm add --save-dev --save-exact @biomejs/biome",
					);
				} else {
					expect(command).toContain("pnpm add --save-dev");
				}
				return Buffer.from("Dependencies installed successfully\n");
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			await handleDependencies("/project", { usePnpm: true });
			expect(execSyncMock).toHaveBeenCalledTimes(2);
			expect(execSyncMock).toHaveBeenCalled();
		});

		it("should use specified package manager: bun", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			execSyncMock.mockImplementation((command: string) => {
				// Verify bun is specified and command format is correct
				if (command.includes("--exact")) {
					expect(command).toBe("bun add --dev --exact @biomejs/biome");
				} else {
					expect(command).toContain("bun add --dev");
				}
				return Buffer.from("Dependencies installed successfully\n");
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			await handleDependencies("/project", { useBun: true });
			expect(execSyncMock).toHaveBeenCalledTimes(2);
			expect(execSyncMock).toHaveBeenCalled();
		});

		it("should show package manager prompt", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
			});

			vi.mocked(promptUtils.promptPackageManager).mockResolvedValue("pnpm");
			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			execSyncMock.mockImplementation((command: string) => {
				// Verify pnpm selected in prompt is used and command format is correct
				if (command.includes("--save-exact")) {
					expect(command).toBe(
						"pnpm add --save-dev --save-exact @biomejs/biome",
					);
				} else {
					expect(command).toContain("pnpm add --save-dev");
				}
				return Buffer.from("Dependencies installed successfully\n");
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			await handleDependencies("/project", {});
			expect(promptUtils.promptPackageManager).toHaveBeenCalled();
			expect(execSyncMock).toHaveBeenCalledTimes(2);
		});

		it("should handle install command execution error", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			vi.mocked(promptUtils.promptPackageManager).mockResolvedValue("npm");
			execSyncMock.mockImplementation(() => {
				throw new Error("Command failed");
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "error",
				message: "Failed to install dependencies",
				formatterChoice: "biome-only",
			});
		});

		it("should skip when skipDeps option is true", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
			});

			const result = await handleDependencies("/project", { skipDeps: true });
			expect(result).toEqual({ type: "skipped", formatterChoice: null });
			expect(promptUtils.promptInstallDependencies).not.toHaveBeenCalled();
		});

		it("should handle missing package.json", async () => {
			vol.fromJSON({
				"/project": null,
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "no-package-json",
				formatterChoice: null,
			});
		});

		it("should handle when user cancels installation", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(false);
			vi.mocked(promptUtils.promptPackageManager).mockResolvedValue("npm");
			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "skipped",
				formatterChoice: "biome-only",
			});
			expect(execSyncMock).not.toHaveBeenCalled();
		});

		it("should error when multiple package managers are specified", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
			});

			const result = await handleDependencies("/project", {
				useNpm: true,
				useYarn: true,
			});
			expect(result.type).toBe("error");
			expect(result).toHaveProperty("message");
			expect(result).toHaveProperty("formatterChoice", null);
		});

		it("should install prettier when with-prettier is selected", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
				"/project/pnpm-lock.yaml": "",
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"with-prettier",
			);
			execSyncMock.mockImplementation((command: string) => {
				// Verify command format is correct
				if (
					command.includes("@biomejs/biome") &&
					command.includes("prettier")
				) {
					expect(command).toBe(
						"pnpm add --save-dev --save-exact @biomejs/biome prettier",
					);
				} else if (command.includes("@mfyuu/biome-config")) {
					expect(command).toBe("pnpm add --save-dev @mfyuu/biome-config");
				}
				return Buffer.from("Dependencies installed successfully\n");
			});

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "installed",
				formatterChoice: "with-prettier",
			});
			expect(promptUtils.promptInstallDependencies).toHaveBeenCalledWith([
				DEPENDENCIES.BIOME,
				DEPENDENCIES.CONFIG,
				DEPENDENCIES.PRETTIER,
			]);
			expect(execSyncMock).toHaveBeenCalledTimes(2);
		});

		it("should skip prettier when already installed with with-prettier", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {
						[DEPENDENCIES.BIOME]: "^2.2.0",
						[DEPENDENCIES.CONFIG]: "^1.0.0",
						[DEPENDENCIES.PRETTIER]: "^3.0.0",
					},
				}),
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"with-prettier",
			);
			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
		});

		it("should detect packages in dependencies", async () => {
			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					dependencies: {
						[DEPENDENCIES.BIOME]: "^2.2.0",
					},
					devDependencies: {
						[DEPENDENCIES.CONFIG]: "^1.0.0",
					},
				}),
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "already-installed",
				formatterChoice: "biome-only",
			});
		});

		it("should verify functions are called correctly", async () => {
			// Set up spies
			const readUserPackageJsonSpy = vi.spyOn(
				packageUtils,
				"readUserPackageJson",
			);
			const hasDependencySpy = vi.spyOn(packageUtils, "hasDependency");
			const detectPackageManagerSpy = vi.spyOn(
				packageManagerUtils,
				"detectPackageManager",
			);
			const getInstallCommandSpy = vi.spyOn(
				packageManagerUtils,
				"getInstallCommand",
			);
			const validatePackageManagerChoiceSpy = vi.spyOn(
				packageManagerUtils,
				"validatePackageManagerChoice",
			);

			vol.fromJSON({
				"/project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: {},
				}),
				"/project/pnpm-lock.yaml": "",
			});

			vi.mocked(promptUtils.promptInstallDependencies).mockResolvedValue(true);
			execSyncMock.mockImplementation((command: string) => {
				// Verify command is executed
				if (command.includes("@biomejs/biome")) {
					expect(command).toBe(
						"pnpm add --save-dev --save-exact @biomejs/biome",
					);
				} else if (command.includes("@mfyuu/biome-config")) {
					expect(command).toBe("pnpm add --save-dev @mfyuu/biome-config");
				}
				return Buffer.from("Dependencies installed successfully\n");
			});

			vi.mocked(promptUtils.promptFormatterChoice).mockResolvedValue(
				"biome-only",
			);
			await handleDependencies("/project", {});

			// Verify each function was called
			expect(readUserPackageJsonSpy).toHaveBeenCalledWith("/project");
			expect(hasDependencySpy).toHaveBeenCalled();
			expect(detectPackageManagerSpy).toHaveBeenCalledWith("/project");
			expect(validatePackageManagerChoiceSpy).toHaveBeenCalled();
			expect(getInstallCommandSpy).toHaveBeenCalledWith("pnpm", [
				DEPENDENCIES.BIOME,
				DEPENDENCIES.CONFIG,
			]);

			// Restore spies
			readUserPackageJsonSpy.mockRestore();
			hasDependencySpy.mockRestore();
			detectPackageManagerSpy.mockRestore();
			getInstallCommandSpy.mockRestore();
			validatePackageManagerChoiceSpy.mockRestore();
		});

		it("should handle package.json read error", async () => {
			const readUserPackageJsonSpy = vi.spyOn(
				packageUtils,
				"readUserPackageJson",
			);
			readUserPackageJsonSpy.mockReturnValue(null);

			vol.fromJSON({
				"/project/package.json": "{ invalid json",
			});

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "no-package-json",
				formatterChoice: null,
			});

			readUserPackageJsonSpy.mockRestore();
		});
	});
});
