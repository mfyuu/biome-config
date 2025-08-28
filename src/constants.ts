import { highlight } from "./utils/logger";

export const PATHS = {
	VSCODE_DIR: ".vscode",
	SETTINGS_FILE: "settings.json",
	TEMPLATES_DIR: "templates",
	GIT_DIR: ".git",
	BIOME_FILE: "biome.json",
	BIOME_FILE_JSONC: "biome.jsonc",
	BIOME_TEMPLATES_DIR: "biome",
} as const;

export const VSCODE_SETTINGS_TEMPLATES = {
	BIOME_ONLY: "biome-only.json",
	WITH_PRETTIER: "with-prettier.json",
} as const;

export const MESSAGES = {
	INFO: {
		USING_LOCAL: `Using current directory (${highlight.option("--local")} option specified)`,
		FOUND_GIT_ROOT: (path: string) =>
			`Found git repository root: ${highlight.file(path)}`,
		CREATE_SUCCESS: `${highlight.file(".vscode/settings.json")} created successfully!`,
		OVERWRITE_SUCCESS: `${highlight.file(".vscode/settings.json")} overwritten successfully!`,
		LOCATION: (path: string) => `Location: ${highlight.path(path)}`,
		DEPS_ALREADY_INSTALLED: (deps: string[]) =>
			`Dependencies already installed: ${deps.map((d) => highlight.package(d)).join(", ")}`,
		INSTALLING_DEPS: (deps: string[]) =>
			`Installing dependencies: ${deps.map((d) => highlight.package(d)).join(", ")}...`,
		DEPS_INSTALLED_SUCCESS: "Dependencies installed successfully!",
		RUN_INSTALL_MANUALLY: "Run manually:",
		PACKAGE_MANAGER_DETECTED: (manager: string) =>
			`Found package manager: ${highlight.package(manager)}`,
		NO_PACKAGE_JSON: "No package.json found. Initialize it with:",
		SKIP_DEPS: `Skipping dependency installation (${highlight.option("--skip-deps")} option)`,
		BIOME_CREATE_SUCCESS: `${highlight.file("biome.json(c)")} created successfully!`,
		BIOME_OVERWRITE_SUCCESS: `${highlight.file("biome.json(c)")} overwritten successfully!`,
		PROJECT_TYPE_DETECTED: (type: string, description: string) =>
			`Found project type: ${highlight.package(type)} ${highlight.dim(`(${description})`)}`,
		PROJECT_TYPE_SELECTED: (type: string, description: string) =>
			`Selected project type: ${highlight.package(type)} ${highlight.dim(`(${description})`)}`,
		FORMATTER_SELECTED: (choice: string) =>
			`Selected formatter template: ${highlight.package(choice)}`,
		SETUP_COMPLETE: "Biome configuration setup completed.",
		LEFTHOOK_ALREADY_INSTALLED: `${highlight.package("lefthook")} is already installed.`,
		INSTALLING_LEFTHOOK: `Installing ${highlight.package("lefthook")}...`,
		LEFTHOOK_INSTALLED_SUCCESS: `${highlight.package("lefthook")} installed successfully!`,
	},
	WARNING: {
		PACKAGE_JSON_NOT_FOUND: `${highlight.file("package.json")} not found. Skipping dependency installation.`,
		MULTIPLE_PACKAGE_MANAGERS:
			"Multiple package managers specified, choose only one.",
		CONFLICTING_FORMATTER_FLAGS:
			"Cannot use both --biome-only and --with-prettier flags together.",
	},
	ERROR: {
		NOT_IN_GIT: "Not in a git repository.",
		GIT_ROOT_NOT_FOUND: "Git repository not found.",
		USE_LOCAL_OPTION: `Use ${highlight.option("--local")} option to create in the current directory instead.`,
		CREATE_FAILED: `Failed to create ${highlight.file(".vscode/settings.json")}:`,
		DEPS_INSTALL_FAILED: `Failed to add dependencies to ${highlight.file("package.json")}:`,
		DEPS_INSTALL_EXEC_FAILED: "Failed to install dependencies:",
		BIOME_CREATE_FAILED: `Failed to create ${highlight.file("biome.json(c)")}:`,
		LEFTHOOK_INSTALL_FAILED: `Failed to install ${highlight.package("lefthook")}:`,
	},
} as const;

export const DEPENDENCIES = {
	BIOME: "@biomejs/biome",
	CONFIG: "@mfyuu/biome-config",
	PRETTIER: "prettier",
	LEFTHOOK: "lefthook",
} as const;
export const PACKAGE_MANAGERS = {
	NPM: "npm",
	YARN: "yarn",
	PNPM: "pnpm",
	BUN: "bun",
} as const;

export type PackageManager =
	(typeof PACKAGE_MANAGERS)[keyof typeof PACKAGE_MANAGERS];

export const LOCK_FILES = {
	NPM: "package-lock.json",
	YARN: "yarn.lock",
	PNPM: "pnpm-lock.yaml",
	BUN: "bun.lockb",
} as const;

export const INSTALL_OPTIONS = {
	SAVE_DEV: "--save-dev",
	SAVE_EXACT: "--save-exact",
	DEV: "--dev",
	EXACT: "--exact",
	ADD: "add",
	INSTALL: "install",
	EXEC: "exec",
} as const;

export const PROJECT_TYPES = {
	BASE: "base",
	REACT: "react",
	NEXT: "next",
} as const;

export type ProjectType = (typeof PROJECT_TYPES)[keyof typeof PROJECT_TYPES];

export const PROJECT_TYPE_DESCRIPTIONS: Record<ProjectType, string> = {
	[PROJECT_TYPES.BASE]: "Standard JavaScript/TypeScript projects",
	[PROJECT_TYPES.REACT]: "React applications and libraries",
	[PROJECT_TYPES.NEXT]: "Next.js applications",
} as const;

const FILE_EXTENSIONS = {
	JSON: ".json",
	JSONC: ".jsonc",
} as const;

export const DEFAULT_BIOME_EXTENSION = FILE_EXTENSIONS.JSONC;

export const EXIT_CODES = {
	SUCCESS: 0,
	FAILURE: 1,
} as const;

export const UI_MESSAGES = {
	OPERATION_CANCELLED: "\nOperation cancelled.",
} as const;

export const PROMPT_DEFAULTS = {
	PACKAGE_MANAGER_INDEX: 2, // pnpm
	PROJECT_TYPE_INDEX: 0, // base
} as const;
