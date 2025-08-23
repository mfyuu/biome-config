import readline from "node:readline";
import type { PackageManager } from "./package-manager.js";

export const promptPackageManager = async (): Promise<PackageManager> => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		console.log("\nSelect a package manager:");
		console.log("  1) npm");
		console.log("  2) yarn");
		console.log("  3) pnpm");
		console.log("  4) bun");

		rl.question("\nEnter your choice (1-4): ", (answer) => {
			rl.close();
			const choice = answer.trim();
			switch (choice) {
				case "1":
					resolve("npm");
					break;
				case "2":
					resolve("yarn");
					break;
				case "3":
					resolve("pnpm");
					break;
				case "4":
					resolve("bun");
					break;
				default:
					console.log("\nInvalid choice. Using npm as default.");
					resolve("npm");
			}
		});
	});
};
