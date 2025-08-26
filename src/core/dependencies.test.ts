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

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({ type: "already-installed" });
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
				expect(command).toContain("pnpm add -D");
				expect(command).toContain("@biomejs/biome@latest");
				expect(command).toContain("@mfyuu/biome-config@latest");
				return Buffer.from("Dependencies installed successfully\n");
			});

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({ type: "installed" });
			expect(promptUtils.promptInstallDependencies).toHaveBeenCalledWith([
				DEPENDENCIES.BIOME,
				DEPENDENCIES.CONFIG,
			]);
			expect(execSyncMock).toHaveBeenCalled();
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
			execSyncMock.mockImplementation((command: string) => {
				// Verify command format is correct
				expect(command).toContain("yarn add -D");
				expect(command).toContain("@mfyuu/biome-config@latest");
				return Buffer.from("Dependencies installed successfully\n");
			});

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({ type: "installed" });
			expect(promptUtils.promptInstallDependencies).toHaveBeenCalledWith([
				DEPENDENCIES.CONFIG,
			]);
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
				// Verify npm is auto-detected
				expect(command).toContain("npm i -D");
				return Buffer.from("Dependencies installed successfully\n");
			});

			await handleDependencies("/project", {});
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
				// Verify npm is specified
				expect(command).toContain("npm i -D");
				return Buffer.from("Dependencies installed successfully\n");
			});

			await handleDependencies("/project", { useNpm: true });
			expect(execSyncMock).toHaveBeenCalledWith(
				expect.stringContaining("npm i -D"),
				expect.any(Object),
			);
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
				// Verify yarn is specified
				expect(command).toContain("yarn add -D");
				return Buffer.from("Dependencies installed successfully\n");
			});

			await handleDependencies("/project", { useYarn: true });
			expect(execSyncMock).toHaveBeenCalledWith(
				expect.stringContaining("yarn add -D"),
				expect.any(Object),
			);
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
				// Verify pnpm is specified
				expect(command).toContain("pnpm add -D");
				return Buffer.from("Dependencies installed successfully\n");
			});

			await handleDependencies("/project", { usePnpm: true });
			expect(execSyncMock).toHaveBeenCalledWith(
				expect.stringContaining("pnpm add -D"),
				expect.any(Object),
			);
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
				// Verify bun is specified
				expect(command).toContain("bun add -D");
				return Buffer.from("Dependencies installed successfully\n");
			});

			await handleDependencies("/project", { useBun: true });
			expect(execSyncMock).toHaveBeenCalledWith(
				expect.stringContaining("bun add -D"),
				expect.any(Object),
			);
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
				// Verify pnpm selected in prompt is used
				expect(command).toContain("pnpm add -D");
				return Buffer.from("Dependencies installed successfully\n");
			});

			await handleDependencies("/project", {});
			expect(promptUtils.promptPackageManager).toHaveBeenCalled();
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

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({
				type: "error",
				message: "Failed to install dependencies",
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
			expect(result).toEqual({ type: "skipped" });
			expect(promptUtils.promptInstallDependencies).not.toHaveBeenCalled();
		});

		it("should handle missing package.json", async () => {
			vol.fromJSON({
				"/project": null,
			});

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({ type: "no-package-json" });
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

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({ type: "skipped" });
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

			const result = await handleDependencies("/project", {});
			expect(result).toEqual({ type: "already-installed" });
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
				expect(command).toMatch(/^(npm|yarn|pnpm|bun) (i|add) -D/);
				return Buffer.from("Dependencies installed successfully\n");
			});

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
			expect(result).toEqual({ type: "no-package-json" });

			readUserPackageJsonSpy.mockRestore();
		});
	});
});
