import { logger } from "../utils/logger";

export const addBiomeScripts = async (
	baseDir: string,
): Promise<"success" | "error"> => {
	try {
		const { execSync } = await import("node:child_process");

		const scripts = [
			'scripts.format="biome format --write"',
			'scripts.lint="biome lint"',
			'scripts.lint-fix="biome lint --write"',
			'scripts.check="biome check --write"',
		];

		for (const script of scripts) {
			execSync(`npm pkg set ${script}`, {
				cwd: baseDir,
				stdio: "pipe",
			});
		}

		logger.success("Added Biome development scripts");
		return "success";
	} catch {
		logger.warning("Failed to add Biome scripts to package.json");
		return "error";
	}
};
