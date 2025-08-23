export const logger = {
	info: (...messages: string[]): void => {
		console.log(...messages);
	},

	warning: (...messages: string[]): void => {
		console.log(...messages);
	},

	error: (...messages: string[]): void => {
		console.error(...messages);
	},
} as const;
