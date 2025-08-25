import * as kleur from "kleur/colors";

export const logger = {
	info: (...messages: string[]): void => {
		console.log(kleur.cyan("ℹ"), ...messages);
	},

	success: (...messages: string[]): void => {
		console.log(kleur.green("✔"), ...messages);
	},

	warning: (...messages: string[]): void => {
		console.log(kleur.yellow("⚠"), ...messages);
	},

	error: (...messages: string[]): void => {
		console.error(kleur.red("✖"), ...messages);
	},

	code: (command: string): void => {
		console.log();
		console.log(kleur.gray(`  $ ${command}`));
		console.log();
	},
} as const;

export const highlight = {
	file: (text: string): string => kleur.bold(kleur.cyan(text)),
	package: (text: string): string => kleur.bold(text),
	path: (text: string): string => kleur.dim(text),
	option: (text: string): string => kleur.gray(text),
} as const;
