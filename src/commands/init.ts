import path from "node:path";
import { green, red, yellow } from "kleur/colors";
import logSymbols from "log-symbols";
import {
	DEFAULT_BIOME_EXTENSION,
	DEPENDENCIES,
	MESSAGES,
	PATHS,
	type ProjectType,
} from "../constants.js";
import {
	copyFile,
	createDirectory,
	fileExists,
	findBiomeConfig,
	getTemplatePath,
} from "../utils/file.js";
import { findGitRoot } from "../utils/git.js";
import { logger } from "../utils/logger.js";
import {
	detectProjectType,
	hasDependency,
	readUserPackageJson,
} from "../utils/package.js";
import {
	detectPackageManager,
	getInstallCommand,
	type PackageManager,
	validatePackageManagerChoice,
} from "../utils/package-manager.js";
import {
	promptBiomeOverwriteConfirmation,
	promptInstallDependencies,
	promptOverwriteConfirmation,
	promptPackageManager,
	promptProjectType,
} from "../utils/prompt.js";

interface InitOptions {
	force?: boolean;
	local?: boolean;
	skipDeps?: boolean;
	useNpm?: boolean;
	useYarn?: boolean;
	usePnpm?: boolean;
	useBun?: boolean;
	type?: ProjectType;
}

interface InitResult {
	success: boolean;
	targetPath?: string;
	error?: string;
}

type TaskStatus = "success" | "error" | "skipped";

interface TaskResultDetail {
	status: TaskStatus;
	message?: string;
}

interface TaskResult {
	dependencies: TaskResultDetail;
	biomeConfig: TaskResultDetail;
	settingsFile: TaskResultDetail;
}

type DependencyResult =
	| { type: "already-installed" }
	| { type: "installed" }
	| { type: "skipped" }
	| { type: "no-package-json" }
	| { type: "error"; message: string };

type BiomeConfigResult =
	| { type: "created" }
	| { type: "overwritten" }
	| { type: "skipped" }
	| { type: "error"; message: string };

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

const createBiomeConfig = async (
	baseDir: string,
	options: InitOptions,
): Promise<BiomeConfigResult> => {
	// Check if biome.json or biome.jsonc already exists
	const existingBiomeConfig = findBiomeConfig(baseDir);

	// Determine the target file path
	// If existing file found, use its path; otherwise create biome.jsonc
	const biomeFilePath =
		existingBiomeConfig || path.join(baseDir, PATHS.BIOME_FILE_JSONC);

	// Determine project type
	let projectType: ProjectType;
	if (options.type) {
		// Use explicitly specified type
		projectType = options.type;
		logger.info(MESSAGES.INFO.PROJECT_TYPE_SELECTED(projectType));
	} else {
		// Auto-detect or prompt for project type
		const packageJson = readUserPackageJson(baseDir);
		const detectedType = detectProjectType(packageJson);

		if (detectedType) {
			projectType = detectedType;
			logger.info(MESSAGES.INFO.PROJECT_TYPE_DETECTED(projectType));
		} else {
			// No package.json or couldn't detect, prompt user
			projectType = await promptProjectType();
			logger.info(MESSAGES.INFO.PROJECT_TYPE_SELECTED(projectType));
		}
	}

	// Check if biome config already exists
	if (existingBiomeConfig && !options.force) {
		// Ask user if they want to overwrite
		const shouldOverwrite = await promptBiomeOverwriteConfirmation();
		if (!shouldOverwrite) {
			logger.warning(MESSAGES.WARNING.BIOME_FILE_EXISTS);
			logger.warning(MESSAGES.WARNING.USE_FORCE);
			return { type: "skipped" };
		}
	}

	try {
		// Determine template extension based on existing file or use jsonc for new files
		const templateExtension = existingBiomeConfig
			? path.extname(existingBiomeConfig) // Use existing file's extension
			: DEFAULT_BIOME_EXTENSION; // Default to .jsonc for new files (with comments)

		// Get the appropriate template path
		const templateFileName = `${projectType}${templateExtension}`;
		const templatePath = getTemplatePath(
			path.join(PATHS.BIOME_TEMPLATES_DIR, templateFileName),
		);

		// Copy template to destination
		copyFile(templatePath, biomeFilePath);

		if (existingBiomeConfig) {
			logger.success(MESSAGES.INFO.BIOME_OVERWRITE_SUCCESS);
			logger.info(MESSAGES.INFO.LOCATION(biomeFilePath));
			return { type: "overwritten" };
		} else {
			logger.success(MESSAGES.INFO.BIOME_CREATE_SUCCESS);
			logger.info(MESSAGES.INFO.LOCATION(biomeFilePath));
			return { type: "created" };
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(MESSAGES.ERROR.BIOME_CREATE_FAILED, errorMessage);
		return { type: "error", message: errorMessage };
	}
};

const handleDependencies = async (
	baseDir: string,
	options: InitOptions,
): Promise<DependencyResult> => {
	if (options.skipDeps) {
		logger.info(MESSAGES.INFO.SKIP_DEPS);
		return { type: "skipped" };
	}

	const packageJson = readUserPackageJson(baseDir);
	if (!packageJson) {
		logger.warning(MESSAGES.WARNING.PACKAGE_JSON_NOT_FOUND);
		logger.info(MESSAGES.INFO.NO_PACKAGE_JSON);
		logger.code("npm init -y");
		return { type: "no-package-json" };
	}

	const requiredPackages = [DEPENDENCIES.BIOME, DEPENDENCIES.CONFIG];
	const missingPackages: string[] = [];
	const existingDeps: string[] = [];

	for (const packageName of requiredPackages) {
		if (hasDependency(packageJson, packageName)) {
			existingDeps.push(packageName);
		} else {
			missingPackages.push(packageName);
		}
	}

	if (existingDeps.length > 0) {
		logger.info(MESSAGES.INFO.DEPS_ALREADY_INSTALLED(existingDeps));
	}

	if (missingPackages.length === 0) {
		return { type: "already-installed" };
	}

	try {
		let packageManager: PackageManager | null = validatePackageManagerChoice({
			useNpm: options.useNpm,
			useYarn: options.useYarn,
			usePnpm: options.usePnpm,
			useBun: options.useBun,
		});

		if (!packageManager) {
			packageManager = detectPackageManager(baseDir);
			if (packageManager) {
				logger.info(MESSAGES.INFO.PACKAGE_MANAGER_DETECTED(packageManager));
			} else {
				packageManager = await promptPackageManager();
			}
		}

		const installCommand = getInstallCommand(packageManager, missingPackages);

		// Ask user if they want to install dependencies
		console.log();
		const shouldInstall = await promptInstallDependencies(missingPackages);

		if (shouldInstall) {
			logger.info(MESSAGES.INFO.INSTALLING_DEPS(missingPackages));

			try {
				const { execSync } = await import("node:child_process");
				execSync(installCommand, {
					cwd: baseDir,
					stdio: "inherit",
				});
				logger.success(MESSAGES.INFO.DEPS_INSTALLED_SUCCESS);
				return { type: "installed" };
			} catch (execError) {
				logger.error(
					MESSAGES.ERROR.DEPS_INSTALL_EXEC_FAILED,
					execError instanceof Error ? execError.message : "Unknown error",
				);
				logger.info(MESSAGES.INFO.RUN_INSTALL_MANUALLY);
				logger.code(installCommand);
				return { type: "error", message: "Failed to install dependencies" };
			}
		} else {
			logger.info(MESSAGES.INFO.RUN_INSTALL_MANUALLY);
			logger.code(installCommand);
			return { type: "skipped" };
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(MESSAGES.ERROR.DEPS_INSTALL_FAILED, errorMessage);
		return { type: "error", message: errorMessage };
	}
};

const showSetupSummary = (tasks: TaskResult): void => {
	logger.finalSuccess(MESSAGES.INFO.SETUP_COMPLETE);

	const statusIcon = (status: TaskStatus): string => {
		switch (status) {
			case "success":
				return logSymbols.success;
			case "error":
				return logSymbols.error;
			case "skipped":
				return logSymbols.warning;
		}
	};

	const items = [
		{
			name: "Dependencies",
			status: tasks.dependencies.status,
			message: tasks.dependencies.message,
		},
		{
			name: "biome.json",
			status: tasks.biomeConfig.status,
			message: tasks.biomeConfig.message,
		},
		{
			name: ".vscode/settings.json",
			status: tasks.settingsFile.status,
			message: tasks.settingsFile.message,
		},
	];

	// Count completed tasks
	const completedCount = items.filter(
		(item) => item.status === "success",
	).length;
	const totalCount = items.length;

	// Create progress bar
	const barWidth = 20;
	const filledWidth = Math.round((completedCount / totalCount) * barWidth);
	const emptyWidth = barWidth - filledWidth;
	const progressBar = `[${green("█".repeat(filledWidth))}${"░".repeat(emptyWidth)}]`;

	// Create summary header with progress
	console.log(`  ${progressBar} ${completedCount}/${totalCount} completed`);
	console.log();

	// List items with their status
	for (const item of items) {
		const icon = statusIcon(item.status);
		const statusText = item.message
			? item.status === "skipped"
				? yellow(`(${item.message})`)
				: item.status === "error"
					? red(`(${item.message})`)
					: green(`(${item.message})`)
			: "";

		console.log(`  ${icon} ${item.name} ${statusText}`);
	}
};

export const initSettingsFile = async (
	options: InitOptions,
): Promise<InitResult> => {
	const baseDir = determineBaseDir(options);
	if (!baseDir) {
		return { success: false, error: "Git repository not found" };
	}

	const vscodeDir = path.join(baseDir, PATHS.VSCODE_DIR);
	const targetPath = path.join(vscodeDir, PATHS.SETTINGS_FILE);
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
	}

	// Check if settings.json already exists
	const fileAlreadyExists = fileExists(targetPath);
	if (fileAlreadyExists && !options.force) {
		// Ask user if they want to overwrite
		const shouldOverwrite = await promptOverwriteConfirmation();
		if (!shouldOverwrite) {
			logger.warning(MESSAGES.WARNING.FILE_EXISTS);
			logger.warning(MESSAGES.WARNING.USE_FORCE);
			tasks.settingsFile = { status: "skipped", message: "skipped" };
			// Show setup summary
			showSetupSummary(tasks);
			// Return success: true since dependencies may have been added
			return { success: true, targetPath };
		}
		// User chose to overwrite, continue with the file creation
	}

	try {
		const templatePath = getTemplatePath(
			path.join(PATHS.VSCODE_DIR, PATHS.SETTINGS_FILE),
		);

		createDirectory(vscodeDir);
		copyFile(templatePath, targetPath);

		if (fileAlreadyExists) {
			logger.success(MESSAGES.INFO.OVERWRITE_SUCCESS);
			tasks.settingsFile = { status: "success", message: "overwritten" };
		} else {
			logger.success(MESSAGES.INFO.CREATE_SUCCESS);
			tasks.settingsFile = { status: "success", message: "created" };
		}
		logger.info(MESSAGES.INFO.LOCATION(targetPath));
		// Show setup summary
		showSetupSummary(tasks);

		return { success: true, targetPath };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(MESSAGES.ERROR.CREATE_FAILED, errorMessage);
		return { success: false, error: errorMessage };
	}
};
