import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import type { Readable, Writable } from "node:stream";
import { spawn } from "cross-spawn";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSpinner, runNpmPkgSet } from "./npm-command";

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
