import { cyan, dim, green, grey } from "kleur/colors";
import logSymbols from "log-symbols";

export const logger = {
	info: (...messages: string[]): void => {
		console.log(logSymbols.info, ...messages);
	},

	success: (...messages: string[]): void => {
		console.log(logSymbols.success, ...messages);
	},

	warning: (...messages: string[]): void => {
		console.log(logSymbols.warning, ...messages);
	},

	error: (...messages: string[]): void => {
		console.error(logSymbols.error, ...messages);
	},

	code: (command: string): void => {
		console.log();
		console.log(grey(`  $ ${command}`));
		console.log();
	},

	finalSuccess: (message: string): void => {
		console.log();
		console.log(`${green("Success!")} ${message}`);
		console.log();
	},

	hooksSync: (): void => {
		console.log(`${cyan("sync hooks:")} ${dim(`✔ (pre-commit, pre-push)`)}`);
	},
} as const;

export const highlight = {
	file: (text: string): string => green(text),
	package: (text: string): string => cyan(text),
	path: (text: string): string => green(text),
	option: (text: string): string => grey(text),
	dim: (text: string): string => grey(text),
} as const;
