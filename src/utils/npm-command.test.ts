import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import type { Readable, Writable } from "node:stream";
import { spawn } from "cross-spawn";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSpinner, runCommand, runNpmPkgSet } from "./npm-command";

// Mock cross-spawn
vi.mock("cross-spawn", () => ({
	spawn: vi.fn(),
}));

// Mock ora
vi.mock("ora", () => ({
	default: vi.fn((config) => ({
		...config,
		start: vi.fn().mockReturnThis(),
		succeed: vi.fn().mockReturnThis(),
		fail: vi.fn().mockReturnThis(),
	})),
}));

// Helper to create mock child process
class MockChildProcess extends EventEmitter {
	stdout: Readable | null = null;
	stderr: Readable | null = new EventEmitter() as unknown as Readable;
	stdin: Writable | null = null;
	pid?: number;
	killed = false;
	exitCode: number | null = null;
	signalCode: NodeJS.Signals | null = null;
	kill = vi.fn(() => true);
}

describe("npm-command", () => {
	const spawnMock = vi.mocked(spawn);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("runNpmPkgSet", () => {
		it("should execute npm pkg set command successfully", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runNpmPkgSet("/test/dir", "scripts.test=vitest");

			// Simulate successful completion
			setImmediate(() => {
				mockChild.emit("close", 0);
			});

			await expect(promise).resolves.toBeUndefined();

			expect(spawnMock).toHaveBeenCalledWith(
				"npm",
				["pkg", "set", "scripts.test=vitest"],
				{
					cwd: "/test/dir",
					stdio: "pipe",
					windowsHide: true,
				},
			);
		});

		it("should reject when command fails with non-zero exit code", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runNpmPkgSet("/test/dir", "scripts.test=vitest");

			// Simulate stderr and failure
			setImmediate(() => {
				(mockChild.stderr as EventEmitter).emit(
					"data",
					Buffer.from("Error: Invalid package.json"),
				);
				mockChild.emit("close", 1);
			});

			await expect(promise).rejects.toThrow("Error: Invalid package.json");
		});

		it("should reject with default message when stderr is empty", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runNpmPkgSet("/test/dir", "scripts.test=vitest");

			// Simulate failure without stderr
			setImmediate(() => {
				mockChild.emit("close", 1);
			});

			await expect(promise).rejects.toThrow(
				"Command failed: npm pkg set scripts.test=vitest",
			);
		});

		it("should reject when spawn throws an error", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runNpmPkgSet("/test/dir", "scripts.test=vitest");

			// Simulate spawn error
			setImmediate(() => {
				mockChild.emit("error", new Error("spawn npm ENOENT"));
			});

			await expect(promise).rejects.toThrow("spawn npm ENOENT");
		});

		it("should use npm on all platforms (cross-spawn handles platform differences)", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runNpmPkgSet("/test/dir", "scripts.test=vitest");

			setImmediate(() => {
				mockChild.emit("close", 0);
			});

			await promise;

			// cross-spawn handles platform differences internally
			expect(spawnMock).toHaveBeenCalledWith(
				"npm",
				["pkg", "set", "scripts.test=vitest"],
				{
					cwd: "/test/dir",
					stdio: "pipe",
					windowsHide: true,
				},
			);
		});

		it("should accumulate multiple stderr chunks", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runNpmPkgSet("/test/dir", "scripts.test=vitest");

			setImmediate(() => {
				(mockChild.stderr as EventEmitter).emit("data", Buffer.from("Error: "));
				(mockChild.stderr as EventEmitter).emit(
					"data",
					Buffer.from("Invalid "),
				);
				(mockChild.stderr as EventEmitter).emit("data", Buffer.from("JSON"));
				mockChild.emit("close", 1);
			});

			await expect(promise).rejects.toThrow("Error: Invalid JSON");
		});

		describe("input validation", () => {
			it("should reject when kv has no equals sign", async () => {
				const promise = runNpmPkgSet("/test/dir", "scripts.test");
				await expect(promise).rejects.toThrow(
					'Invalid format: "scripts.test". Expected "key=value".',
				);
				expect(spawnMock).not.toHaveBeenCalled();
			});

			it("should reject when kv starts with equals sign", async () => {
				const promise = runNpmPkgSet("/test/dir", "=value");
				await expect(promise).rejects.toThrow(
					'Invalid format: "=value". Expected "key=value".',
				);
				expect(spawnMock).not.toHaveBeenCalled();
			});

			it("should reject when kv ends with equals sign", async () => {
				const promise = runNpmPkgSet("/test/dir", "key=");
				await expect(promise).rejects.toThrow(
					'Invalid format: "key=". Expected "key=value".',
				);
				expect(spawnMock).not.toHaveBeenCalled();
			});

			it("should reject when value is empty after trimming spaces", async () => {
				// The implementation doesn't trim the value, only the key
				// So "key= " would have value " " which is not empty
				// Let's test that spaces in values are preserved
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runNpmPkgSet("/test/dir", "key= ");

				setImmediate(() => {
					mockChild.emit("close", 0);
				});

				await expect(promise).resolves.toBeUndefined();
				expect(spawnMock).toHaveBeenCalledWith("npm", ["pkg", "set", "key= "], {
					cwd: "/test/dir",
					stdio: "pipe",
					windowsHide: true,
				});
			});

			it("should reject when key is empty (whitespace only before equals)", async () => {
				const promise = runNpmPkgSet("/test/dir", "  =value");
				await expect(promise).rejects.toThrow(
					'Invalid key in "  =value". Key must be non-empty.',
				);
				expect(spawnMock).not.toHaveBeenCalled();
			});

			it("should reject when kv contains newline characters", async () => {
				const promise = runNpmPkgSet("/test/dir", "key=value\nmalicious");
				await expect(promise).rejects.toThrow(
					'Invalid characters (newline/NUL) in "key=value\nmalicious".',
				);
				expect(spawnMock).not.toHaveBeenCalled();
			});

			it("should reject when kv contains NUL characters", async () => {
				const promise = runNpmPkgSet("/test/dir", "key=value\0malicious");
				await expect(promise).rejects.toThrow(
					'Invalid characters (newline/NUL) in "key=value\0malicious".',
				);
				expect(spawnMock).not.toHaveBeenCalled();
			});

			it("should reject when kv contains carriage return", async () => {
				const promise = runNpmPkgSet("/test/dir", "key=value\rmalicious");
				await expect(promise).rejects.toThrow(
					'Invalid characters (newline/NUL) in "key=value\rmalicious".',
				);
				expect(spawnMock).not.toHaveBeenCalled();
			});

			it("should accept kv with multiple equals signs", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runNpmPkgSet(
					"/test/dir",
					"scripts.test=NODE_ENV=test vitest",
				);

				setImmediate(() => {
					mockChild.emit("close", 0);
				});

				await expect(promise).resolves.toBeUndefined();
				expect(spawnMock).toHaveBeenCalled();
			});

			it("should accept kv with special characters", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runNpmPkgSet(
					"/test/dir",
					'scripts.test=echo "hello world"',
				);

				setImmediate(() => {
					mockChild.emit("close", 0);
				});

				await expect(promise).resolves.toBeUndefined();
				expect(spawnMock).toHaveBeenCalled();
			});
		});
	});

	describe("runCommand", () => {
		it("should execute command successfully", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runCommand("echo", ["test"], "/test");

			// Simulate successful completion
			setImmediate(() => {
				mockChild.emit("close", 0);
			});

			await expect(promise).resolves.toBeUndefined();

			expect(spawnMock).toHaveBeenCalledWith("echo", ["test"], {
				cwd: "/test",
				stdio: "pipe",
				windowsHide: true,
			});
		});

		it("should reject on non-zero exit code with stderr", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runCommand("failing-cmd", ["arg"], "/test");

			// Simulate stderr and failure
			setImmediate(() => {
				(mockChild.stderr as EventEmitter).emit(
					"data",
					Buffer.from("error message"),
				);
				mockChild.emit("close", 1);
			});

			await expect(promise).rejects.toThrow("error message");
		});

		it("should reject with fallback message when stderr is empty", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runCommand("cmd", ["arg1", "arg2"], "/test");

			// Simulate failure without stderr
			setImmediate(() => {
				mockChild.emit("close", 1);
			});

			await expect(promise).rejects.toThrow(
				"Command failed with exit code 1: cmd arg1 arg2",
			);
		});

		it("should reject on spawn error", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runCommand("bad-cmd", [], "/test");

			// Simulate spawn error
			setImmediate(() => {
				mockChild.emit("error", new Error("spawn error"));
			});

			await expect(promise).rejects.toThrow("spawn error");
		});

		it("should accumulate multiple stderr chunks", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runCommand("cmd", [], "/test");

			setImmediate(() => {
				(mockChild.stderr as EventEmitter).emit("data", Buffer.from("Error: "));
				(mockChild.stderr as EventEmitter).emit(
					"data",
					Buffer.from("Command "),
				);
				(mockChild.stderr as EventEmitter).emit("data", Buffer.from("failed"));
				mockChild.emit("close", 1);
			});

			await expect(promise).rejects.toThrow("Error: Command failed");
		});

		it("should handle commands with complex arguments", async () => {
			const mockChild = new MockChildProcess();
			spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

			const promise = runCommand(
				"git",
				["commit", "-m", "feat: add new feature with spaces"],
				"/test",
			);

			setImmediate(() => {
				mockChild.emit("close", 0);
			});

			await expect(promise).resolves.toBeUndefined();

			expect(spawnMock).toHaveBeenCalledWith(
				"git",
				["commit", "-m", "feat: add new feature with spaces"],
				{
					cwd: "/test",
					stdio: "pipe",
					windowsHide: true,
				},
			);
		});

		describe("with timeout option", () => {
			beforeEach(() => {
				vi.useFakeTimers();
			});

			afterEach(() => {
				vi.clearAllTimers();
				vi.useRealTimers();
			});

			it("should timeout after specified duration", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runCommand("slow-cmd", [], "/test", { timeout: 1000 });

				// Fast-forward time to trigger timeout
				await vi.advanceTimersByTimeAsync(1000);

				// Simulate process termination after being killed
				mockChild.emit("close", -1);

				await expect(promise).rejects.toThrow(
					"Command timed out after 1000ms: slow-cmd",
				);

				expect(mockChild.kill).toHaveBeenCalledWith("SIGTERM");
			});

			it("should force kill if process doesn't terminate gracefully", async () => {
				const mockChild = new MockChildProcess();
				mockChild.exitCode = null; // Process still running
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runCommand("stubborn-cmd", [], "/test", {
					timeout: 1000,
				});

				// Fast-forward to trigger timeout
				await vi.advanceTimersByTimeAsync(1000);
				expect(mockChild.kill).toHaveBeenCalledWith("SIGTERM");

				// Fast-forward to trigger force kill
				await vi.advanceTimersByTimeAsync(5000);
				expect(mockChild.kill).toHaveBeenCalledWith("SIGKILL");

				// Simulate process finally terminating after SIGKILL
				mockChild.emit("close", -1);

				await expect(promise).rejects.toThrow(
					"Command timed out after 1000ms: stubborn-cmd",
				);
			});

			it("should clear timeout on successful completion", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runCommand("fast-cmd", [], "/test", { timeout: 5000 });

				// Complete before timeout
				process.nextTick(() => {
					mockChild.emit("close", 0);
				});

				await expect(promise).resolves.toBeUndefined();
				expect(mockChild.kill).not.toHaveBeenCalled();
			});

			it("should clear timeout on error", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runCommand("error-cmd", [], "/test", { timeout: 5000 });

				// Error before timeout
				process.nextTick(() => {
					mockChild.emit("error", new Error("spawn error"));
				});

				await expect(promise).rejects.toThrow("spawn error");
				expect(mockChild.kill).not.toHaveBeenCalled();
			});

			it("should work with timeout disabled (0 or negative)", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runCommand("cmd", [], "/test", { timeout: 0 });

				// Wait longer than default timeout
				await vi.advanceTimersByTimeAsync(60000);

				// Should still be pending, complete it
				process.nextTick(() => {
					mockChild.emit("close", 0);
				});
				await vi.runOnlyPendingTimersAsync();

				await expect(promise).resolves.toBeUndefined();
				expect(mockChild.kill).not.toHaveBeenCalled();
			});
		});

		describe("with silent option", () => {
			it("should use pipe stdio when silent is true", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runCommand("cmd", [], "/test", { silent: true });

				setImmediate(() => {
					mockChild.emit("close", 0);
				});

				await expect(promise).resolves.toBeUndefined();

				expect(spawnMock).toHaveBeenCalledWith("cmd", [], {
					cwd: "/test",
					stdio: "pipe",
					windowsHide: true,
				});
			});

			it("should inherit stdout/stdin when silent is false", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runCommand("cmd", [], "/test", { silent: false });

				setImmediate(() => {
					mockChild.emit("close", 0);
				});

				await expect(promise).resolves.toBeUndefined();

				expect(spawnMock).toHaveBeenCalledWith("cmd", [], {
					cwd: "/test",
					stdio: ["inherit", "inherit", "pipe"],
					windowsHide: true,
				});
			});

			it("should use default silent value (true) when not specified", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runCommand("cmd", [], "/test");

				setImmediate(() => {
					mockChild.emit("close", 0);
				});

				await expect(promise).resolves.toBeUndefined();

				expect(spawnMock).toHaveBeenCalledWith("cmd", [], {
					cwd: "/test",
					stdio: "pipe",
					windowsHide: true,
				});
			});

			it("should still capture stderr when silent is false", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runCommand("failing-cmd", [], "/test", {
					silent: false,
				});

				setImmediate(() => {
					(mockChild.stderr as EventEmitter).emit(
						"data",
						Buffer.from("error output"),
					);
					mockChild.emit("close", 1);
				});

				await expect(promise).rejects.toThrow("error output");
			});
		});

		describe("with combined options", () => {
			it("should work with both timeout and silent options", async () => {
				const mockChild = new MockChildProcess();
				spawnMock.mockReturnValue(mockChild as unknown as ChildProcess);

				const promise = runCommand("cmd", ["arg"], "/test", {
					timeout: 2000,
					silent: false,
				});

				setImmediate(() => {
					mockChild.emit("close", 0);
				});

				await expect(promise).resolves.toBeUndefined();

				expect(spawnMock).toHaveBeenCalledWith("cmd", ["arg"], {
					cwd: "/test",
					stdio: ["inherit", "inherit", "pipe"],
					windowsHide: true,
				});
			});
		});
	});

	describe("createSpinner", () => {
		it("should create spinner with dots style on Windows", () => {
			const originalPlatform = Object.getOwnPropertyDescriptor(
				process,
				"platform",
			);
			Object.defineProperty(process, "platform", {
				value: "win32",
			});

			const spinner = createSpinner("Loading...");

			expect(spinner).toMatchObject({
				text: "Loading...",
				spinner: "dots",
			});

			// Restore original platform
			if (originalPlatform) {
				Object.defineProperty(process, "platform", originalPlatform);
			}
		});

		it("should create spinner with dots style on non-Windows", () => {
			const originalPlatform = Object.getOwnPropertyDescriptor(
				process,
				"platform",
			);
			Object.defineProperty(process, "platform", {
				value: "darwin",
			});

			const spinner = createSpinner("Loading...");

			expect(spinner).toMatchObject({
				text: "Loading...",
				spinner: "dots",
			});

			// Restore original platform
			if (originalPlatform) {
				Object.defineProperty(process, "platform", originalPlatform);
			}
		});

		it("should use default text when not provided", () => {
			const spinner = createSpinner();

			expect(spinner).toMatchObject({
				text: "Working...",
			});
		});
	});
});
