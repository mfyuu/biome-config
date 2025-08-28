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
import type { ProjectType } from "../constants";
import * as biomeConfig from "../core/biome-config";
import * as dependencies from "../core/dependencies";
import * as lefthook from "../core/lefthook";
import * as scripts from "../core/scripts";
import * as summary from "../core/summary";
import * as vscodeSettings from "../core/vscode-settings";
import type { InitOptions } from "../types/index";
import * as git from "../utils/git";
import { logger } from "../utils/logger";
import { runCommand } from "../utils/npm-command";
import * as packageUtils from "../utils/package";
import * as packageManager from "../utils/package-manager";
import * as prompt from "../utils/prompt";
import { initSettingsFile } from "./init";

// Mock setup
vi.mock("../utils/logger", () => ({
	logger: {
		info: vi.fn(),
		success: vi.fn(),
		warning: vi.fn(),
		error: vi.fn(),
		code: vi.fn(),
		finalSuccess: vi.fn(),
		hooksSync: vi.fn(),
	},
	highlight: {
		file: (text: string) => text,
		package: (text: string) => text,
		path: (text: string) => text,
		option: (text: string) => text,
	},
}));

// Mock npm-command utilities
vi.mock("../utils/npm-command", () => ({
	runCommand: vi.fn().mockResolvedValue(undefined),
	createSpinner: vi.fn(() => ({
		start: vi.fn(),
		succeed: vi.fn(),
		fail: vi.fn(),
	})),
}));

vi.mock("../core/summary", () => ({
	showSetupSummary: vi.fn(),
}));

vi.mock("../utils/prompt");
vi.mock("../core/lefthook");

// Mock child_process for lefthook installation
const execSyncMock = vi.fn();
vi.mock("node:child_process", () => ({
	execSync: execSyncMock,
}));

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("init", () => {
	let originalCwd: string;
	let findGitRootSpy: MockInstance<(startDir: string) => string | null>;
	let handleDependenciesSpy: MockInstance<
		(
			baseDir: string,
			options: InitOptions,
			projectType?: ProjectType,
		) => Promise<unknown>
	>;
	let promptFormatterChoiceSpy: MockInstance<
		() => Promise<"biome-only" | "with-prettier">
	>;
	let createBiomeConfigSpy: MockInstance<
		(
			baseDir: string,
			projectType: ProjectType,
			options: InitOptions,
		) => Promise<unknown>
	>;
	let detectOrSelectProjectTypeSpy: MockInstance<
		(baseDir: string, options: InitOptions) => Promise<ProjectType>
	>;
	let createVSCodeSettingsSpy: MockInstance<
		(baseDir: string, force?: boolean) => Promise<unknown>
	>;
	let addBiomeScriptsSpy: MockInstance<
		(baseDir: string) => Promise<"success" | "error">
	>;
	let createLefthookConfigSpy: MockInstance<
		(
			baseDir: string,
			packageManager: packageManager.PackageManager,
			force?: boolean,
		) => Promise<unknown>
	>;
	let addLefthookScriptSpy: MockInstance<
		(baseDir: string) => Promise<"success" | "error">
	>;
	let promptLefthookIntegrationSpy: MockInstance<() => Promise<boolean>>;
	let detectPackageManagerSpy: MockInstance<(cwd: string) => string | null>;

	beforeEach(() => {
		originalCwd = process.cwd();
		vi.spyOn(console, "log").mockImplementation(() => {});
		execSyncMock.mockReset();

		findGitRootSpy = vi.spyOn(git, "findGitRoot");
		handleDependenciesSpy = vi.spyOn(dependencies, "handleDependencies");
		createBiomeConfigSpy = vi.spyOn(biomeConfig, "createBiomeConfig");
		detectOrSelectProjectTypeSpy = vi
			.spyOn(biomeConfig, "detectOrSelectProjectType")
			.mockResolvedValue("base");
		addBiomeScriptsSpy = vi
			.spyOn(scripts, "addBiomeScripts")
			.mockResolvedValue("success");
		createVSCodeSettingsSpy = vi.spyOn(vscodeSettings, "createVSCodeSettings");
		promptFormatterChoiceSpy = vi
			.spyOn(prompt, "promptFormatterChoice")
			.mockResolvedValue("with-prettier");
		createLefthookConfigSpy = vi
			.spyOn(lefthook, "createLefthookConfig")
			.mockResolvedValue({ type: "skipped" });
		addLefthookScriptSpy = vi
			.spyOn(lefthook, "addLefthookScript")
			.mockResolvedValue("success");
		promptLefthookIntegrationSpy = vi
			.spyOn(prompt, "promptLefthookIntegration")
			.mockResolvedValue(false);
		detectPackageManagerSpy = vi
			.spyOn(packageManager, "detectPackageManager")
			.mockReturnValue("npm");
		vi.spyOn(packageManager, "getLefthookInstallCommand");
		vi.spyOn(packageManager, "getInstallCommand").mockReturnValue([
			"npm i --save-dev lefthook",
		]);
		vi.spyOn(packageUtils, "readUserPackageJson").mockReturnValue({
			name: "test-project",
		});
		vi.spyOn(packageUtils, "hasDependency").mockReturnValue(false);
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
			handleDependenciesSpy.mockResolvedValue({
				type: "installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			addBiomeScriptsSpy.mockResolvedValue("success");
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({});

			expect(result).toEqual({ success: true });
			expect(handleDependenciesSpy).toHaveBeenCalledWith(
				"/test-project",
				{},
				"base",
			);
			expect(createBiomeConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"base",
				{},
			);
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/test-project",
				undefined,
				"with-prettier",
			);
			expect(summary.showSetupSummary).toHaveBeenCalledWith({
				dependencies: { status: "success", message: "installed" },
				biomeConfig: { status: "success", message: "created" },
				scripts: { status: "success", message: "added" },
				settingsFile: { status: "success", message: "created" },
				lefthook: { status: "skipped", message: "skipped" },
			});
		});

		it("should use current directory with --local option", async () => {
			vol.fromJSON({
				"/current/package.json": JSON.stringify({ name: "test-project" }),
			});

			vi.spyOn(process, "cwd").mockReturnValue("/current");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			addBiomeScriptsSpy.mockResolvedValue("success");
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({ local: true });

			expect(result).toEqual({ success: true });
			expect(findGitRootSpy).not.toHaveBeenCalled();
			expect(handleDependenciesSpy).toHaveBeenCalledWith(
				"/current",
				{
					local: true,
				},
				"base",
			);
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
			handleDependenciesSpy.mockResolvedValue({
				type: "skipped",
				formatterChoice: null,
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({ skipDeps: true });

			expect(result).toEqual({ success: true });
			expect(handleDependenciesSpy).toHaveBeenCalledWith(
				"/test-project",
				{
					skipDeps: true,
				},
				"base",
			);
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					dependencies: { status: "skipped", message: "skipped" },
					biomeConfig: { status: "success", message: "created" },
					settingsFile: { status: "success", message: "created" },
					lefthook: { status: "skipped", message: "skipped" },
				}),
			);
		});

		it("should confirm biome.json overwrite", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "overwritten" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({});

			expect(result).toEqual({ success: true });
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					biomeConfig: { status: "success", message: "overwritten" },
					lefthook: { status: "skipped", message: "skipped" },
				}),
			);
		});

		it("should skip VS Code settings", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "skipped" });

			const result = await initSettingsFile({});

			expect(result).toEqual({ success: true });
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					settingsFile: { status: "skipped", message: "skipped" },
					lefthook: { status: "skipped", message: "skipped" },
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
			addBiomeScriptsSpy.mockResolvedValue("error");
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({});

			expect(result).toEqual({ success: true }); // At least one succeeded
			expect(summary.showSetupSummary).toHaveBeenCalledWith({
				dependencies: { status: "error", message: "failed" },
				biomeConfig: { status: "error", message: "failed" },
				scripts: { status: "error", message: "failed" },
				settingsFile: { status: "success", message: "created" },
				lefthook: { status: "skipped", message: "skipped" },
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
			addBiomeScriptsSpy.mockResolvedValue("error");
			createVSCodeSettingsSpy.mockResolvedValue({
				type: "error",
				message: "Failed",
			});

			const result = await initSettingsFile({});

			expect(result).toEqual({ success: false });
			expect(summary.showSetupSummary).toHaveBeenCalledWith({
				dependencies: { status: "skipped", message: "skipped" },
				biomeConfig: { status: "error", message: "failed" },
				scripts: { status: "skipped", message: "package.json not found" },
				settingsFile: { status: "error", message: "failed" },
				lefthook: { status: "skipped", message: "skipped" },
			});
		});

		it("should force overwrite with force option", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "overwritten" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "overwritten" });

			const result = await initSettingsFile({ force: true });

			expect(result).toEqual({ success: true });
			expect(createBiomeConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"base",
				{
					force: true,
				},
			);
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/test-project",
				true,
				"with-prettier",
			);
		});

		it("should respect package manager option", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			await initSettingsFile({ useNpm: true });

			expect(handleDependenciesSpy).toHaveBeenCalledWith(
				"/test-project",
				{
					useNpm: true,
				},
				"base",
			);
		});

		it("should handle React project type", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			detectOrSelectProjectTypeSpy.mockResolvedValue("react");

			await initSettingsFile({ type: "react" });

			expect(detectOrSelectProjectTypeSpy).toHaveBeenCalledWith(
				"/test-project",
				{ type: "react" },
			);
			expect(createBiomeConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"react",
				{
					type: "react",
				},
			);
		});

		it("should handle Next.js project type", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			detectOrSelectProjectTypeSpy.mockResolvedValue("next");

			await initSettingsFile({ type: "next" });

			expect(detectOrSelectProjectTypeSpy).toHaveBeenCalledWith(
				"/test-project",
				{ type: "next" },
			);
			expect(createBiomeConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"next",
				{
					type: "next",
				},
			);
		});

		it("should handle all options combined", async () => {
			vol.fromJSON({
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			vi.spyOn(process, "cwd").mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "overwritten" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "overwritten" });

			detectOrSelectProjectTypeSpy.mockResolvedValue("next");

			const result = await initSettingsFile({
				local: true,
				force: true,
				type: "next",
				usePnpm: true,
			});

			expect(result).toEqual({ success: true });
			expect(handleDependenciesSpy).toHaveBeenCalledWith(
				"/test-project",
				{
					local: true,
					force: true,
					type: "next",
					usePnpm: true,
				},
				"next",
			);
			expect(createBiomeConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"next",
				{
					local: true,
					force: true,
					type: "next",
					usePnpm: true,
				},
			);
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/test-project",
				true,
				"with-prettier",
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
			handleDependenciesSpy.mockResolvedValue({
				type: "installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			detectOrSelectProjectTypeSpy.mockResolvedValue("react");

			const result = await initSettingsFile({
				force: true,
				type: "react",
			});

			expect(result).toEqual({ success: true });

			// Verify calls are made in correct order
			expect(handleDependenciesSpy).toHaveBeenCalledWith(
				"/project",
				{
					force: true,
					type: "react",
				},
				"react",
			);
			expect(createBiomeConfigSpy).toHaveBeenCalledWith("/project", "react", {
				force: true,
				type: "react",
			});
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/project",
				true,
				"with-prettier",
			);
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
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "overwritten" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "overwritten" });

			const result = await initSettingsFile({
				local: true,
				force: true,
			});

			expect(result).toEqual({ success: true });

			// Verify force overwrite is configured correctly
			expect(createBiomeConfigSpy).toHaveBeenCalledWith(
				"/existing-project",
				"base",
				{
					local: true,
					force: true,
				},
			);
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/existing-project",
				true,
				"with-prettier",
			);
		});
	});

	describe("initSettingsFile - formatter choice tests", () => {
		it("should pass biome-only when biomeOnly flag is set", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "biome-only",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			await initSettingsFile({
				biomeOnly: true,
			});

			// Should not call promptFormatterChoice when flag is set
			expect(promptFormatterChoiceSpy).not.toHaveBeenCalled();
			// Should pass biome-only to handleDependencies
			expect(handleDependenciesSpy).toHaveBeenCalledWith(
				"/test-project",
				{
					biomeOnly: true,
				},
				"base",
			);
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/test-project",
				undefined,
				"biome-only",
			);
		});

		it("should pass with-prettier when withPrettier flag is set", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			await initSettingsFile({
				withPrettier: true,
			});

			// Should not call promptFormatterChoice when flag is set
			expect(promptFormatterChoiceSpy).not.toHaveBeenCalled();
			// Should pass with-prettier to handleDependencies
			expect(handleDependenciesSpy).toHaveBeenCalledWith(
				"/test-project",
				{
					withPrettier: true,
				},
				"base",
			);
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/test-project",
				undefined,
				"with-prettier",
			);
		});

		it("should prompt for formatter choice when no flags are set", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			await initSettingsFile({});

			// Should call handleDependencies without formatter flags
			expect(handleDependenciesSpy).toHaveBeenCalledWith(
				"/test-project",
				{},
				"base",
			);
			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/test-project",
				undefined,
				"with-prettier",
			);
		});

		it("should handle conflicting formatter flags and return error", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			const result = await initSettingsFile({
				biomeOnly: true,
				withPrettier: true,
			});

			expect(result).toEqual({
				success: false,
				error: "Conflicting formatter flags",
			});
			expect(createVSCodeSettingsSpy).not.toHaveBeenCalled();
		});

		it("should work with force and formatter flags combined", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "biome-only",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			await initSettingsFile({
				force: true,
				biomeOnly: true,
			});

			expect(createVSCodeSettingsSpy).toHaveBeenCalledWith(
				"/test-project",
				true,
				"biome-only",
			);
		});
	});

	describe("initSettingsFile - lefthook integration tests", () => {
		it("should integrate lefthook when --lefthook flag is set", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue("npm");
			createLefthookConfigSpy.mockResolvedValue({ type: "created" });
			addLefthookScriptSpy.mockResolvedValue("success");

			await initSettingsFile({ lefthook: true });

			expect(promptLefthookIntegrationSpy).not.toHaveBeenCalled();
			// Verify lefthook package installation happens first
			expect(packageUtils.hasDependency).toHaveBeenCalledWith(
				{ name: "test-project" },
				"lefthook",
			);
			expect(execSyncMock).toHaveBeenCalledWith(
				"npm i --save-dev lefthook",
				expect.objectContaining({
					cwd: "/test-project",
					stdio: "inherit",
				}),
			);
			expect(logger.success).toHaveBeenCalledWith(
				"lefthook installed successfully!",
			);
			// Then verify lefthook.yml was created (with force=true since it didn't exist before)
			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"npm",
				true, // force=true because file didn't exist before install
			);
			expect(addLefthookScriptSpy).toHaveBeenCalledWith("/test-project");
			expect(runCommand).toHaveBeenCalledWith(
				"npx",
				["lefthook", "install"],
				"/test-project",
			);
			expect(logger.hooksSync).toHaveBeenCalled();
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					lefthook: { status: "success", message: "created" },
				}),
			);
		});

		it("should prompt for lefthook integration when no flag is set", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			promptLefthookIntegrationSpy.mockResolvedValue(true);
			detectPackageManagerSpy.mockReturnValue("pnpm");
			createLefthookConfigSpy.mockResolvedValue({ type: "created" });
			addLefthookScriptSpy.mockResolvedValue("success");

			await initSettingsFile({});

			expect(promptLefthookIntegrationSpy).toHaveBeenCalled();
			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"pnpm",
				true,
			);
			expect(runCommand).toHaveBeenCalledWith(
				"pnpm",
				["exec", "lefthook", "install"],
				"/test-project",
			);
			expect(logger.hooksSync).toHaveBeenCalled();
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					lefthook: { status: "success", message: "created" },
				}),
			);
		});

		it("should skip lefthook when user declines in prompt", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			promptLefthookIntegrationSpy.mockResolvedValue(false);

			await initSettingsFile({});

			expect(promptLefthookIntegrationSpy).toHaveBeenCalled();
			expect(createLefthookConfigSpy).not.toHaveBeenCalled();
			expect(addLefthookScriptSpy).not.toHaveBeenCalled();
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					lefthook: { status: "skipped", message: "skipped" },
				}),
			);
		});

		it("should handle lefthook config creation error", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue("yarn");
			createLefthookConfigSpy.mockResolvedValue({
				type: "error",
				message: "Permission denied",
			});

			await initSettingsFile({ lefthook: true });

			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"yarn",
				true,
			);
			expect(addLefthookScriptSpy).not.toHaveBeenCalled();
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					lefthook: { status: "error", message: "failed" },
				}),
			);
		});

		it("should handle lefthook script addition error", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue("bun");
			createLefthookConfigSpy.mockResolvedValue({ type: "created" });
			addLefthookScriptSpy.mockResolvedValue("error");

			await initSettingsFile({ lefthook: true });

			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"bun",
				true,
			);
			expect(addLefthookScriptSpy).toHaveBeenCalledWith("/test-project");
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					lefthook: { status: "error", message: "script failed" },
				}),
			);
		});

		it("should overwrite lefthook.yml with force flag", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
				"/test-project/lefthook.yml": "existing content",
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue("npm");
			createLefthookConfigSpy.mockResolvedValue({ type: "overwritten" });
			addLefthookScriptSpy.mockResolvedValue("success");

			await initSettingsFile({ lefthook: true, force: true });

			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"npm",
				true,
			);
			expect(runCommand).toHaveBeenCalledWith(
				"npx",
				["lefthook", "install"],
				"/test-project",
			);
			expect(logger.hooksSync).toHaveBeenCalled();
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					lefthook: { status: "success", message: "overwritten" },
				}),
			);
		});

		it("should skip lefthook package install when already installed", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({
					name: "test-project",
					devDependencies: { lefthook: "^1.5.0" },
				}),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue("npm");
			createLefthookConfigSpy.mockResolvedValue({ type: "created" });
			addLefthookScriptSpy.mockResolvedValue("success");
			// Mock that lefthook is already installed
			vi.spyOn(packageUtils, "hasDependency").mockReturnValue(true);

			await initSettingsFile({ lefthook: true });

			// Should check for existing dependency
			expect(packageUtils.hasDependency).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "test-project",
				}),
				"lefthook",
			);
			// Should NOT install lefthook
			expect(execSyncMock).not.toHaveBeenCalled();
			// Should show "already installed" message
			expect(logger.info).toHaveBeenCalledWith(
				"lefthook is already installed.",
			);
			// Should still create config (with force=true since file didn't exist before)
			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"npm",
				true, // force=true because file didn't exist before
			);
		});

		it("should skip prompt when formatter flags are set", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });

			await initSettingsFile({ biomeOnly: true });

			expect(promptLefthookIntegrationSpy).not.toHaveBeenCalled();
			expect(createLefthookConfigSpy).not.toHaveBeenCalled();
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					lefthook: { status: "skipped", message: "skipped" },
				}),
			);
		});

		it("should use default npm when package manager detection returns null", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue(null);
			createLefthookConfigSpy.mockResolvedValue({ type: "created" });
			addLefthookScriptSpy.mockResolvedValue("success");

			await initSettingsFile({ lefthook: true });

			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"npm",
				true,
			);
			expect(runCommand).toHaveBeenCalledWith(
				"npx",
				["lefthook", "install"],
				"/test-project",
			);
			expect(logger.hooksSync).toHaveBeenCalled();
		});

		it("should use yarn exec for yarn package manager", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue("yarn");
			createLefthookConfigSpy.mockResolvedValue({ type: "created" });
			addLefthookScriptSpy.mockResolvedValue("success");

			await initSettingsFile({ lefthook: true });

			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"yarn",
				true,
			);
			expect(runCommand).toHaveBeenCalledWith(
				"yarn",
				["exec", "lefthook", "install"],
				"/test-project",
			);
		});

		it("should use pnpm exec for pnpm package manager", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue("pnpm");
			createLefthookConfigSpy.mockResolvedValue({ type: "created" });
			addLefthookScriptSpy.mockResolvedValue("success");

			await initSettingsFile({ lefthook: true });

			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"pnpm",
				true,
			);
			expect(runCommand).toHaveBeenCalledWith(
				"pnpm",
				["exec", "lefthook", "install"],
				"/test-project",
			);
		});

		it("should use bunx for bun package manager", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue("bun");
			createLefthookConfigSpy.mockResolvedValue({ type: "created" });
			addLefthookScriptSpy.mockResolvedValue("success");

			await initSettingsFile({ lefthook: true });

			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"bun",
				true,
			);
			expect(runCommand).toHaveBeenCalledWith(
				"bunx",
				["--bun", "lefthook", "install"],
				"/test-project",
			);
		});

		it("should prompt for lefthook overwrite when file exists and no force flag", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
				"/test-project/lefthook.yml": "existing content",
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue("npm");
			createLefthookConfigSpy.mockResolvedValue({ type: "overwritten" });
			addLefthookScriptSpy.mockResolvedValue("success");

			await initSettingsFile({ lefthook: true });

			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"npm",
				undefined,
			);
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					lefthook: { status: "success", message: "overwritten" },
				}),
			);
		});

		it("should skip lefthook when user declines overwrite prompt", async () => {
			vol.fromJSON({
				"/test-project/.git": null,
				"/test-project/package.json": JSON.stringify({ name: "test-project" }),
				"/test-project/lefthook.yml": "existing content",
			});

			findGitRootSpy.mockReturnValue("/test-project");
			handleDependenciesSpy.mockResolvedValue({
				type: "already-installed",
				formatterChoice: "with-prettier",
			});
			createBiomeConfigSpy.mockResolvedValue({ type: "created" });
			createVSCodeSettingsSpy.mockResolvedValue({ type: "created" });
			detectPackageManagerSpy.mockReturnValue("npm");
			createLefthookConfigSpy.mockResolvedValue({ type: "skipped" });

			await initSettingsFile({ lefthook: true });

			expect(createLefthookConfigSpy).toHaveBeenCalledWith(
				"/test-project",
				"npm",
				undefined,
			);
			expect(addLefthookScriptSpy).not.toHaveBeenCalled();
			expect(summary.showSetupSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					lefthook: { status: "skipped", message: "skipped" },
				}),
			);
		});
	});
});
