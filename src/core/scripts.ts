import { createSpinner, runNpmPkgSet } from "../utils/npm-command";

export const addBiomeScripts = async (
	baseDir: string,
): Promise<"success" | "error"> => {
	const spinner = createSpinner().start();

	try {
		const scripts = [
			"scripts.format=biome format --write",
			"scripts.lint=biome lint",
			"scripts.lint-fix=biome lint --write",
			"scripts.check=biome check --write",
		];

		for (const kv of scripts) {
			await runNpmPkgSet(baseDir, kv);
		}

		spinner.succeed("Added Biome dev scripts.");
		return "success";
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		spinner.fail(`Failed to add Biome scripts to package.json. ${msg}`);
		return "error";
	}
};
