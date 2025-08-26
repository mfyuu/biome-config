import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PATHS } from "../constants.js";

export const findGitRoot = (startDir: string): string | null => {
	let currentDir = startDir;
	const homeDir = os.homedir();
	const rootDir = path.parse(currentDir).root;

	while (currentDir !== rootDir) {
		const gitPath = path.join(currentDir, PATHS.GIT_DIR);

		try {
			const stats = fs.statSync(gitPath);
			if (stats.isDirectory() || stats.isFile()) {
				return currentDir;
			}
		} catch {
			// if .git is not a directory or file, continue
		}

		if (currentDir === homeDir) {
			break;
		}

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			break;
		}
		currentDir = parentDir;
	}

	return null;
};
