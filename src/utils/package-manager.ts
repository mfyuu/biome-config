import fs from "node:fs";
import path from "node:path";
import { promptPackageManager } from "./prompt";

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

type LockFile = {
	name: string;
	manager: PackageManager;
};

const LOCK_FILES: LockFile[] = [
	{ name: "package-lock.json", manager: "npm" },
	{ name: "yarn.lock", manager: "yarn" },
	{ name: "pnpm-lock.yaml", manager: "pnpm" },
	{ name: "bun.lockb", manager: "bun" },
	{ name: "bun.lock", manager: "bun" },
];

export const detectPackageManager = (cwd: string): PackageManager | null => {
	for (const lockFile of LOCK_FILES) {
		const lockFilePath = path.join(cwd, lockFile.name);
		if (fs.existsSync(lockFilePath)) {
			return lockFile.manager;
		}
	}
	return null;
};

export const detectAllPackageManagers = (cwd: string): PackageManager[] => {
	const detected: PackageManager[] = [];
	const seenManagers = new Set<PackageManager>();

	for (const lockFile of LOCK_FILES) {
		const lockFilePath = path.join(cwd, lockFile.name);
		if (fs.existsSync(lockFilePath) && !seenManagers.has(lockFile.manager)) {
			detected.push(lockFile.manager);
			seenManagers.add(lockFile.manager);
		}
	}

	return detected;
};

export const detectAndSelectPackageManager = async (
	cwd: string,
): Promise<PackageManager | null> => {
	const detected = detectAllPackageManagers(cwd);

	if (detected.length === 0) {
		return null;
	}

	if (detected.length === 1) {
		return detected[0];
	}

	// When multiple package managers are detected, ask user to choose
	return await promptPackageManager(detected);
};

export const getInstallCommand = (
	manager: PackageManager,
	packages: string[],
): string => {
	const packageList = packages.map((pkg) => `${pkg}@latest`).join(" ");
	switch (manager) {
		case "npm":
			return `npm i -D ${packageList}`;
		case "yarn":
			return `yarn add -D ${packageList}`;
		case "pnpm":
			return `pnpm add -D ${packageList}`;
		case "bun":
			return `bun add -D ${packageList}`;
		default:
			return manager satisfies never;
	}
};

export const validatePackageManagerChoice = (
	choices: Partial<
		Record<"useNpm" | "useYarn" | "usePnpm" | "useBun", boolean>
	>,
): PackageManager | null => {
	const selected = Object.entries(choices).filter(([, value]) => value);
	if (selected.length > 1) {
		throw new Error(
			"Multiple package managers specified. Please choose only one.",
		);
	}
	if (selected.length === 0) {
		return null;
	}
	const [key] = selected[0];
	const managerMap: Record<string, PackageManager> = {
		useNpm: "npm",
		useYarn: "yarn",
		usePnpm: "pnpm",
		useBun: "bun",
	};
	return managerMap[key] || null;
};
