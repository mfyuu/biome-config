import { green, red, yellow } from "kleur/colors";
import logSymbols from "log-symbols";
import { MESSAGES } from "../constants";
import type { TaskResult, TaskStatus } from "../types/index";
import { logger } from "../utils/logger";

const statusIcon = (status: TaskStatus): string => {
	switch (status) {
		case "success":
			return logSymbols.success;
		case "error":
			return logSymbols.error;
		case "skipped":
			return logSymbols.warning;
		default:
			return status satisfies never;
	}
};

export const showSetupSummary = (tasks: TaskResult): void => {
	logger.finalSuccess(MESSAGES.INFO.SETUP_COMPLETE);

	const items = [
		{
			name: "Dependencies",
			status: tasks.dependencies.status,
			message: tasks.dependencies.message,
		},
		{
			name: "biome.json",
			status: tasks.biomeConfig.status,
			message: tasks.biomeConfig.message,
		},
		{
			name: "Scripts",
			status: tasks.scripts.status,
			message: tasks.scripts.message,
		},
		{
			name: ".vscode/settings.json",
			status: tasks.settingsFile.status,
			message: tasks.settingsFile.message,
		},
	];

	// Count completed tasks
	const completedCount = items.filter(
		(item) => item.status === "success",
	).length;
	const totalCount = items.length;

	// Create progress bar
	const barWidth = 20;
	const filledWidth = Math.round((completedCount / totalCount) * barWidth);
	const emptyWidth = barWidth - filledWidth;
	const progressBar = `[${green("█".repeat(filledWidth))}${"░".repeat(emptyWidth)}]`;

	// Create summary header with progress
	console.log(`  ${progressBar} ${completedCount}/${totalCount} completed`);
	console.log();

	// List items with their status
	for (const item of items) {
		const icon = statusIcon(item.status);
		const statusText = item.message
			? item.status === "skipped"
				? yellow(`(${item.message})`)
				: item.status === "error"
					? red(`(${item.message})`)
					: green(`(${item.message})`)
			: "";

		console.log(`  ${icon} ${item.name} ${statusText}`);
	}
};
