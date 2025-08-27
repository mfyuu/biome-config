import { grey } from "kleur/colors";
import { DEPENDENCIES, MESSAGES } from "../constants";
import type { FormatterChoice, InitOptions } from "../types/index";
import { logger } from "../utils/logger";
import { hasDependency, readUserPackageJson } from "../utils/package";
import {
	detectPackageManager,
	getInstallCommand,
	type PackageManager,
	validatePackageManagerChoice,
} from "../utils/package-manager";
import {
	promptFormatterChoice,
	promptInstallDependencies,
	promptPackageManager,
} from "../utils/prompt";

type DependencyResult =
	| { type: "already-installed"; formatterChoice: FormatterChoice }
	| { type: "installed"; formatterChoice: FormatterChoice }
	| { type: "skipped"; formatterChoice: FormatterChoice | null }
	| { type: "no-package-json"; formatterChoice: null }
	| { type: "error"; message: string; formatterChoice: FormatterChoice | null };

export const handleDependencies = async (
	baseDir: string,
	options: InitOptions,
): Promise<DependencyResult> => {
	if (options.skipDeps) {
		logger.info(MESSAGES.INFO.SKIP_DEPS);
		// Still determine formatter choice even when skipping deps
		let formatterChoice: FormatterChoice | null = null;
		if (options.biomeOnly) {
			formatterChoice = "biome-only";
		} else if (options.withPrettier) {
			formatterChoice = "with-prettier";
		}
		return { type: "skipped", formatterChoice };
	}

	const packageJson = readUserPackageJson(baseDir);
	if (!packageJson) {
		logger.warning(MESSAGES.WARNING.PACKAGE_JSON_NOT_FOUND);
		logger.info(MESSAGES.INFO.NO_PACKAGE_JSON);
		logger.code("npm init -y");
		return { type: "no-package-json", formatterChoice: null };
	}

	// First check existing dependencies
	const basePackages = [DEPENDENCIES.BIOME, DEPENDENCIES.CONFIG];
	const existingBaseDeps: string[] = [];
	for (const packageName of basePackages) {
		if (hasDependency(packageJson, packageName)) {
			existingBaseDeps.push(packageName);
		}
	}

	if (existingBaseDeps.length > 0) {
		logger.info(MESSAGES.INFO.DEPS_ALREADY_INSTALLED(existingBaseDeps));
	}

	// Detect or select package manager
	let packageManager: PackageManager | null;
	try {
		packageManager = validatePackageManagerChoice({
			useNpm: options.useNpm,
			useYarn: options.useYarn,
			usePnpm: options.usePnpm,
			useBun: options.useBun,
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(errorMessage);
		return { type: "error", message: errorMessage, formatterChoice: null };
	}

	if (!packageManager) {
		packageManager = detectPackageManager(baseDir);
		if (packageManager) {
			logger.info(MESSAGES.INFO.PACKAGE_MANAGER_DETECTED(packageManager));
		} else {
			packageManager = await promptPackageManager();
		}
	}

	// Determine formatter choice after showing package manager info
	let formatterChoice: FormatterChoice;
	if (options.biomeOnly) {
		formatterChoice = "biome-only";
	} else if (options.withPrettier) {
		formatterChoice = "with-prettier";
	} else {
		// Add blank line before formatter prompt for better visual separation
		console.log();
		// Prompt for formatter choice
		formatterChoice = await promptFormatterChoice();
	}

	// Now determine all required packages based on formatter choice
	const requiredPackages: string[] = [DEPENDENCIES.BIOME, DEPENDENCIES.CONFIG];
	if (formatterChoice === "with-prettier") {
		requiredPackages.push(DEPENDENCIES.PRETTIER);
	}

	// Check what's missing
	const missingPackages: string[] = [];
	for (const packageName of requiredPackages) {
		if (!hasDependency(packageJson, packageName)) {
			missingPackages.push(packageName);
		}
	}

	if (missingPackages.length === 0) {
		return { type: "already-installed", formatterChoice };
	}

	try {
		const installCommands = getInstallCommand(packageManager, missingPackages);

		// Ask user if they want to install dependencies
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
				return { type: "installed", formatterChoice };
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
				return {
					type: "error",
					message: "Failed to install dependencies",
					formatterChoice,
				};
			}
		}
		logger.info(MESSAGES.INFO.RUN_INSTALL_MANUALLY);
		console.log();
		for (const command of installCommands) {
			console.log(grey(`  $ ${command}`));
		}
		console.log();
		return { type: "skipped", formatterChoice };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(MESSAGES.ERROR.DEPS_INSTALL_FAILED, errorMessage);
		return { type: "error", message: errorMessage, formatterChoice };
	}
};
