import { execSync } from "node:child_process";
import path from "node:path";
import { copyFile, fileExists, getTemplatePath } from "../utils/file";
import { logger } from "../utils/logger";
import type { PackageManager } from "../utils/package-manager";

export type LefthookResult =
	| { type: "created" }
	| { type: "skipped" }
	| { type: "overwritten" }
	| { type: "error"; message: string };

export const createLefthookConfig = async (
	baseDir: string,
	packageManager: PackageManager,
	force?: boolean,
): Promise<LefthookResult> => {
	try {
		const lefthookPath = path.join(baseDir, "lefthook.yml");

		if (fileExists(lefthookPath) && !force) {
			logger.warning("lefthook.yml already exists. Use --force to overwrite");
			return { type: "skipped" };
		}

		const templateFile = `lefthook/${packageManager}.yml`;
		const templatePath = getTemplatePath(templateFile);

		if (!fileExists(templatePath)) {
			return { type: "error", message: "Template not found" };
		}

		const isExisting = fileExists(lefthookPath);
		copyFile(templatePath, lefthookPath);

		const message = isExisting ? "overwritten" : "created";
		logger.success(`lefthook.yml ${message}`);

		return { type: message as "created" | "overwritten" };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		logger.error(`Failed to create lefthook.yml: ${message}`);
		return { type: "error", message };
	}
};

export const addLefthookScript = async (
	baseDir: string,
): Promise<"success" | "error"> => {
	try {
		execSync('npm pkg set scripts.prepare="lefthook install"', {
			cwd: baseDir,
			stdio: "pipe",
		});

		logger.success("Added lefthook prepare script");
		return "success";
	} catch {
		logger.warning("Failed to add lefthook script to package.json");
		return "error";
	}
};
