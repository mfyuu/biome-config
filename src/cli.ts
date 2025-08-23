#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

// ESMでpackage.jsonを読み込む
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
	fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"),
);

interface CliOptions {
	force?: boolean;
	local?: boolean;
}

const createSettingsFile = (options: CliOptions): void => {
	// テンプレートファイルのパス
	const templatePath = path.join(
		__dirname,
		"..",
		"templates",
		".vscode",
		"settings.json",
	);

	// ターゲットのパス
	const baseDir = process.cwd();
	const vscodeDir = path.join(baseDir, ".vscode");
	const targetPath = path.join(vscodeDir, "settings.json");

	try {
		// 既存ファイルのチェック
		if (fs.existsSync(targetPath) && !options.force) {
			console.log("Warning: .vscode/settings.json already exists!");
			console.log("Use --force to overwrite the existing file");
			process.exit(0);
		}

		// .vscodeディレクトリを作成（既に存在する場合はスキップ）
		fs.mkdirSync(vscodeDir, { recursive: true });

		// テンプレートファイルをコピー
		fs.copyFileSync(templatePath, targetPath);

		if (options.force && fs.existsSync(targetPath)) {
			console.log(".vscode/settings.json overwritten successfully!");
		} else {
			console.log(".vscode/settings.json created successfully!");
		}
		console.log(`Location: ${targetPath}`);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		console.error("Failed to create .vscode/settings.json:", errorMessage);
		process.exit(1);
	}
};

const program = new Command();

program
	.name("biome-config")
	.description("Biome configuration setup tool")
	.version(packageJson.version)
	.option("-f, --force", "overwrite existing files")
	.option(
		"-l, --local",
		"create in current directory instead of git root (not implemented yet)",
	)
	.action((options: CliOptions) => {
		createSettingsFile(options);
	});

program.parse();
