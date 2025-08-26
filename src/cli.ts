#!/usr/bin/env node

import { Command } from "commander";
import { initSettingsFile } from "./commands/init";
import { EXIT_CODES } from "./constants";
import { readPackageJson } from "./utils/file";

type CliOptions = {
	force?: boolean;
	local?: boolean;
	skipDeps?: boolean;
	useNpm?: boolean;
	useYarn?: boolean;
	usePnpm?: boolean;
	useBun?: boolean;
	type?: "base" | "react" | "next";
	biomeOnly?: boolean;
	withPrettier?: boolean;
};

const packageJson = readPackageJson() as { version: string };

const program = new Command();

program
	.name("biome-config")
	.description("Biome configuration setup tool")
	.version(packageJson.version)
	.option("-f, --force", "overwrite existing files without prompts")
	.option("-l, --local", "create in current directory instead of git root")
	.option("-s, --skip-deps", "skip dependency installation")
	.option("--use-npm", "use npm as package manager")
	.option("--use-yarn", "use yarn as package manager")
	.option("--use-pnpm", "use pnpm as package manager")
	.option("--use-bun", "use bun as package manager")
	.option("--biome-only", "use Biome as the only formatter")
	.option("--with-prettier", "use Biome with Prettier for Markdown files")
	.option(
		"--type <type>",
		"configuration type (base, react, next)",
		(value) => {
			if (!["base", "react", "next"].includes(value)) {
				throw new Error(`Invalid type: ${value}`);
			}
			return value as "base" | "react" | "next";
		},
	)
	.action(async (options: CliOptions) => {
		const result = await initSettingsFile(options);
		process.exit(result.success ? EXIT_CODES.SUCCESS : EXIT_CODES.FAILURE);
	});

program.parse();
