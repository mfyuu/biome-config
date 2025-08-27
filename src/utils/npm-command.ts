import { spawn } from "node:child_process";
import ora from "ora";

/**
 * Run npm pkg set command with proper Windows support
 */
export function runNpmPkgSet(cwd: string, kv: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const isWindows = process.platform === "win32";
		const npmCmd = isWindows ? "npm.cmd" : "npm";

		// No additional quoting needed with shell:false
		// Values with spaces or '=' are safely passed as single argument
		const args = ["pkg", "set", kv];

		const child = spawn(npmCmd, args, {
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
 * Create a spinner with unified style across all platforms
 */
export function createSpinner(text = "Working...") {
	return ora({
		text,
		spinner: "dots",
	});
}
