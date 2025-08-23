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
	},
	WARNING: {
		FILE_EXISTS: "Warning: .vscode/settings.json already exists!",
		USE_FORCE: "Use --force to overwrite the existing file",
	},
	ERROR: {
		NOT_IN_GIT: "Error: Not in a git repository!",
		GIT_ROOT_NOT_FOUND:
			"Git repository root not found from current directory to home directory.",
		USE_LOCAL_OPTION:
			"Use --local option to create in the current directory instead.",
		CREATE_FAILED: "Failed to create .vscode/settings.json:",
	},
} as const;
