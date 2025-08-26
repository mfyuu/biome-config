import { MESSAGES } from "../constants";
import { createBiomeConfig } from "../core/biome-config";
import { handleDependencies } from "../core/dependencies";
import { showSetupSummary } from "../core/summary";
import { createVSCodeSettings } from "../core/vscode-settings";
import type { InitOptions, InitResult, TaskResult } from "../types/index";
import { findGitRoot } from "../utils/git";
import { logger } from "../utils/logger";

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
		settingsFile: { status: "skipped" },
	};

	// Always handle dependencies first (unless skipped)
	const depResult = await handleDependencies(baseDir, options);
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
	const biomeResult = await createBiomeConfig(baseDir, options);
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

	// Create .vscode/settings.json
	const settingsResult = await createVSCodeSettings(baseDir, options.force);
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

	// Show setup summary
	showSetupSummary(tasks);

	// Return success: true if at least one task succeeded
	const hasSuccess = Object.values(tasks).some(
		(task) => task.status === "success",
	);
	return { success: hasSuccess };
};
