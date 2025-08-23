import path from "node:path";
import { DEPENDENCIES, MESSAGES, PATHS } from "../constants.js";
import {
	copyFile,
	createDirectory,
	fileExists,
	getTemplatePath,
} from "../utils/file.js";
import { findGitRoot } from "../utils/git.js";
import { logger } from "../utils/logger.js";
import { hasDependency, readUserPackageJson } from "../utils/package.js";
import {
	detectPackageManager,
	getInstallCommand,
	type PackageManager,
	validatePackageManagerChoice,
} from "../utils/package-manager.js";
import { promptPackageManager } from "../utils/prompt.js";

interface InitOptions {
	force?: boolean;
	local?: boolean;
	skipDeps?: boolean;
	useNpm?: boolean;
	useYarn?: boolean;
	usePnpm?: boolean;
	useBun?: boolean;
}

interface InitResult {
	success: boolean;
	targetPath?: string;
	error?: string;
}

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

const handleDependencies = async (
	baseDir: string,
	options: InitOptions,
): Promise<void> => {
	if (options.skipDeps) {
		logger.info(MESSAGES.INFO.SKIP_DEPS);
		return;
	}

	const packageJson = readUserPackageJson(baseDir);
	if (!packageJson) {
		logger.warning(MESSAGES.WARNING.PACKAGE_JSON_NOT_FOUND);
		logger.info(MESSAGES.INFO.NO_PACKAGE_JSON);
		logger.info("  npm init -y");
		return;
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
		return;
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
		logger.info(MESSAGES.INFO.INSTALLING_DEPS(missingPackages));

		try {
			const { execSync } = await import("node:child_process");
			execSync(installCommand, {
				cwd: baseDir,
				stdio: "inherit",
			});
			logger.info(MESSAGES.INFO.DEPS_INSTALLED_SUCCESS);
		} catch (execError) {
			logger.error(
				MESSAGES.ERROR.DEPS_INSTALL_EXEC_FAILED,
				execError instanceof Error ? execError.message : "Unknown error",
			);
			logger.info(MESSAGES.INFO.RUN_INSTALL_MANUALLY(installCommand));
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(MESSAGES.ERROR.DEPS_INSTALL_FAILED, errorMessage);
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

	// Always handle dependencies first (unless skipped)
	await handleDependencies(baseDir, options);

	// Check if settings.json already exists
	const fileAlreadyExists = fileExists(targetPath);
	if (fileAlreadyExists && !options.force) {
		logger.warning(MESSAGES.WARNING.FILE_EXISTS);
		logger.warning(MESSAGES.WARNING.USE_FORCE);
		// Return success: true since dependencies may have been added
		return { success: true, targetPath };
	}

	try {
		const templatePath = getTemplatePath(
			path.join(PATHS.VSCODE_DIR, PATHS.SETTINGS_FILE),
		);

		createDirectory(vscodeDir);
		copyFile(templatePath, targetPath);

		if (options.force && fileAlreadyExists) {
			logger.info(MESSAGES.INFO.OVERWRITE_SUCCESS);
		} else {
			logger.info(MESSAGES.INFO.CREATE_SUCCESS);
		}
		logger.info(MESSAGES.INFO.LOCATION(targetPath));

		return { success: true, targetPath };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(MESSAGES.ERROR.CREATE_FAILED, errorMessage);
		return { success: false, error: errorMessage };
	}
};
