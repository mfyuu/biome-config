import prompts from "prompts";
import {
	EXIT_CODES,
	PROJECT_TYPES,
	PROMPT_DEFAULTS,
	type ProjectType,
} from "../constants";
import type { FormatterChoice } from "../types";
import type { PackageManager } from "./package-manager";

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

export const promptPackageManager = async (
	availableManagers?: PackageManager[],
): Promise<PackageManager> => {
	const allChoices = [
		{ title: "npm", value: "npm" as const satisfies PackageManager },
		{ title: "yarn", value: "yarn" as const satisfies PackageManager },
		{ title: "pnpm", value: "pnpm" as const satisfies PackageManager },
		{ title: "bun", value: "bun" as const satisfies PackageManager },
	];

	const choices = availableManagers
		? allChoices.filter((choice) => availableManagers.includes(choice.value))
		: allChoices;

	const message = availableManagers
		? "Multiple package managers detected. Choose one:"
		: "Which package manager do you want to use?";

	const response = await prompts(
		{
			type: "select",
			name: "packageManager",
			message,
			choices,
			initial: 0,
		},
		{
			onCancel: () => {
				console.log("\nOperation cancelled.");
				process.exit(EXIT_CODES.FAILURE);
			},
		},
	);

	return response.packageManager || (availableManagers?.[0] ?? "npm");
};
export const promptFormatterChoice = async (): Promise<FormatterChoice> => {
	const response = await prompts(
		{
			type: "select",
			name: "formatter",
			message: "Which formatter configuration would you like to use?",
			choices: [
				{
					title: "Biome + Prettier (for Markdown)",
					value: "with-prettier" as const,
				},
				{ title: "Biome only", value: "biome-only" as const },
			],
			initial: 0,
		},
		{
			onCancel: () => {
				console.log("\nOperation cancelled.");
				process.exit(EXIT_CODES.FAILURE);
			},
		},
	);

	return response.formatter || "with-prettier";
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
					title: "Next",
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

export const promptLefthookIntegration = async (): Promise<boolean> => {
	const response = await prompts(
		{
			type: "confirm",
			name: "integrate",
			message: "Would you like to integrate lefthook for Git hooks?",
			initial: true,
		},
		{
			onCancel: () => {
				console.log("\nOperation cancelled.");
				process.exit(EXIT_CODES.FAILURE);
			},
		},
	);

	return response.integrate || false;
};
