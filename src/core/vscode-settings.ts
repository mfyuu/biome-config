import path from "node:path";
import { MESSAGES, PATHS } from "../constants";
import {
	copyFile,
	createDirectory,
	fileExists,
	getTemplatePath,
} from "../utils/file";
import { logger } from "../utils/logger";
import { promptOverwriteConfirmation } from "../utils/prompt";

type VSCodeSettingsResult =
	| { type: "created" }
	| { type: "overwritten" }
	| { type: "skipped" }
	| { type: "error"; message: string };

export const createVSCodeSettings = async (
	baseDir: string,
	force?: boolean,
): Promise<VSCodeSettingsResult> => {
	const vscodeDir = path.join(baseDir, PATHS.VSCODE_DIR);
	const targetPath = path.join(vscodeDir, PATHS.SETTINGS_FILE);

	// Check if settings.json already exists
	const fileAlreadyExists = fileExists(targetPath);
	if (fileAlreadyExists && !force) {
		// Ask user if they want to overwrite
		const shouldOverwrite = await promptOverwriteConfirmation();
		if (!shouldOverwrite) {
			logger.warning(MESSAGES.WARNING.FILE_EXISTS);
			logger.warning(MESSAGES.WARNING.USE_FORCE);
			return { type: "skipped" };
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
			logger.info(MESSAGES.INFO.LOCATION(targetPath));
			return { type: "overwritten" };
		}
		logger.success(MESSAGES.INFO.CREATE_SUCCESS);
		logger.info(MESSAGES.INFO.LOCATION(targetPath));
		return { type: "created" };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(MESSAGES.ERROR.CREATE_FAILED, errorMessage);
		return { type: "error", message: errorMessage };
	}
};
