import { cyan, green, grey } from "kleur/colors";
import logSymbols from "log-symbols";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { highlight, logger } from "./logger";

describe("logger", () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("info", () => {
		it("should output info message", () => {
			logger.info("test message");
			expect(consoleLogSpy).toHaveBeenCalledWith(
				logSymbols.info,
				"test message",
			);
		});

		it("should output multiple messages", () => {
			logger.info("message1", "message2", "message3");
			expect(consoleLogSpy).toHaveBeenCalledWith(
				logSymbols.info,
				"message1",
				"message2",
				"message3",
			);
		});
	});

	describe("success", () => {
		it("should output success message", () => {
			logger.success("operation completed");
			expect(consoleLogSpy).toHaveBeenCalledWith(
				logSymbols.success,
				"operation completed",
			);
		});

		it("should output multiple success messages", () => {
			logger.success("step 1", "step 2");
			expect(consoleLogSpy).toHaveBeenCalledWith(
				logSymbols.success,
				"step 1",
				"step 2",
			);
		});
	});

	describe("warning", () => {
		it("should output warning message", () => {
			logger.warning("warning message");
			expect(consoleLogSpy).toHaveBeenCalledWith(
				logSymbols.warning,
				"warning message",
			);
		});

		it("should output multiple warning messages", () => {
			logger.warning("warning 1", "warning 2");
			expect(consoleLogSpy).toHaveBeenCalledWith(
				logSymbols.warning,
				"warning 1",
				"warning 2",
			);
		});
	});

	describe("error", () => {
		it("should output error message", () => {
			logger.error("error occurred");
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				logSymbols.error,
				"error occurred",
			);
		});

		it("should output multiple error messages", () => {
			logger.error("error 1", "error 2", "error 3");
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				logSymbols.error,
				"error 1",
				"error 2",
				"error 3",
			);
		});

		it("should verify using console.error", () => {
			logger.error("test");
			expect(consoleErrorSpy).toHaveBeenCalled();
			expect(consoleLogSpy).not.toHaveBeenCalled();
		});
	});

	describe("code", () => {
		it("should format and output command", () => {
			logger.code("npm install");
			expect(consoleLogSpy).toHaveBeenCalledTimes(3);
			expect(consoleLogSpy).toHaveBeenNthCalledWith(1);
			expect(consoleLogSpy).toHaveBeenNthCalledWith(2, grey("  $ npm install"));
			expect(consoleLogSpy).toHaveBeenNthCalledWith(3);
		});

		it("should display long commands correctly", () => {
			const longCommand =
				"npm install --save-dev @biomejs/biome @mfyuu/biome-config";
			logger.code(longCommand);
			expect(consoleLogSpy).toHaveBeenNthCalledWith(
				2,
				grey(`  $ ${longCommand}`),
			);
		});
	});

	describe("finalSuccess", () => {
		it("should output final success message", () => {
			logger.finalSuccess("All tasks completed!");
			expect(consoleLogSpy).toHaveBeenCalledTimes(3);
			expect(consoleLogSpy).toHaveBeenNthCalledWith(1);
			expect(consoleLogSpy).toHaveBeenNthCalledWith(
				2,
				`${green("Success!")} All tasks completed!`,
			);
			expect(consoleLogSpy).toHaveBeenNthCalledWith(3);
		});

		it("should verify surrounded by empty lines", () => {
			logger.finalSuccess("Done");
			const calls = consoleLogSpy.mock.calls;
			expect(calls[0]).toEqual([]);
			expect(calls[1][0]).toContain("Success!");
			expect(calls[2]).toEqual([]);
		});
	});

	describe("hooksSync", () => {
		it("should output hooks sync message with correct formatting", () => {
			logger.hooksSync();
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				`${cyan("sync hooks:")} ${grey(`✔ (pre-commit, pre-push)`)}`,
			);
		});

		it("should use cyan color for label and grey for hooks", () => {
			logger.hooksSync();
			const calledWith = consoleLogSpy.mock.calls[0][0];
			expect(calledWith).toContain(cyan("sync hooks:"));
			expect(calledWith).toContain(grey("✔ (pre-commit, pre-push)"));
		});
	});
});

describe("highlight", () => {
	it("should highlight file names in green", () => {
		const result = highlight.file("package.json");
		expect(result).toBe(green("package.json"));
	});

	it("should highlight package names in cyan", () => {
		const result = highlight.package("@biomejs/biome");
		expect(result).toBe(cyan("@biomejs/biome"));
	});

	it("should highlight paths in green", () => {
		const result = highlight.path("/usr/local/bin");
		expect(result).toBe(green("/usr/local/bin"));
	});

	it("should highlight options in grey color", () => {
		const result = highlight.option("--force");
		expect(result).toBe(grey("--force"));
	});

	it("should combine multiple highlights", () => {
		const message = `Installing ${highlight.package("biome")} to ${highlight.path("/project")}`;
		expect(message).toBe(`Installing ${cyan("biome")} to ${green("/project")}`);
	});
});
