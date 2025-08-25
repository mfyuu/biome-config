import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PATHS } from "../constants.js";

const getRootDir = (): string => {
	const currentFileUrl = import.meta.url;
	const currentFilePath = fileURLToPath(currentFileUrl);
	const currentDir = path.dirname(currentFilePath);
	// dist/cli.js から ../ でプロジェクトルートへ（ビルド後）
	return path.resolve(currentDir, "..");
};

export const readPackageJson = (): unknown => {
	const packageJsonPath = path.join(getRootDir(), "package.json");
	return JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
};

export const getTemplatePath = (templateName: string): string => {
	return path.join(getRootDir(), "templates", templateName);
};

export const fileExists = (filePath: string): boolean => {
	return fs.existsSync(filePath);
};

export const createDirectory = (dirPath: string): void => {
	fs.mkdirSync(dirPath, { recursive: true });
};

export const copyFile = (source: string, destination: string): void => {
	fs.copyFileSync(source, destination);
};

export const findBiomeConfig = (baseDir: string): string | null => {
	// Check for biome.json first
	const biomeJsonPath = path.join(baseDir, PATHS.BIOME_FILE);
	if (fileExists(biomeJsonPath)) return biomeJsonPath;

	// Then check for biome.jsonc
	const biomeJsoncPath = path.join(baseDir, PATHS.BIOME_FILE_JSONC);
	if (fileExists(biomeJsoncPath)) return biomeJsoncPath;

	return null;
};
