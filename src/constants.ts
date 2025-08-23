export const PATHS = {
	VSCODE_DIR: ".vscode",
	SETTINGS_FILE: "settings.json",
	TEMPLATES_DIR: "templates",
	GIT_DIR: ".git",
} as const;

export const MESSAGES = {
	INFO: {
		USING_LOCAL: "Using current directory (--local option specified)",
		FOUND_GIT_ROOT: (path: string) => `Found git repository root: ${path}`,
		CREATE_SUCCESS: ".vscode/settings.json created successfully!",
		OVERWRITE_SUCCESS: ".vscode/settings.json overwritten successfully!",
		LOCATION: (path: string) => `Location: ${path}`,
		DEPS_ALREADY_INSTALLED: (deps: string[]) =>
			`Dependencies already installed: ${deps.join(", ")}`,
		INSTALLING_DEPS: (deps: string[]) =>
			`Installing dependencies: ${deps.join(", ")}...`,
		DEPS_INSTALLED_SUCCESS: "Dependencies installed successfully!",
		RUN_INSTALL_MANUALLY: (command: string) =>
			`\nPlease run the following command manually:\n  ${command}`,
		PACKAGE_MANAGER_DETECTED: (manager: string) =>
			`Detected package manager: ${manager}`,
		NO_PACKAGE_JSON: "\nNo package.json found. Initialize it with:",
		SKIP_DEPS: "Skipping dependency installation (--skip-deps option)",
	},
	WARNING: {
		FILE_EXISTS: "Warning: .vscode/settings.json already exists!",
		USE_FORCE: "Use --force to overwrite the existing file",
		PACKAGE_JSON_NOT_FOUND:
			"Warning: package.json not found. Skipping dependency installation.",
		MULTIPLE_PACKAGE_MANAGERS:
			"Warning: Multiple package managers specified. Please choose only one.",
	},
	ERROR: {
		NOT_IN_GIT: "Error: Not in a git repository!",
		GIT_ROOT_NOT_FOUND:
			"Git repository root not found from current directory to home directory.",
		USE_LOCAL_OPTION:
			"Use --local option to create in the current directory instead.",
		CREATE_FAILED: "Failed to create .vscode/settings.json:",
		DEPS_INSTALL_FAILED: "Failed to add dependencies to package.json:",
		DEPS_INSTALL_EXEC_FAILED: "Failed to install dependencies:",
	},
} as const;

export const DEPENDENCIES = {
	BIOME: "@biomejs/biome",
	CONFIG: "@mfyuu/biome-config",
} as const;
