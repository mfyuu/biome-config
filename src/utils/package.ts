import fs from "node:fs";
import path from "node:path";
import { PROJECT_TYPES, type ProjectType } from "../constants";
import type { PackageJson } from "../types";

export const readUserPackageJson = (cwd: string): PackageJson | null => {
	const packageJsonPath = path.join(cwd, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return null;
	}
	try {
		const content = fs.readFileSync(packageJsonPath, "utf-8");
		const parsed: PackageJson = JSON.parse(content);
		return parsed;
	} catch {
		return null;
	}
};

export const hasDependency = (
	packageJson: PackageJson,
	packageName: string,
): boolean => {
	return (
		(packageJson.devDependencies &&
			packageName in packageJson.devDependencies) ||
		(packageJson.dependencies && packageName in packageJson.dependencies) ||
		false
	);
};

export const detectProjectType = (
	packageJson: PackageJson | null,
): ProjectType | null => {
	if (!packageJson) {
		return null;
	}

	// Check for Next.js
	if (hasDependency(packageJson, "next")) {
		return PROJECT_TYPES.NEXT;
	}

	// Check for React
	if (
		hasDependency(packageJson, "react") ||
		hasDependency(packageJson, "react-dom")
	) {
		return PROJECT_TYPES.REACT;
	}

	// Default to base if no specific framework is detected
	return PROJECT_TYPES.BASE;
};
