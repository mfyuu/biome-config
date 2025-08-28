import fs from "node:fs";
import path from "node:path";
import {
	DEPENDENCIES,
	INSTALL_OPTIONS,
	LOCK_FILES,
	PACKAGE_MANAGERS,
	type PackageManager,
} from "../constants";
import { promptPackageManager } from "./prompt";

// Re-export for backward compatibility
export type { PackageManager } from "../constants";

type CommandStructure = {
	command: string;
	args: string[];
};

type LockFile = {
	name: string;
	manager: PackageManager;
};

const LOCK_FILES_CONFIG: LockFile[] = [
	{ name: LOCK_FILES.NPM, manager: PACKAGE_MANAGERS.NPM },
	{ name: LOCK_FILES.YARN, manager: PACKAGE_MANAGERS.YARN },
	{ name: LOCK_FILES.PNPM, manager: PACKAGE_MANAGERS.PNPM },
	{ name: LOCK_FILES.BUN, manager: PACKAGE_MANAGERS.BUN },
	{ name: "bun.lock", manager: PACKAGE_MANAGERS.BUN },
];

export const detectPackageManager = (cwd: string): PackageManager | null => {
	for (const lockFile of LOCK_FILES_CONFIG) {
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

	for (const lockFile of LOCK_FILES_CONFIG) {
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
): string[] => {
	const commands: string[] = [];

	// Split packages into exact and non-exact groups
	const exactPackages = packages.filter(
		(pkg) => pkg === DEPENDENCIES.BIOME || pkg === DEPENDENCIES.PRETTIER,
	);
	const nonExactPackages = packages.filter(
		(pkg) => pkg !== DEPENDENCIES.BIOME && pkg !== DEPENDENCIES.PRETTIER,
	);

	// Install exact packages together
	if (exactPackages.length > 0) {
		let command = "";
		const packageList = exactPackages.join(" ");

		switch (manager) {
			case PACKAGE_MANAGERS.NPM:
				command = `npm i ${INSTALL_OPTIONS.SAVE_DEV} ${INSTALL_OPTIONS.SAVE_EXACT} ${packageList}`;
				break;
			case PACKAGE_MANAGERS.YARN:
				command = `yarn ${INSTALL_OPTIONS.ADD} ${INSTALL_OPTIONS.DEV} ${INSTALL_OPTIONS.EXACT} ${packageList}`;
				break;
			case PACKAGE_MANAGERS.PNPM:
				command = `pnpm ${INSTALL_OPTIONS.ADD} ${INSTALL_OPTIONS.SAVE_DEV} ${INSTALL_OPTIONS.SAVE_EXACT} ${packageList}`;
				break;
			case PACKAGE_MANAGERS.BUN:
				command = `bun ${INSTALL_OPTIONS.ADD} ${INSTALL_OPTIONS.DEV} ${INSTALL_OPTIONS.EXACT} ${packageList}`;
				break;
			default:
				return manager satisfies never;
		}
		commands.push(command);
	}

	// Install non-exact packages separately
	for (const pkg of nonExactPackages) {
		let command = "";

		switch (manager) {
			case PACKAGE_MANAGERS.NPM:
				command = `npm i ${INSTALL_OPTIONS.SAVE_DEV} ${pkg}`;
				break;
			case PACKAGE_MANAGERS.YARN:
				command = `yarn ${INSTALL_OPTIONS.ADD} ${INSTALL_OPTIONS.DEV} ${pkg}`;
				break;
			case PACKAGE_MANAGERS.PNPM:
				command = `pnpm ${INSTALL_OPTIONS.ADD} ${INSTALL_OPTIONS.SAVE_DEV} ${pkg}`;
				break;
			case PACKAGE_MANAGERS.BUN:
				command = `bun ${INSTALL_OPTIONS.ADD} ${INSTALL_OPTIONS.DEV} ${pkg}`;
				break;
			default:
				return manager satisfies never;
		}
		commands.push(command);
	}

	return commands;
};

export const getLefthookInstallCommand = (
	packageManager: PackageManager,
): CommandStructure => {
	switch (packageManager) {
		case PACKAGE_MANAGERS.NPM:
			return { command: "npx", args: ["lefthook", INSTALL_OPTIONS.INSTALL] };
		case PACKAGE_MANAGERS.YARN:
			return {
				command: PACKAGE_MANAGERS.YARN,
				args: [INSTALL_OPTIONS.EXEC, "lefthook", INSTALL_OPTIONS.INSTALL],
			};
		case PACKAGE_MANAGERS.PNPM:
			return {
				command: PACKAGE_MANAGERS.PNPM,
				args: [INSTALL_OPTIONS.EXEC, "lefthook", INSTALL_OPTIONS.INSTALL],
			};
		case PACKAGE_MANAGERS.BUN:
			return {
				command: "bunx",
				args: ["--bun", "lefthook", INSTALL_OPTIONS.INSTALL],
			};
		default:
			return packageManager satisfies never;
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
		useNpm: PACKAGE_MANAGERS.NPM,
		useYarn: PACKAGE_MANAGERS.YARN,
		usePnpm: PACKAGE_MANAGERS.PNPM,
		useBun: PACKAGE_MANAGERS.BUN,
	};
	return managerMap[key] || null;
};
