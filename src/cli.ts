#!/usr/bin/env node

import { Command } from "commander";
import { initSettingsFile } from "./commands/init.js";
import { readPackageJson } from "./utils/file.js";

interface CliOptions {
	force?: boolean;
	local?: boolean;
}

const packageJson = readPackageJson() as { version: string };

const program = new Command();

program
	.name("biome-config")
	.description("Biome configuration setup tool")
	.version(packageJson.version)
	.option("-f, --force", "overwrite existing files")
	.option("-l, --local", "create in current directory instead of git root")
	.action((options: CliOptions) => {
		const result = initSettingsFile(options);
		process.exit(result.success ? 0 : 1);
	});

program.parse();
