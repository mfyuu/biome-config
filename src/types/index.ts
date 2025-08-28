import type { ProjectType } from "../constants";

export interface InitOptions {
	force?: boolean;
	local?: boolean;
	skipDeps?: boolean;
	useNpm?: boolean;
	useYarn?: boolean;
	usePnpm?: boolean;
	useBun?: boolean;
	type?: ProjectType;
	biomeOnly?: boolean;
	withPrettier?: boolean;
	lefthook?: boolean;
}

export interface PackageJson {
	name?: string;
	version?: string;
	scripts?: Record<string, string>;
	devDependencies?: Record<string, string>;
	dependencies?: Record<string, string>;
	type?: string;
	main?: string;
	bin?: string;
	// Well-known package.json fields - add more as needed
	description?: string;
	keywords?: string[];
	author?: string;
	license?: string;
	repository?: {
		type: string;
		url: string;
	};
	homepage?: string;
	bugs?: {
		url: string;
		email?: string;
	};
}

export type FormatterChoice = "biome-only" | "with-prettier";

export type VSCodeSettingsResult =
	| { type: "created" }
	| { type: "overwritten" }
	| { type: "skipped" }
	| { type: "error"; message: string };

export interface InitResult {
	success: boolean;
	targetPath?: string;
	error?: string;
}

export type TaskStatus = "success" | "error" | "skipped";

type TaskResultDetail = {
	status: TaskStatus;
	message?: string;
};

export interface TaskResult {
	dependencies: TaskResultDetail;
	biomeConfig: TaskResultDetail;
	scripts: TaskResultDetail;
	settingsFile: TaskResultDetail;
	lefthook: TaskResultDetail;
}
