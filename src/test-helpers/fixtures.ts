/**
 * Test fixture data
 */

// Sample package.json data
export const basePackageJson = {
	name: "test-project",
	version: "1.0.0",
	dependencies: {},
	devDependencies: {},
};

export const reactPackageJson = {
	name: "test-react-project",
	version: "1.0.0",
	dependencies: {
		react: "^18.2.0",
		"react-dom": "^18.2.0",
	},
	devDependencies: {
		"@types/react": "^18.2.0",
	},
};

export const nextPackageJson = {
	name: "test-next-project",
	version: "1.0.0",
	dependencies: {
		next: "^14.0.0",
		react: "^18.2.0",
		"react-dom": "^18.2.0",
	},
	devDependencies: {
		"@types/react": "^18.2.0",
	},
};

export const biomeInstalledPackageJson = {
	name: "test-biome-project",
	version: "1.0.0",
	dependencies: {},
	devDependencies: {
		"@biomejs/biome": "^2.2.2",
	},
};

// Sample biome.json data
export const baseBiomeConfig = {
	$schema: "https://biomejs.dev/schemas/1.9.4/schema.json",
	extends: ["@mfyuu/biome-config/base"],
};

export const reactBiomeConfig = {
	$schema: "https://biomejs.dev/schemas/1.9.4/schema.json",
	extends: ["@mfyuu/biome-config/react"],
};

export const nextBiomeConfig = {
	$schema: "https://biomejs.dev/schemas/1.9.4/schema.json",
	extends: ["@mfyuu/biome-config/next"],
};

// Sample VS Code settings.json data
export const vscodeSettings = {
	"editor.formatOnSave": true,
	"[javascript]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[javascriptreact]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[typescript]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[typescriptreact]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[json]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[jsonc]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"editor.codeActionsOnSave": {
		"quickfix.biome": "explicit",
		"source.organizeImports.biome": "explicit",
	},
};

// Helper to generate test directory structure
export function createProjectStructure(
	type: "base" | "react" | "next" = "base",
) {
	let packageJson = basePackageJson;
	let biomeConfig = baseBiomeConfig;

	if (type === "react") {
		packageJson = reactPackageJson;
		biomeConfig = reactBiomeConfig;
	} else if (type === "next") {
		packageJson = nextPackageJson;
		biomeConfig = nextBiomeConfig;
	}

	return {
		"/project": {
			".git": {},
			"package.json": JSON.stringify(packageJson, null, 2),
			"biome.json": JSON.stringify(biomeConfig, null, 2),
			src: {
				"index.ts": "// test file",
			},
		},
	};
}
