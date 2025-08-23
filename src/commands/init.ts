import path from "node:path";
import { MESSAGES, PATHS } from "../constants.js";
import {
	copyFile,
	createDirectory,
	fileExists,
	getTemplatePath,
} from "../utils/file.js";
import { findGitRoot } from "../utils/git.js";
import { logger } from "../utils/logger.js";

interface InitOptions {
	force?: boolean;
	local?: boolean;
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

export const initSettingsFile = (options: InitOptions): InitResult => {
	const baseDir = determineBaseDir(options);
	if (!baseDir) {
		return { success: false, error: "Git repository not found" };
	}

	const vscodeDir = path.join(baseDir, PATHS.VSCODE_DIR);
	const targetPath = path.join(vscodeDir, PATHS.SETTINGS_FILE);

	if (fileExists(targetPath) && !options.force) {
		logger.warning(MESSAGES.WARNING.FILE_EXISTS);
		logger.warning(MESSAGES.WARNING.USE_FORCE);
		return { success: false, error: "File already exists" };
	}

	try {
		const templatePath = getTemplatePath(
			path.join(PATHS.VSCODE_DIR, PATHS.SETTINGS_FILE),
		);

		createDirectory(vscodeDir);
		copyFile(templatePath, targetPath);

		if (options.force && fileExists(targetPath)) {
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
