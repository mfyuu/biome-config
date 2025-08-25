import prompts from "prompts";
import type { PackageManager } from "./package-manager.js";

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
			initial: 2, // default is pnpm
		},
		{
			onCancel: () => {
				console.log("\nOperation cancelled.");
				process.exit(1);
			},
		},
	);

	return response.packageManager || "npm";
};
