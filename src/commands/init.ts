import path from "node:path";
import { DEPENDENCIES, MESSAGES } from "../constants";
import {
	createBiomeConfig,
	detectOrSelectProjectType,
} from "../core/biome-config";
import { handleDependencies } from "../core/dependencies";
import { addLefthookScript, createLefthookConfig } from "../core/lefthook";
import { addBiomeScripts } from "../core/scripts";
import { showSetupSummary } from "../core/summary";
import { createVSCodeSettings } from "../core/vscode-settings";
import type { InitOptions, InitResult, TaskResult } from "../types/index";
import { fileExists } from "../utils/file";
import { findGitRoot } from "../utils/git";
import { logger } from "../utils/logger";
import { createSpinner, runCommand } from "../utils/npm-command";
import { hasDependency, readUserPackageJson } from "../utils/package";
import {
	detectPackageManager,
	getInstallCommand,
	getLefthookInstallCommand,
	validatePackageManagerChoice,
} from "../utils/package-manager";
import { promptLefthookIntegration } from "../utils/prompt";

const determineBaseDir = (options: InitOptions): string | null => {
	if (options.local) {
		logger.info(MESSAGES.INFO.USING_LOCAL);
		return process.cwd();
	}

	const gitRoot = findGitRoot(process.cwd());
	if (!gitRoot) {
		logger.error(MESSAGES.ERROR.NOT_IN_GIT);
		logger.error(MESSAGES.ERROR.GIT_ROOT_NOT_FOUND);
		logger.error(MESSAGES.ERROR.USE_LOCAL_OPTION);
		return null;
	}

	logger.info(MESSAGES.INFO.FOUND_GIT_ROOT(gitRoot));
	return gitRoot;
};

export const initSettingsFile = async (
	options: InitOptions,
): Promise<InitResult> => {
	const baseDir = determineBaseDir(options);
	if (!baseDir) {
		return { success: false, error: "Git repository not found" };
	}

	const tasks: TaskResult = {
		dependencies: { status: "skipped" },
		biomeConfig: { status: "skipped" },
		scripts: { status: "skipped" },
		settingsFile: { status: "skipped" },
		lefthook: { status: "skipped" },
	};

	// Validate package manager choice early
	try {
		validatePackageManagerChoice({
			useNpm: options.useNpm,
			useYarn: options.useYarn,
			usePnpm: options.usePnpm,
			useBun: options.useBun,
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(errorMessage);
		return { success: false, error: errorMessage };
	}

	// Check for conflicting formatter flags early
	if (options.biomeOnly && options.withPrettier) {
		logger.error(
			"Cannot use both --biome-only and --with-prettier flags together",
		);
		return { success: false, error: "Conflicting formatter flags" };
	}

	// Detect or select project type early (but don't display yet)
	const projectType = await detectOrSelectProjectType(baseDir, options);

	// Always handle dependencies first (unless skipped)
	// Project type will be displayed after package manager detection inside handleDependencies
	const depResult = await handleDependencies(baseDir, options, projectType);

	// Extract formatter choice from depResult
	let formatterChoice: "biome-only" | "with-prettier" | undefined;
	if (
		depResult.type === "already-installed" ||
		depResult.type === "installed" ||
		(depResult.type === "skipped" && depResult.formatterChoice)
	) {
		formatterChoice = depResult.formatterChoice ?? undefined;
	}

	switch (depResult.type) {
		case "already-installed":
			tasks.dependencies = { status: "success", message: "already installed" };
			break;
		case "installed":
			tasks.dependencies = { status: "success", message: "installed" };
			break;
		case "skipped":
		case "no-package-json":
			tasks.dependencies = { status: "skipped", message: "skipped" };
			break;
		case "error":
			tasks.dependencies = { status: "error", message: "failed" };
			break;
		default:
			depResult satisfies never;
	}

	// Create biome.json
	const biomeResult = await createBiomeConfig(baseDir, projectType, options);
	switch (biomeResult.type) {
		case "created":
			tasks.biomeConfig = { status: "success", message: "created" };
			break;
		case "overwritten":
			tasks.biomeConfig = { status: "success", message: "overwritten" };
			break;
		case "skipped":
			tasks.biomeConfig = { status: "skipped", message: "skipped" };
			break;
		case "error":
			tasks.biomeConfig = { status: "error", message: "failed" };
			break;
		default:
			biomeResult satisfies never;
	}

	// Add Biome scripts to package.json (only if package.json exists)
	const packageJsonPath = path.join(baseDir, "package.json");
	if (fileExists(packageJsonPath)) {
		const scriptsResult = await addBiomeScripts(baseDir);
		tasks.scripts = {
			status: scriptsResult === "success" ? "success" : "error",
			message: scriptsResult === "success" ? "added" : "failed",
		};
	} else {
		tasks.scripts = {
			status: "skipped",
			message: "package.json not found",
		};
	}

	// Create .vscode/settings.json
	const settingsResult = await createVSCodeSettings(
		baseDir,
		options.force,
		formatterChoice,
	);
	switch (settingsResult.type) {
		case "created":
			tasks.settingsFile = { status: "success", message: "created" };
			break;
		case "overwritten":
			tasks.settingsFile = { status: "success", message: "overwritten" };
			break;
		case "skipped":
			tasks.settingsFile = { status: "skipped", message: "skipped" };
			break;
		case "error":
			tasks.settingsFile = { status: "error", message: "failed" };
			break;
		default:
			settingsResult satisfies never;
	}

	// Integrate lefthook
	let shouldIntegrateLefthook = options.lefthook;
	if (
		shouldIntegrateLefthook === undefined &&
		!options.biomeOnly &&
		!options.withPrettier
	) {
		shouldIntegrateLefthook = await promptLefthookIntegration();
	}

	if (shouldIntegrateLefthook) {
		const packageManager = detectPackageManager(baseDir) || "npm";

		// Step 1: Check if lefthook.yml already exists (before installation)
		// This helps us distinguish between user-created and auto-generated configs
		const lefthookPath = path.join(baseDir, "lefthook.yml");
		const existedBeforeInstall = fileExists(lefthookPath);

		// Step 2: Install lefthook package if needed
		// This may create a default lefthook.yml if one doesn't exist
		if (fileExists(packageJsonPath)) {
			const packageJson = readUserPackageJson(baseDir);
			if (packageJson) {
				if (!hasDependency(packageJson, DEPENDENCIES.LEFTHOOK)) {
					logger.info(MESSAGES.INFO.INSTALLING_LEFTHOOK);
					try {
						const installCommands = getInstallCommand(packageManager, [
							DEPENDENCIES.LEFTHOOK,
						]);
						// Use execSync to preserve package manager's native output (progress, colors)
						const { execSync } = await import("node:child_process");
						for (const command of installCommands) {
							execSync(command, {
								cwd: baseDir,
								stdio: "inherit",
							});
						}
						logger.success(MESSAGES.INFO.LEFTHOOK_INSTALLED_SUCCESS);
					} catch (error) {
						logger.error(
							MESSAGES.ERROR.LEFTHOOK_INSTALL_FAILED,
							error instanceof Error ? error.message : "Unknown error",
						);
						tasks.lefthook = { status: "error", message: "install failed" };
					}
				} else {
					logger.info(MESSAGES.INFO.LEFTHOOK_ALREADY_INSTALLED);
				}
			}
		}

		// Step 3: Create/overwrite lefthook.yml with our template
		// If the file didn't exist before install, force overwrite any auto-generated config
		// If it existed before, respect the force flag (ask for confirmation if not forced)
		const effectiveForce = existedBeforeInstall ? options.force : true;
		const lefthookResult = await createLefthookConfig(
			baseDir,
			packageManager,
			effectiveForce,
		);

		switch (lefthookResult.type) {
			case "created":
				tasks.lefthook = { status: "success", message: "created" };
				break;
			case "overwritten":
				tasks.lefthook = { status: "success", message: "overwritten" };
				break;
			case "skipped":
				tasks.lefthook = { status: "skipped", message: "skipped" };
				break;
			case "error":
				tasks.lefthook = { status: "error", message: "failed" };
				break;
			default:
				lefthookResult satisfies never;
		}

		if (lefthookResult.type !== "error" && lefthookResult.type !== "skipped") {
			// Only add lefthook script if package.json exists
			if (fileExists(packageJsonPath)) {
				const scriptResult = await addLefthookScript(baseDir);
				if (scriptResult === "error" && tasks.lefthook.status === "success") {
					tasks.lefthook = { status: "error", message: "script failed" };
				} else if (scriptResult === "success") {
					// Execute lefthook install to set up Git hooks
					// Use spawn (via runCommand) with spinner for better UX on Windows where
					// lefthook install may have initial lag before showing output
					const spinner = createSpinner("Installing Git hooks...");
					try {
						const { command, args } = getLefthookInstallCommand(packageManager);

						spinner.start();
						await runCommand(command, args, baseDir);
						spinner.succeed("Git hooks installed");
						logger.hooksSync();
					} catch (error) {
						spinner.fail("Failed to install Git hooks");
						logger.warning(
							"Please run 'lefthook install' manually to set up Git hooks",
						);
						if (error instanceof Error) {
							logger.warning(`Details: ${error.message}`);
						}
					}
				}
			}
		}
	} else {
		tasks.lefthook = { status: "skipped", message: "skipped" };
	}

	// Show setup summary
	showSetupSummary(tasks);

	// Return success: true if at least one task succeeded
	const hasSuccess = Object.values(tasks).some(
		(task) => task.status === "success",
	);
	return { success: hasSuccess };
};
