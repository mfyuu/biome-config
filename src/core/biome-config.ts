import path from "node:path";
import {
	DEFAULT_BIOME_EXTENSION,
	MESSAGES,
	PATHS,
	type ProjectType,
} from "../constants";
import type { InitOptions } from "../types/index";
import { copyFile, findBiomeConfig, getTemplatePath } from "../utils/file";
import { logger } from "../utils/logger";
import { detectProjectType, readUserPackageJson } from "../utils/package";
import {
	promptBiomeOverwriteConfirmation,
	promptProjectType,
} from "../utils/prompt";

type BiomeConfigResult =
	| { type: "created" }
	| { type: "overwritten" }
	| { type: "skipped" }
	| { type: "error"; message: string };

export const detectOrSelectProjectType = async (
	baseDir: string,
	options: InitOptions,
): Promise<ProjectType> => {
	if (options.type) {
		// Use explicitly specified type
		return options.type;
	}

	// Auto-detect or prompt for project type
	const packageJson = readUserPackageJson(baseDir);
	const detectedType = detectProjectType(packageJson);

	if (detectedType) {
		return detectedType;
	}

	// No package.json or couldn't detect, prompt user
	const projectType = await promptProjectType();
	return projectType;
};

export const createBiomeConfig = async (
	baseDir: string,
	projectType: ProjectType,
	options: InitOptions,
): Promise<BiomeConfigResult> => {
	// Check if biome.json or biome.jsonc already exists
	const existingBiomeConfig = findBiomeConfig(baseDir);

	// Determine the target file path
	// If existing file found, use its path; otherwise create biome.jsonc
	const biomeFilePath =
		existingBiomeConfig || path.join(baseDir, PATHS.BIOME_FILE_JSONC);

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
		}
		logger.success(MESSAGES.INFO.BIOME_CREATE_SUCCESS);
		logger.info(MESSAGES.INFO.LOCATION(biomeFilePath));
		return { type: "created" };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(MESSAGES.ERROR.BIOME_CREATE_FAILED, errorMessage);
		return { type: "error", message: errorMessage };
	}
};
