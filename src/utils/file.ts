import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
