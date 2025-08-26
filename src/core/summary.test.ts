import { green, red, yellow } from "kleur/colors";
import logSymbols from "log-symbols";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskResult } from "../types/index";
import { showSetupSummary } from "./summary";

// Mock setup
vi.mock("../utils/logger", () => ({
	logger: {
		finalSuccess: vi.fn(),
	},
	highlight: {
		file: (text: string) => text,
		package: (text: string) => text,
		path: (text: string) => text,
		option: (text: string) => text,
	},
}));

// Mock log-symbols for consistent cross-platform behavior
vi.mock("log-symbols", () => ({
	default: {
		success: "✔",
		error: "✖",
		warning: "⚠",
	},
}));

// Mock kleur/colors for consistent output
vi.mock("kleur/colors", () => ({
	green: (str: string) => str,
	red: (str: string) => str,
	yellow: (str: string) => str,
}));

describe("summary", () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("showSetupSummary", () => {
		it("should display all tasks successful", () => {
			const tasks: TaskResult = {
				dependencies: { status: "success", message: "installed" },
				biomeConfig: { status: "success", message: "created" },
				scripts: { status: "success", message: "added" },
				settingsFile: { status: "success", message: "created" },
				lefthook: { status: "success", message: "created" },
			};

			showSetupSummary(tasks);

			// Verify progress bar
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("["));
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("5/5 completed"),
			);

			// Verify each task status
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(logSymbols.success),
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("Dependencies"),
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("Biome Config"),
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("VS Code Settings"),
			);
		});

		it("should display partial task failures", () => {
			const tasks: TaskResult = {
				dependencies: { status: "success", message: "installed" },
				biomeConfig: { status: "error", message: "failed" },
				scripts: { status: "success", message: "added" },
				settingsFile: { status: "success", message: "created" },
				lefthook: { status: "success", message: "created" },
			};

			showSetupSummary(tasks);

			// Verify progress bar
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("4/5 completed"),
			);

			// Verify error icon
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(logSymbols.error),
			);
		});

		it("should display all tasks skipped", () => {
			const tasks: TaskResult = {
				dependencies: { status: "skipped", message: "skipped" },
				biomeConfig: { status: "skipped", message: "skipped" },
				scripts: { status: "skipped", message: "skipped" },
				settingsFile: { status: "skipped", message: "skipped" },
				lefthook: { status: "skipped", message: "skipped" },
			};

			showSetupSummary(tasks);

			// Verify progress bar
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("0/5 completed"),
			);

			// Verify warning icon
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(logSymbols.warning),
			);
		});

		it("should display mixed status", () => {
			const tasks: TaskResult = {
				dependencies: { status: "success", message: "installed" },
				biomeConfig: { status: "skipped", message: "already exists" },
				scripts: { status: "success", message: "added" },
				settingsFile: { status: "error", message: "permission denied" },
				lefthook: { status: "skipped", message: "skipped" },
			};

			showSetupSummary(tasks);

			// Verify progress bar
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("2/5 completed"),
			);

			// Verify various icons
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(logSymbols.success),
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(logSymbols.warning),
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining(logSymbols.error),
			);
		});

		it("should calculate progress bar", () => {
			const tasks: TaskResult = {
				dependencies: { status: "success" },
				biomeConfig: { status: "success" },
				scripts: { status: "success" },
				settingsFile: { status: "skipped" },
				lefthook: { status: "success" },
			};

			showSetupSummary(tasks);

			// 4/5 complete = approximately 80% progress bar
			const calls = consoleLogSpy.mock.calls.flat().join("\n");
			expect(calls).toContain("4/5 completed");
			// Verify progress bar is displayed
			expect(calls).toContain("[");
			expect(calls).toContain("]");
		});

		it("should display colored messages", () => {
			const tasks: TaskResult = {
				dependencies: { status: "success", message: "installed" },
				biomeConfig: { status: "error", message: "failed" },
				scripts: { status: "success", message: "added" },
				settingsFile: { status: "skipped", message: "skipped" },
				lefthook: { status: "skipped", message: "skipped" },
			};

			showSetupSummary(tasks);

			const calls = consoleLogSpy.mock.calls.flat().join("\n");

			// Success is green
			expect(calls).toContain(green("(installed)"));
			// Error is red
			expect(calls).toContain(red("(failed)"));
			// Skip is yellow
			expect(calls).toContain(yellow("(skipped)"));
		});

		it("should work without messages", () => {
			const tasks: TaskResult = {
				dependencies: { status: "success" },
				biomeConfig: { status: "error" },
				scripts: { status: "success" },
				settingsFile: { status: "skipped" },
				lefthook: { status: "skipped" },
			};

			showSetupSummary(tasks);

			// Icon and name are displayed even without message
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("Dependencies"),
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("Biome Config"),
			);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("VS Code Settings"),
			);
		});

		it("should match snapshot for success/failure patterns", () => {
			// Combine all success and partial failure cases
			const successTasks: TaskResult = {
				dependencies: { status: "success", message: "installed" },
				biomeConfig: { status: "success", message: "created" },
				scripts: { status: "success", message: "added" },
				settingsFile: { status: "success", message: "created" },
				lefthook: { status: "success", message: "created" },
			};

			const mixedTasks: TaskResult = {
				dependencies: { status: "success", message: "installed" },
				biomeConfig: { status: "error", message: "failed" },
				scripts: { status: "success", message: "added" },
				settingsFile: { status: "success", message: "created" },
				lefthook: { status: "skipped", message: "skipped" },
			};

			showSetupSummary(successTasks);
			const successOutput = consoleLogSpy.mock.calls
				.map((call) => call.join(" "))
				.join("\n");
			expect(successOutput).toMatchSnapshot("success-failure-patterns");

			consoleLogSpy.mockClear();
			showSetupSummary(mixedTasks);
			const mixedOutput = consoleLogSpy.mock.calls
				.map((call) => call.join(" "))
				.join("\n");
			expect(mixedOutput).toMatchSnapshot("success-failure-mixed");
		});

		it("should match snapshot for skipped/mixed status patterns", () => {
			// Combine all skip and mixed status cases
			const skippedTasks: TaskResult = {
				dependencies: { status: "skipped", message: "skipped" },
				biomeConfig: { status: "skipped", message: "skipped" },
				scripts: { status: "skipped", message: "skipped" },
				settingsFile: { status: "skipped", message: "skipped" },
				lefthook: { status: "skipped", message: "skipped" },
			};

			const complexMixedTasks: TaskResult = {
				dependencies: { status: "success", message: "installed" },
				biomeConfig: { status: "skipped", message: "already exists" },
				scripts: { status: "success", message: "added" },
				settingsFile: { status: "error", message: "permission denied" },
				lefthook: { status: "success", message: "created" },
			};

			showSetupSummary(skippedTasks);
			const skippedOutput = consoleLogSpy.mock.calls
				.map((call) => call.join(" "))
				.join("\n");
			expect(skippedOutput).toMatchSnapshot("skipped-mixed-patterns");

			consoleLogSpy.mockClear();
			showSetupSummary(complexMixedTasks);
			const complexOutput = consoleLogSpy.mock.calls
				.map((call) => call.join(" "))
				.join("\n");
			expect(complexOutput).toMatchSnapshot("complex-mixed-status");
		});

		it("should calculate full width progress bar", () => {
			// Full bar is displayed when all succeed
			const tasksAllSuccess: TaskResult = {
				dependencies: { status: "success" },
				biomeConfig: { status: "success" },
				scripts: { status: "success" },
				settingsFile: { status: "success" },
				lefthook: { status: "success" },
			};

			showSetupSummary(tasksAllSuccess);

			const successCalls = consoleLogSpy.mock.calls.flat().join("\n");
			expect(successCalls).toContain("5/5 completed");

			// Reset
			consoleLogSpy.mockClear();

			// Empty bar is displayed when all fail
			const tasksAllFailed: TaskResult = {
				dependencies: { status: "error" },
				biomeConfig: { status: "error" },
				scripts: { status: "error" },
				settingsFile: { status: "error" },
				lefthook: { status: "error" },
			};

			showSetupSummary(tasksAllFailed);

			const failedCalls = consoleLogSpy.mock.calls.flat().join("\n");
			expect(failedCalls).toContain("0/5 completed");
		});
	});
});
