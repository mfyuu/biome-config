import fs from "node:fs";
import path from "node:path";

interface PackageJson {
	devDependencies?: Record<string, string>;
	dependencies?: Record<string, string>;
	[key: string]: unknown;
}

export const readUserPackageJson = (cwd: string): PackageJson | null => {
	const packageJsonPath = path.join(cwd, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return null;
	}
	try {
		const content = fs.readFileSync(packageJsonPath, "utf-8");
		return JSON.parse(content) as PackageJson;
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
