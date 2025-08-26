import { type ExecException, execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	cleanupOldTestDirs,
	cleanupTestTempDir,
	createTestTempDir,
} from "./test-cleanup";

/**
 * Helper function to expect command failure and verify error message
 * Captures standard error output and suppresses display
 */
function expectCommandToFail(
	command: string,
	options: {
		cwd: string;
		expectedError?: string;
		timeout?: number;
	},
): void {
	let stderr = "";
	let exitCode = 0;

	try {
		execSync(command, {
			cwd: options.cwd,
			encoding: "utf-8",
			stdio: "pipe", // Hide error output and capture internally
			timeout: options.timeout || 5000,
		});
		throw new Error("Command should have failed but succeeded");
	} catch (error) {
		const execError = error as ExecException & {
			status?: number;
			stderr?: Buffer | string;
		};

		// Check error message
		if (execError.message === "Command should have failed but succeeded") {
			throw error;
		}

		stderr = execError.stderr?.toString() || "";
		exitCode = execError.status || 1;

		// Ensure exit code is not 0
		expect(exitCode).not.toBe(0);

		// Verify expected error message is included
		if (options.expectedError) {
			expect(stderr).toContain(options.expectedError);
		}
	}
}

describe("E2E: biome-config init", () => {
	let tempDir: string;
	let originalCwd: string;

	beforeAll(async () => {
		// Clean up old temporary directories before tests (older than 24 hours)
		await cleanupOldTestDirs(24);
	});

	beforeEach(async () => {
		// Create temporary directory (with auto-cleanup feature)
		tempDir = await createTestTempDir();
		originalCwd = process.cwd();

		// Set up test project
		await fs.writeFile(
			path.join(tempDir, "package.json"),
			JSON.stringify(
				{
					name: "test-project",
					version: "1.0.0",
					devDependencies: {},
				},
				null,
				2,
			),
		);

		// Initialize Git repository
		execSync("git init", { cwd: tempDir });
		execSync("git config user.email 'test@example.com'", { cwd: tempDir });
		execSync("git config user.name 'Test User'", { cwd: tempDir });
	});

	afterEach(async () => {
		// Cleanup
		process.chdir(originalCwd);
		await cleanupTestTempDir(tempDir);
	});

	it("should execute init command successfully", async () => {
		// Get CLI path (use built version)
		const cliPath = path.resolve("./dist/cli");

		// Execute command (skip dependency installation with --skip-deps)
		const output = execSync(`node ${cliPath} --skip-deps --biome-only`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Verify biome.jsonc was created
		const biomeConfigPath = path.join(tempDir, "biome.jsonc");
		const biomeConfigExists = await fs
			.access(biomeConfigPath)
			.then(() => true)
			.catch(() => false);
		expect(biomeConfigExists).toBe(true);

		// Verify .vscode/settings.json was created
		const vscodeSettingsPath = path.join(tempDir, ".vscode", "settings.json");
		const vscodeSettingsExists = await fs
			.access(vscodeSettingsPath)
			.then(() => true)
			.catch(() => false);
		expect(vscodeSettingsExists).toBe(true);

		// Verify output contains Success message
		expect(output).toContain("Biome configuration setup completed");
	});

	it("should apply React configuration with --type option", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Execute command with React configuration
		execSync(`node ${cliPath} --type react --skip-deps`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Check biome.jsonc content
		const biomeConfigPath = path.join(tempDir, "biome.jsonc");
		const biomeConfig = await fs.readFile(biomeConfigPath, "utf-8");

		// Verify React configuration is included
		expect(biomeConfig).toContain("@mfyuu/biome-config/react");
	});

	it("should overwrite existing files with --force option", async () => {
		const cliPath = path.resolve("./dist/cli");

		// First execution
		execSync(`node ${cliPath} --skip-deps --biome-only`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Modify existing biome.jsonc
		const biomeConfigPath = path.join(tempDir, "biome.jsonc");
		await fs.writeFile(biomeConfigPath, "// Custom config\n{}");

		// Overwrite with --force option
		execSync(`node ${cliPath} --force --skip-deps --biome-only`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Verify file was overwritten
		const newContent = await fs.readFile(biomeConfigPath, "utf-8");
		expect(newContent).not.toContain("// Custom config");
		expect(newContent).toContain("@mfyuu/biome-config");
	});

	it("should work even without package.json", async () => {
		// Delete package.json
		await fs.unlink(path.join(tempDir, "package.json"));

		const cliPath = path.resolve("./dist/cli");

		// Can execute without package.json (explicitly specify type)
		execSync(`node ${cliPath} --type base --skip-deps --biome-only`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Verify biome.jsonc was created
		const biomeConfigPath = path.join(tempDir, "biome.jsonc");
		const biomeConfigExists = await fs
			.access(biomeConfigPath)
			.then(() => true)
			.catch(() => false);
		expect(biomeConfigExists).toBe(true);
	});

	it("should use current directory instead of Git root with --local option", async () => {
		// Create subdirectory
		const subDir = path.join(tempDir, "packages", "app");
		await fs.mkdir(path.join(tempDir, "packages"), { recursive: true });
		await fs.mkdir(subDir, { recursive: true });

		// Create package.json in subdirectory
		await fs.writeFile(
			path.join(subDir, "package.json"),
			JSON.stringify(
				{
					name: "app",
					version: "1.0.0",
				},
				null,
				2,
			),
		);

		const cliPath = path.resolve("./dist/cli");

		// Execute with --local option
		execSync(`node ${cliPath} --local --skip-deps`, {
			cwd: subDir,
			encoding: "utf-8",
		});

		// Verify configuration file was created in subdirectory
		const localBiomeConfig = path.join(subDir, "biome.jsonc");
		const exists = await fs
			.access(localBiomeConfig)
			.then(() => true)
			.catch(() => false);
		expect(exists).toBe(true);

		// Verify not created in root directory
		const rootBiomeConfig = path.join(tempDir, "biome.jsonc");
		const rootExists = await fs
			.access(rootBiomeConfig)
			.then(() => true)
			.catch(() => false);
		expect(rootExists).toBe(false);
	});

	it("should handle error when multiple package manager options are specified", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Should throw error when multiple package managers are specified
		expectCommandToFail(
			`node ${cliPath} --use-npm --use-yarn --skip-deps --force --biome-only`,
			{
				cwd: tempDir,
				expectedError: "Multiple package managers specified",
			},
		);
	});

	it("should display version information with --version option", async () => {
		const cliPath = path.resolve("./dist/cli");

		const output = execSync(`node ${cliPath} --version`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Verify version number is included
		expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
	});

	it("should apply Next.js configuration with --type option", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Execute command with Next.js configuration
		execSync(`node ${cliPath} --type next --skip-deps`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Check biome.jsonc content
		const biomeConfigPath = path.join(tempDir, "biome.jsonc");
		const biomeConfig = await fs.readFile(biomeConfigPath, "utf-8");

		// Verify Next.js configuration is included
		expect(biomeConfig).toContain("@mfyuu/biome-config/next");
	});

	it("should throw error with invalid --type value", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Execute error test using helper function (error output is suppressed)
		expectCommandToFail(`node ${cliPath} --type invalid --skip-deps`, {
			cwd: tempDir,
			expectedError: "Invalid type",
		});
	});

	it("should create biome-only VSCode settings with --biome-only flag", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Execute with --biome-only flag
		execSync(`node ${cliPath} --biome-only --skip-deps`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Check VSCode settings file was created
		const settingsPath = path.join(tempDir, ".vscode", "settings.json");
		const settingsExists = await fs
			.access(settingsPath)
			.then(() => true)
			.catch(() => false);
		expect(settingsExists).toBe(true);

		// Read and verify settings content (should not have prettier configuration)
		const settingsContent = await fs.readFile(settingsPath, "utf-8");
		const settings = JSON.parse(settingsContent);

		// Should have biome as default formatter
		expect(settings["editor.defaultFormatter"]).toBe("biomejs.biome");
		// Should not have prettier settings for markdown
		expect(settings["[markdown]"]).toBeUndefined();
	});

	it("should create with-prettier VSCode settings with --with-prettier flag", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Execute with --with-prettier flag
		execSync(`node ${cliPath} --with-prettier --skip-deps`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Check VSCode settings file was created
		const settingsPath = path.join(tempDir, ".vscode", "settings.json");
		const settingsExists = await fs
			.access(settingsPath)
			.then(() => true)
			.catch(() => false);
		expect(settingsExists).toBe(true);

		// Read and verify settings content (should have prettier for markdown)
		const settingsContent = await fs.readFile(settingsPath, "utf-8");
		const settings = JSON.parse(settingsContent);

		// Should have prettier settings for markdown
		expect(settings["[markdown]"]).toBeDefined();
		expect(settings["[markdown]"]["editor.defaultFormatter"]).toBe(
			"esbenp.prettier-vscode",
		);
	});

	it("should error when both --biome-only and --with-prettier flags are used", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Execute error test using helper function
		expectCommandToFail(
			`node ${cliPath} --biome-only --with-prettier --skip-deps`,
			{
				cwd: tempDir,
				expectedError: "Cannot use both",
			},
		);
	});

	it("should use force flag with formatter options", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Create existing VSCode settings file
		const vscodeDir = path.join(tempDir, ".vscode");
		await fs.mkdir(vscodeDir, { recursive: true });
		await fs.writeFile(
			path.join(vscodeDir, "settings.json"),
			JSON.stringify({ "editor.fontSize": 14 }),
		);

		// Execute with force and biome-only flags
		execSync(`node ${cliPath} --force --biome-only --skip-deps`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Verify file was overwritten with biome-only template
		const settingsPath = path.join(tempDir, ".vscode", "settings.json");
		const settingsContent = await fs.readFile(settingsPath, "utf-8");
		const settings = JSON.parse(settingsContent);

		// Should not have the original fontSize setting
		expect(settings["editor.fontSize"]).toBeUndefined();
		// Should have biome formatter
		expect(settings["editor.defaultFormatter"]).toBe("biomejs.biome");
	});

	it("should create lefthook.yml with --lefthook flag", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Execute with --lefthook flag
		execSync(`node ${cliPath} --lefthook --skip-deps --biome-only`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Verify lefthook.yml was created
		const lefthookPath = path.join(tempDir, "lefthook.yml");
		const lefthookExists = await fs
			.access(lefthookPath)
			.then(() => true)
			.catch(() => false);
		expect(lefthookExists).toBe(true);

		// Verify lefthook.yml contains biome check commands
		const lefthookContent = await fs.readFile(lefthookPath, "utf-8");
		expect(lefthookContent).toContain("pre-commit");
		expect(lefthookContent).toContain("biome check");

		// Verify package.json has prepare script
		const packageJsonPath = path.join(tempDir, "package.json");
		const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
		const packageJson = JSON.parse(packageJsonContent);
		expect(packageJson.scripts?.prepare).toBe("lefthook install");
	});

	it("should use correct package manager template for lefthook", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Create pnpm-lock.yaml to indicate pnpm usage
		await fs.writeFile(path.join(tempDir, "pnpm-lock.yaml"), "");

		// Execute with --lefthook flag
		execSync(`node ${cliPath} --lefthook --skip-deps --biome-only`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Check lefthook.yml uses pnpm commands
		const lefthookPath = path.join(tempDir, "lefthook.yml");
		const lefthookContent = await fs.readFile(lefthookPath, "utf-8");
		expect(lefthookContent).toContain("pnpm exec biome check");
	});

	it("should overwrite existing lefthook.yml with --force flag", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Create existing lefthook.yml
		const lefthookPath = path.join(tempDir, "lefthook.yml");
		await fs.writeFile(lefthookPath, "# Custom lefthook config\n");

		// Execute with --force and --lefthook flags
		execSync(`node ${cliPath} --force --lefthook --skip-deps --biome-only`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Verify file was overwritten
		const newContent = await fs.readFile(lefthookPath, "utf-8");
		expect(newContent).not.toContain("# Custom lefthook config");
		expect(newContent).toContain("pre-commit");
		expect(newContent).toContain("biome check");
	});

	it("should not prompt for lefthook when formatter flags are present", async () => {
		const cliPath = path.resolve("./dist/cli");

		// Execute with formatter flag (should not create lefthook without explicit --lefthook)
		execSync(`node ${cliPath} --biome-only --skip-deps`, {
			cwd: tempDir,
			encoding: "utf-8",
		});

		// Verify lefthook.yml was NOT created
		const lefthookPath = path.join(tempDir, "lefthook.yml");
		const lefthookExists = await fs
			.access(lefthookPath)
			.then(() => true)
			.catch(() => false);
		expect(lefthookExists).toBe(false);

		// Verify package.json does not have prepare script
		const packageJsonPath = path.join(tempDir, "package.json");
		const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
		const packageJson = JSON.parse(packageJsonContent);
		expect(packageJson.scripts?.prepare).toBeUndefined();
	});
});
