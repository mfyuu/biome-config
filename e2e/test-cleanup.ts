import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Test temporary directory cleanup utility
 */

// Register cleanup on process exit
const tempDirsToClean = new Set<string>();

// Auto-cleanup on process exit
process.on("exit", () => {
	for (const dir of tempDirsToClean) {
		try {
			// Use synchronous version (async not available in exit event)
			require("node:fs").rmSync(dir, { recursive: true, force: true });
			console.log(`Cleaned up: ${dir}`);
		} catch (err) {
			console.error(`Failed to clean up ${dir}:`, err);
		}
	}
});

// Cleanup on signals like Ctrl+C
process.on("SIGINT", () => {
	console.log("\nCleaning up test directories...");
	process.exit(130); // Triggers exit event
});

process.on("SIGTERM", () => {
	console.log("\nCleaning up test directories...");
	process.exit(143);
});

// Cleanup on unhandled errors
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	process.exit(1);
});

/**
 * Create temporary directory (with auto-cleanup feature)
 */
export async function createTestTempDir(
	prefix = "biome-config-e2e-",
): Promise<string> {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
	tempDirsToClean.add(tempDir);
	return tempDir;
}

/**
 * Manually cleanup temporary directory
 */
export async function cleanupTestTempDir(tempDir: string): Promise<void> {
	try {
		await fs.rm(tempDir, { recursive: true, force: true });
		tempDirsToClean.delete(tempDir);
	} catch (err) {
		console.error(`Failed to cleanup ${tempDir}:`, err);
	}
}

/**
 * Clean up old temporary directories (older than 1 day)
 */
export async function cleanupOldTestDirs(maxAgeHours = 24): Promise<void> {
	const tmpDir = os.tmpdir();
	const entries = await fs.readdir(tmpDir);
	const now = Date.now();
	const maxAge = maxAgeHours * 60 * 60 * 1000;

	for (const entry of entries) {
		if (entry.startsWith("biome-config-e2e-")) {
			const fullPath = path.join(tmpDir, entry);
			try {
				const stats = await fs.stat(fullPath);
				if (now - stats.mtimeMs > maxAge) {
					await fs.rm(fullPath, { recursive: true, force: true });
					console.log(`Cleaned up old test directory: ${entry}`);
				}
			} catch {
				// Ignore if file is already deleted
			}
		}
	}
}
