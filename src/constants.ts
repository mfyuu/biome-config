import { highlight } from "./utils/logger.js";

export const PATHS = {
	VSCODE_DIR: ".vscode",
	SETTINGS_FILE: "settings.json",
	TEMPLATES_DIR: "templates",
	GIT_DIR: ".git",
	BIOME_FILE: "biome.json",
	BIOME_FILE_JSONC: "biome.jsonc",
	BIOME_TEMPLATES_DIR: "biome",
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
		RUN_INSTALL_MANUALLY: "Please run the following command manually:",
		PACKAGE_MANAGER_DETECTED: (manager: string) =>
			`Detected package manager: ${highlight.package(manager)}`,
		NO_PACKAGE_JSON: "No package.json found. Initialize it with:",
		SKIP_DEPS: `Skipping dependency installation (${highlight.option("--skip-deps")} option)`,
		BIOME_CREATE_SUCCESS: `${highlight.file("biome.json(c)")} created successfully!`,
		BIOME_OVERWRITE_SUCCESS: `${highlight.file("biome.json(c)")} overwritten successfully!`,
		PROJECT_TYPE_DETECTED: (type: string) =>
			`Detected project type: ${highlight.package(type)}`,
		PROJECT_TYPE_SELECTED: (type: string) =>
			`Selected project type: ${highlight.package(type)}`,
		SETUP_COMPLETE: "Biome configuration setup completed.",
	},
	WARNING: {
		FILE_EXISTS: `${highlight.file(".vscode/settings.json")} already exists!`,
		USE_FORCE: `Use ${highlight.option("--force")} to overwrite the existing file`,
		PACKAGE_JSON_NOT_FOUND: `${highlight.file("package.json")} not found. Skipping dependency installation.`,
		MULTIPLE_PACKAGE_MANAGERS:
			"Multiple package managers specified. Please choose only one.",
		BIOME_FILE_EXISTS: `${highlight.file("biome.json(c)")} already exists!`,
	},
	ERROR: {
		NOT_IN_GIT: "Not in a git repository!",
		GIT_ROOT_NOT_FOUND:
			"Git repository root not found from current directory to home directory.",
		USE_LOCAL_OPTION: `Use ${highlight.option("--local")} option to create in the current directory instead.`,
		CREATE_FAILED: `Failed to create ${highlight.file(".vscode/settings.json")}:`,
		DEPS_INSTALL_FAILED: `Failed to add dependencies to ${highlight.file("package.json")}:`,
		DEPS_INSTALL_EXEC_FAILED: "Failed to install dependencies:",
		BIOME_CREATE_FAILED: `Failed to create ${highlight.file("biome.json(c)")}:`,
	},
} as const;

export const DEPENDENCIES = {
	BIOME: "@biomejs/biome",
	CONFIG: "@mfyuu/biome-config",
} as const;

export const PROJECT_TYPES = {
	BASE: "base",
	REACT: "react",
	NEXT: "next",
} as const;

export type ProjectType = (typeof PROJECT_TYPES)[keyof typeof PROJECT_TYPES];

const FILE_EXTENSIONS = {
	JSON: ".json",
	JSONC: ".jsonc",
} as const;

export const DEFAULT_BIOME_EXTENSION = FILE_EXTENSIONS.JSONC;

export const EXIT_CODES = {
	SUCCESS: 0,
	FAILURE: 1,
} as const;

export const PROMPT_DEFAULTS = {
	PACKAGE_MANAGER_INDEX: 2, // pnpm
	PROJECT_TYPE_INDEX: 0, // base
} as const;
