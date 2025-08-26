import { grey } from "kleur/colors";
import { DEPENDENCIES, MESSAGES } from "../constants";
import type { InitOptions } from "../types/index";
import { logger } from "../utils/logger";
import { hasDependency, readUserPackageJson } from "../utils/package";
import {
	detectPackageManager,
	getInstallCommand,
	type PackageManager,
	validatePackageManagerChoice,
} from "../utils/package-manager";
import {
	promptInstallDependencies,
	promptPackageManager,
} from "../utils/prompt";

type DependencyResult =
	| { type: "already-installed" }
	| { type: "installed" }
	| { type: "skipped" }
	| { type: "no-package-json" }
	| { type: "error"; message: string };

export const handleDependencies = async (
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

		const installCommands = getInstallCommand(packageManager, missingPackages);

		// Ask user if they want to install dependencies
		console.log();
		const shouldInstall = await promptInstallDependencies(missingPackages);

		if (shouldInstall) {
			logger.info(MESSAGES.INFO.INSTALLING_DEPS(missingPackages));

			try {
				const { execSync } = await import("node:child_process");
				// Execute each install command
				for (const command of installCommands) {
					execSync(command, {
						cwd: baseDir,
						stdio: "inherit",
					});
				}
				logger.success(MESSAGES.INFO.DEPS_INSTALLED_SUCCESS);
				return { type: "installed" };
			} catch (execError) {
				logger.error(
					MESSAGES.ERROR.DEPS_INSTALL_EXEC_FAILED,
					execError instanceof Error ? execError.message : "Unknown error",
				);
				logger.info(MESSAGES.INFO.RUN_INSTALL_MANUALLY);
				console.log();
				for (const command of installCommands) {
					console.log(grey(`  $ ${command}`));
				}
				console.log();
				return { type: "error", message: "Failed to install dependencies" };
			}
		}
		logger.info(MESSAGES.INFO.RUN_INSTALL_MANUALLY);
		console.log();
		for (const command of installCommands) {
			console.log(grey(`  $ ${command}`));
		}
		console.log();
		return { type: "skipped" };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(MESSAGES.ERROR.DEPS_INSTALL_FAILED, errorMessage);
		return { type: "error", message: errorMessage };
	}
};
