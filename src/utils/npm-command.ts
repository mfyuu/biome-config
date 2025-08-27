import { spawn } from "node:child_process";
import ora from "ora";

/**
 * Run npm pkg set command with proper Windows support
 */
export function runNpmPkgSet(cwd: string, kv: string): Promise<void> {
	// npm pkg set <key>=<value>
	return new Promise((resolve, reject) => {
		const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
		const child = spawn(npmCmd, ["pkg", "set", kv], {
			cwd,
			stdio: "pipe",
			shell: false,
			windowsHide: true,
		});

		let stderr = "";
		child.stderr.on("data", (d) => {
			stderr += d.toString();
		});

		child.on("close", (code) => {
			if (code === 0) return resolve();
			reject(new Error(stderr.trim() || `Command failed: npm pkg set ${kv}`));
		});

		child.on("error", (err) => reject(err));
	});
}

/**
 * Create a spinner with OS-specific settings
 */
export function createSpinner(text = "Working...") {
	return ora({
		text,
		spinner: process.platform === "win32" ? "line" : "dots",
	});
}
