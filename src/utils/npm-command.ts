import { spawn } from "cross-spawn";
import ora from "ora";

/**
 * Options for running a command
 */
type CommandOptions = {
	/** Timeout in milliseconds (default: 60000) */
	timeout?: number;
	/** Whether to suppress stdout output (default: true) */
	silent?: boolean;
};

/**
 * Run npm pkg set command (cross-platform, CI-friendly).
 * - Uses cross-spawn to avoid Windows .cmd quirks and quoting issues.
 * - Uses spawn instead of execSync for better error handling and timeout control
 */
export function runNpmPkgSet(cwd: string, kv: string): Promise<void> {
	// Minimal-but-safe validation
	const firstEq = kv.indexOf("=");
	if (firstEq <= 0 || firstEq === kv.length - 1) {
		return Promise.reject(
			new Error(`Invalid format: "${kv}". Expected "key=value".`),
		);
	}

	const key = kv.slice(0, firstEq).trim(); // prevent accidental " key"
	const value = kv.slice(firstEq + 1); // keep as-is (spaces may be intentional)
	if (key.length === 0) {
		return Promise.reject(
			new Error(`Invalid key in "${kv}". Key must be non-empty.`),
		);
	}
	if (value.length === 0) {
		return Promise.reject(
			new Error(
				`Invalid value in "${kv}". Value must be non-empty. If you meant to remove a field, use "npm pkg delete <key>".`,
			),
		);
	}
	// Hard block newline/NUL for safety across shells/CI
	if (/[\r\n\0]/.test(kv)) {
		return Promise.reject(
			new Error(`Invalid characters (newline/NUL) in "${kv}".`),
		);
	}

	// npm pkg set <key>=<value>
	return new Promise((resolve, reject) => {
		// cross-spawn handles npm(.cmd) resolution & quoting for us
		const child = spawn("npm", ["pkg", "set", kv], {
			cwd,
			stdio: "pipe",
			windowsHide: true,
		});

		let stderr = "";
		child.stderr.on("data", (d) => {
			stderr += String(d);
		});

		child.on("close", (code) => {
			if (code === 0) return resolve();
			reject(new Error(stderr.trim() || `Command failed: npm pkg set ${kv}`));
		});

		child.on("error", (err) => reject(err));
	});
}

/**
 * Create a spinner with unified style across all platforms
 */
export function createSpinner(text = "Working...") {
	return ora({
		text,
		spinner: "dots",
	});
}

/**
 * Run a command using cross-spawn (cross-platform, CI-friendly).
 * This is a generic version for running any command.
 *
 * Uses spawn instead of execSync to provide:
 * - Custom loading UI (spinner) for better UX on slow operations
 * - Timeout control to prevent hanging
 * - Flexible stdio handling (silent vs verbose modes)
 *
 * @param command - The command to execute
 * @param args - Arguments for the command
 * @param cwd - Working directory
 * @param options - Optional configuration for timeout and output handling
 */
export function runCommand(
	command: string,
	args: string[],
	cwd: string,
	options?: CommandOptions,
): Promise<void> {
	const { timeout = 60000, silent = true } = options || {};

	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd,
			stdio: silent ? "pipe" : ["inherit", "inherit", "pipe"],
			windowsHide: true,
		});

		let stderr = "";
		let timeoutId: NodeJS.Timeout | undefined;
		let forceKillTimeoutId: NodeJS.Timeout | undefined;
		let isSettled = false;
		let timedOut = false;

		const cleanup = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}
			if (forceKillTimeoutId) {
				clearTimeout(forceKillTimeoutId);
				forceKillTimeoutId = undefined;
			}
		};

		const settle = (settler: () => void) => {
			if (!isSettled) {
				isSettled = true;
				cleanup();
				settler();
			}
		};

		// Set up timeout
		if (timeout > 0) {
			timeoutId = setTimeout(() => {
				if (isSettled) return; // Already completed

				timedOut = true;
				child.kill("SIGTERM");
				// Force kill if it doesn't terminate gracefully
				forceKillTimeoutId = setTimeout(() => {
					if (!isSettled && child.exitCode === null) {
						child.kill("SIGKILL");
					}
				}, 5000);
			}, timeout);
		}

		// Only capture stderr since stdout might be inherited
		if (child.stderr) {
			child.stderr.on("data", (d) => {
				stderr += String(d);
			});
		}

		child.on("close", (code) => {
			if (timedOut) {
				settle(() =>
					reject(
						new Error(
							`Command timed out after ${timeout}ms: ${command} ${args.join(" ")}`,
						),
					),
				);
			} else if (code === 0) {
				settle(() => resolve());
			} else {
				settle(() =>
					reject(
						new Error(
							stderr.trim() ||
								`Command failed with exit code ${code}: ${command} ${args.join(" ")}`,
						),
					),
				);
			}
		});

		child.on("error", (err) => {
			if (!timedOut) {
				settle(() => reject(err));
			}
		});
	});
}
