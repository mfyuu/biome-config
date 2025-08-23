#!/usr/bin/env node

import { Command } from "commander";
import { initSettingsFile } from "./commands/init.js";
import { readPackageJson } from "./utils/file.js";

interface CliOptions {
	force?: boolean;
	local?: boolean;
	skipDeps?: boolean;
	useNpm?: boolean;
	useYarn?: boolean;
	usePnpm?: boolean;
	useBun?: boolean;
}

const packageJson = readPackageJson() as { version: string };

const program = new Command();

program
	.name("biome-config")
	.description("Biome configuration setup tool")
	.version(packageJson.version)
	.option("-f, --force", "overwrite existing files")
	.option("-l, --local", "create in current directory instead of git root")
	.option("--skip-deps", "skip adding dependencies to package.json")
	.option("--use-npm", "use npm as package manager")
	.option("--use-yarn", "use yarn as package manager")
	.option("--use-pnpm", "use pnpm as package manager")
	.option("--use-bun", "use bun as package manager")
	.action(async (options: CliOptions) => {
		const result = await initSettingsFile(options);
		process.exit(result.success ? 0 : 1);
	});

program.parse();
