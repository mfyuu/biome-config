import { spawn } from "cross-spawn";
import ora from "ora";

/**
 * Run npm pkg set command (cross-platform, CI-friendly).
 * - Uses cross-spawn to avoid Windows .cmd quirks and quoting issues.
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
