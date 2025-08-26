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
	settingsFile: TaskResultDetail;
}
