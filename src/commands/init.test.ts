import { vol } from "memfs";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import * as biomeConfig from "../core/biome-config.js";
import * as dependencies from "../core/dependencies.js";
import * as summary from "../core/summary.js";
import * as vscodeSettings from "../core/vscode-settings.js";
import type { InitOptions } from "../types/index.js";
import * as git from "../utils/git.js";
import { initSettingsFile } from "./init.js";

// Mock setup
vi.mock("../utils/logger.js", () => ({
	logger: {
		info: vi.fn(),
		success: vi.fn(),
		warning: vi.fn(),
		error: vi.fn(),
		code: vi.fn(),
		finalSuccess: vi.fn(),
	},
	highlight: {
		file: (text: string) => text,
		package: (text: string) => text,
		path: (text: string) => text,
		option: (text: string) => text,
	},
}));

vi.mock("../core/summary.js", () => ({
	showSetupSummary: vi.fn(),
}));

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("init", () => {
	let originalCwd: string;
	let findGitRootSpy: MockInstance<(startDir: string) => string | null>;
	let handleDependenciesSpy: MockInstance<
		(baseDir: string, options: InitOptions) => Promise<unknown>
	>;
	let createBiomeConfigSpy: MockInstance<
		(baseDir: string, options: InitOptions) => Promise<unknown>
	>;
	let createVSCodeSettingsSpy: MockInstance<
		(baseDir: string, force?: boolean) => Promise<unknown>
	>;

	beforeEach(() => {
		originalCwd = process.cwd();
		vi.spyOn(console, "log").mockImplementation(() => {});

		findGitRootSpy = vi.spyOn(git, "findGitRoot");
		handleDependenciesSpy = vi.spyOn(dependencies, "handleDependencies");
		createBiomeConfigSpy = vi.spyOn(biomeConfig, "createBiomeConfig");
		createVSCodeSettingsSpy = vi.spyOn(vscodeSettings, "createVSCodeSettings");
	});

	afterEach(() => {
		vol.reset();
		vi.restoreAllMocks();
		process.chdir(originalCwd);
	});

	describe("initSettingsFile", () => {
		it("should create all settings successfully", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});
			vi.spyOn(process, "cwd").mockReturnValue("/test-project");

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({ type: "installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({});

			expect(result).toEqual({ success: true });
			expect(handleDependenciesSpy).toHaveBeenCalledWith("/test-project", {});
			expect(createBiomeConfigSpy).toHaveBeenCalledWith("/test-project", {});
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/test-project",
				undefined,
			);
			expect(summary.showSetupSummary).toHaveBeenCalledWith({
				dependencies: { status: "success", message: "installed" },
				biomeConfig: { status: "success", message: "created" },
				settingsFile: { status: "success", message: "created" },
			});
		});

		it("should use current directory with --local option", async () => {
			vol.fromJSON({
				"/current/package.json": JSON.stringify({ name: "test-project" }),
			});

			vi.spyOn(process, "cwd").mockReturnValue("/current");
			handleDependenciesSpy.mockResolvedValue({ type: "already-installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({ local: true });

			expect(result).toEqual({ success: true });
			expect(findGitRootSpy).not.toHaveBeenCalled();
			expect(handleDependenciesSpy).toHaveBeenCalledWith("/current", {
				local: true,
			});
		});

		it("should fail when Git repository is not found", async () => {
			vol.fromJSON({
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue(null);

			const result = await initSettingsFile({});

			expect(result).toEqual({
				success: false,
				error: "Git repository not found",
			});
			expect(handleDependenciesSpy).not.toHaveBeenCalled();
			expect(createBiomeConfigSpy).not.toHaveBeenCalled();
			expect(createVSCodeSettingsSpy).not.toHaveBeenCalled();
		});

		it("should skip dependency installation when skipDeps is true", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({ type: "skipped" });
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({ skipDeps: true });

			expect(result).toEqual({ success: true });
			expect(handleDependenciesSpy).toHaveBeenCalledWith("/test-project", {
				skipDeps: true,
			});
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					dependencies: { status: "skipped", message: "skipped" },
					biomeConfig: { status: "success", message: "created" },
					settingsFile: { status: "success", message: "created" },
				}),
			);
		});

		it("should confirm biome.json overwrite", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({ type: "already-installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "overwritten" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({});

			expect(result).toEqual({ success: true });
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					biomeConfig: { status: "success", message: "overwritten" },
				}),
			);
		});

		it("should skip VS Code settings", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({ type: "already-installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "skipped" });

			const result = await initSettingsFile({});

			expect(result).toEqual({ success: true });
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					settingsFile: { status: "skipped", message: "skipped" },
				}),
			);
		});

		it("should handle errors gracefully", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "error",
				message: "Failed to install dependencies",
			});
			createBiomeConfigSpy.mockResolvedValue({
				type: "error",
				message: "Permission denied",
			});
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({});

			expect(result).toEqual({ success: true }); // At least one succeeded
			expect(summary.showSetupSummary).toHaveBeenCalledWith({
				dependencies: { status: "error", message: "failed" },
				biomeConfig: { status: "error", message: "failed" },
				settingsFile: { status: "success", message: "created" },
			});
		});

		it("should return false when all tasks fail", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({ type: "no-package-json" });
			createBiomeConfigSpy.mockResolvedValue({
				type: "error",
				message: "Failed",
			});
			createVSCodeSettingsSpy.mockResolvedValue({
				type: "error",
				message: "Failed",
			});

			const result = await initSettingsFile({});

			expect(result).toEqual({ success: false });
			expect(summary.showSetupSummary).toHaveBeenCalledWith({
				dependencies: { status: "skipped", message: "skipped" },
				biomeConfig: { status: "error", message: "failed" },
				settingsFile: { status: "error", message: "failed" },
			});
		});

		it("should force overwrite with force option", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({ type: "already-installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "overwritten" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "overwritten" });

			const result = await initSettingsFile({ force: true });

			expect(result).toEqual({ success: true });
			expect(createBiomeConfigSpy).toHaveBeenCalledWith("/test-project", {
				force: true,
			});
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/test-project",
				true,
			);
		});

		it("should respect package manager option", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({ type: "installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			await initSettingsFile({ useNpm: true });

			expect(handleDependenciesSpy).toHaveBeenCalledWith("/test-project", {
				useNpm: true,
			});
		});

		it("should handle React project type", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({ type: "already-installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			await initSettingsFile({ type: "react" });

			expect(createBiomeConfigSpy).toHaveBeenCalledWith("/test-project", {
				type: "react",
			});
		});

		it("should handle Next.js project type", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({ type: "already-installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			await initSettingsFile({ type: "next" });

			expect(createBiomeConfigSpy).toHaveBeenCalledWith("/test-project", {
				type: "next",
			});
		});

		it("should handle all options combined", async () => {
			vol.fromJSON({
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			vi.spyOn(process, "cwd").mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({ type: "installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "overwritten" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "overwritten" });

			const result = await initSettingsFile({
				local: true,
				force: true,
				type: "next",
				usePnpm: true,
			});

			expect(result).toEqual({ success: true });
			expect(handleDependenciesSpy).toHaveBeenCalledWith("/test-project", {
				local: true,
				force: true,
				type: "next",
				usePnpm: true,
			});
			expect(createBiomeConfigSpy).toHaveBeenCalledWith("/test-project", {
				local: true,
				force: true,
				type: "next",
				usePnpm: true,
			});
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/test-project",
				true,
			);
		});
	});

	describe("initSettingsFile - component integration tests", () => {
		it("should call all components in correct order", async () => {
			vol.fromJSON({
				"/project/.git": null,
				"/project/package.json": JSON.stringify({
					name: "test-project",
					dependencies: { react: "^18.0.0" },
				}),
			});

			findGitRootSpy.mockReturnValue("/project");
			handleDependenciesSpy.mockResolvedValue({ type: "installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({
				force: true,
				type: "react",
			});

			expect(result).toEqual({ success: true });

			// Verify calls are made in correct order
			expect(handleDependenciesSpy).toHaveBeenCalledWith("/project", {
				force: true,
				type: "react",
			});
			expect(createBiomeConfigSpy).toHaveBeenCalledWith("/project", {
				force: true,
				type: "react",
			});
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith("/project", true);
		});

		it("should handle actual filesystem state properly", async () => {
			// Set up existing files state
			vol.fromJSON({
				"/existing-project/.git": null,
				"/existing-project/package.json": JSON.stringify({
					name: "existing-project",
				}),
				"/existing-project/biome.json": "{}", // Existing biome config
				"/existing-project/.vscode/settings.json": "{}", // Existing VSCode settings
			});

			vi.spyOn(process, "cwd").mockReturnValue("/existing-project");

			findGitRootSpy.mockReturnValue("/existing-project");
			handleDependenciesSpy.mockResolvedValue({ type: "already-installed" });
			createBiomeConfigSpy.mockResolvedValue({ type: "overwritten" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "overwritten" });

			const result = await initSettingsFile({
				local: true,
				force: true,
			});

			expect(result).toEqual({ success: true });

			// Verify force overwrite is configured correctly
			expect(createBiomeConfigSpy).toHaveBeenCalledWith("/existing-project", {
				local: true,
				force: true,
			});
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/existing-project",
				true,
			);
		});
	});
});
