import prompts from "prompts";
import {
	EXIT_CODES,
	PROJECT_TYPES,
	PROMPT_DEFAULTS,
	type ProjectType,
} from "../constants.js";
import type { PackageManager } from "./package-manager.js";

export const promptOverwriteConfirmation = async (): Promise<boolean> => {
	const response = await prompts(
		{
			type: "confirm",
			name: "overwrite",
			message: ".vscode/settings.json already exists. Overwrite?",
			initial: false,
		},
		{
			onCancel: () => {
				console.log("\nOperation cancelled.");
				process.exit(EXIT_CODES.FAILURE);
			},
		},
	);

	return response.overwrite || false;
};

export const promptBiomeOverwriteConfirmation = async (): Promise<boolean> => {
	const response = await prompts(
		{
			type: "confirm",
			name: "overwrite",
			message: "biome.json(c) already exists. Overwrite?",
			initial: false,
		},
		{
			onCancel: () => {
				console.log("\nOperation cancelled.");
				process.exit(EXIT_CODES.FAILURE);
			},
		},
	);

	return response.overwrite || false;
};

export const promptInstallDependencies = async (
	packages: string[],
): Promise<boolean> => {
	const response = await prompts(
		{
			type: "confirm",
			name: "install",
			message: `Install missing dependencies (${packages.join(", ")})?`,
			initial: true,
		},
		{
			onCancel: () => {
				console.log("\nOperation cancelled.");
				process.exit(EXIT_CODES.FAILURE);
			},
		},
	);

	return response.install || false;
};

export const promptPackageManager = async (): Promise<PackageManager> => {
	const response = await prompts(
		{
			type: "select",
			name: "packageManager",
			message: "Which package manager do you want to use?",
			choices: [
				{ title: "npm", value: "npm" },
				{ title: "yarn", value: "yarn" },
				{ title: "pnpm", value: "pnpm" },
				{ title: "bun", value: "bun" },
			],
			initial: PROMPT_DEFAULTS.PACKAGE_MANAGER_INDEX, // default is pnpm
		},
		{
			onCancel: () => {
				console.log("\nOperation cancelled.");
				process.exit(EXIT_CODES.FAILURE);
			},
		},
	);

	return response.packageManager || "npm";
};

export const promptProjectType = async (): Promise<ProjectType> => {
	const response = await prompts(
		{
			type: "select",
			name: "projectType",
			message: "Which type of project is this?",
			choices: [
				{
					title: "Base (Node.js/TypeScript)",
					value: PROJECT_TYPES.BASE,
					description: "Standard JavaScript/TypeScript projects",
				},
				{
					title: "React",
					value: PROJECT_TYPES.REACT,
					description: "React applications and libraries",
				},
				{
					title: "Next.js",
					value: PROJECT_TYPES.NEXT,
					description: "Next.js applications",
				},
			],
			initial: PROMPT_DEFAULTS.PROJECT_TYPE_INDEX,
		},
		{
			onCancel: () => {
				console.log("\nOperation cancelled.");
				process.exit(EXIT_CODES.FAILURE);
			},
		},
	);

	return response.projectType || PROJECT_TYPES.BASE;
};
