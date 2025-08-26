import prompts from "prompts";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import { EXIT_CODES, PROJECT_TYPES } from "../constants";
import type { PackageManager } from "./package-manager";
import {
	promptBiomeOverwriteConfirmation,
	promptFormatterChoice,
	promptInstallDependencies,
	promptLefthookIntegration,
	promptOverwriteConfirmation,
	promptPackageManager,
	promptProjectType,
} from "./prompt";

// Mock prompts module
vi.mock("prompts");

describe("prompt", () => {
	let exitSpy: MockInstance<(code?: number) => never>;
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
			throw new Error("Process exit");
		}) as never);
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("promptOverwriteConfirmation", () => {
		it("should return true when yes is selected in confirmation prompt", async () => {
			vi.mocked(prompts).mockResolvedValue({ overwrite: true });

			const result = await promptOverwriteConfirmation();
			expect(result).toBe(true);
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "confirm",
					name: "overwrite",
					message: ".vscode/settings.json already exists. Overwrite?",
					initial: false,
				}),
				expect.any(Object),
			);
		});

		it("should return false when no is selected in confirmation prompt", async () => {
			vi.mocked(prompts).mockResolvedValue({ overwrite: false });

			const result = await promptOverwriteConfirmation();
			expect(result).toBe(false);
		});

		it("should exit when prompt is cancelled", async () => {
			vi.mocked(prompts).mockImplementation((_question, options) => {
				if (options?.onCancel) {
					options.onCancel({} as never, {} as never);
				}
				return Promise.resolve({});
			});

			await expect(promptOverwriteConfirmation()).rejects.toThrow(
				"Process exit",
			);
			expect(consoleLogSpy).toHaveBeenCalledWith("\nOperation cancelled.");
			expect(exitSpy).toHaveBeenCalledWith(EXIT_CODES.FAILURE);
		});

		it("should return false when response is empty", async () => {
			vi.mocked(prompts).mockResolvedValue({});

			const result = await promptOverwriteConfirmation();
			expect(result).toBe(false);
		});
	});

	describe("promptBiomeOverwriteConfirmation", () => {
		it("should return true when yes is selected in confirmation prompt", async () => {
			vi.mocked(prompts).mockResolvedValue({ overwrite: true });

			const result = await promptBiomeOverwriteConfirmation();
			expect(result).toBe(true);
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "confirm",
					name: "overwrite",
					message: "biome.json(c) already exists. Overwrite?",
					initial: false,
				}),
				expect.any(Object),
			);
		});

		it("should return false when no is selected in confirmation prompt", async () => {
			vi.mocked(prompts).mockResolvedValue({ overwrite: false });

			const result = await promptBiomeOverwriteConfirmation();
			expect(result).toBe(false);
		});

		it("should exit when prompt is cancelled", async () => {
			vi.mocked(prompts).mockImplementation((_question, options) => {
				if (options?.onCancel) {
					options.onCancel({} as never, {} as never);
				}
				return Promise.resolve({});
			});

			await expect(promptBiomeOverwriteConfirmation()).rejects.toThrow(
				"Process exit",
			);
			expect(consoleLogSpy).toHaveBeenCalledWith("\nOperation cancelled.");
			expect(exitSpy).toHaveBeenCalledWith(EXIT_CODES.FAILURE);
		});
	});

	describe("promptInstallDependencies", () => {
		it("should return true when yes is selected for install confirmation", async () => {
			vi.mocked(prompts).mockResolvedValue({ install: true });

			const result = await promptInstallDependencies([
				"@biomejs/biome",
				"@mfyuu/biome-config",
			]);
			expect(result).toBe(true);
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "confirm",
					name: "install",
					message:
						"Install missing dependencies (@biomejs/biome, @mfyuu/biome-config)?",
					initial: true,
				}),
				expect.any(Object),
			);
		});

		it("should return false when no is selected for install confirmation", async () => {
			vi.mocked(prompts).mockResolvedValue({ install: false });

			const result = await promptInstallDependencies(["@biomejs/biome"]);
			expect(result).toBe(false);
		});

		it("should handle single package", async () => {
			vi.mocked(prompts).mockResolvedValue({ install: true });

			const result = await promptInstallDependencies(["@biomejs/biome"]);
			expect(result).toBe(true);
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Install missing dependencies (@biomejs/biome)?",
				}),
				expect.any(Object),
			);
		});

		it("should exit when prompt is cancelled", async () => {
			vi.mocked(prompts).mockImplementation((_question, options) => {
				if (options?.onCancel) {
					options.onCancel({} as never, {} as never);
				}
				return Promise.resolve({});
			});

			await expect(promptInstallDependencies(["test"])).rejects.toThrow(
				"Process exit",
			);
			expect(consoleLogSpy).toHaveBeenCalledWith("\nOperation cancelled.");
			expect(exitSpy).toHaveBeenCalledWith(EXIT_CODES.FAILURE);
		});
	});

	describe("promptPackageManager", () => {
		it("should select npm", async () => {
			vi.mocked(prompts).mockResolvedValue({ packageManager: "npm" });

			const result = await promptPackageManager();
			expect(result).toBe("npm");
		});

		it("should select yarn", async () => {
			vi.mocked(prompts).mockResolvedValue({ packageManager: "yarn" });

			const result = await promptPackageManager();
			expect(result).toBe("yarn");
		});

		it("should select pnpm", async () => {
			vi.mocked(prompts).mockResolvedValue({ packageManager: "pnpm" });

			const result = await promptPackageManager();
			expect(result).toBe("pnpm");
		});

		it("should select bun", async () => {
			vi.mocked(prompts).mockResolvedValue({ packageManager: "bun" });

			const result = await promptPackageManager();
			expect(result).toBe("bun");
		});

		it("should exit when prompt is cancelled", async () => {
			vi.mocked(prompts).mockImplementation((_question, options) => {
				if (options?.onCancel) {
					options.onCancel({} as never, {} as never);
				}
				return Promise.resolve({});
			});

			await expect(promptPackageManager()).rejects.toThrow("Process exit");
			expect(consoleLogSpy).toHaveBeenCalledWith("\nOperation cancelled.");
			expect(exitSpy).toHaveBeenCalledWith(EXIT_CODES.FAILURE);
		});

		it("should return npm when response is empty", async () => {
			vi.mocked(prompts).mockResolvedValue({});

			const result = await promptPackageManager();
			expect(result).toBe("npm");
		});

		it("should handle multiple package managers detected", async () => {
			vi.mocked(prompts).mockResolvedValue({ packageManager: "pnpm" });

			const availableManagers = [
				"npm",
				"pnpm",
			] as const satisfies PackageManager[];
			const result = await promptPackageManager(availableManagers);

			expect(result).toBe("pnpm");
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Multiple package managers detected. Choose one:",
					choices: [
						{ title: "npm", value: "npm" },
						{ title: "pnpm", value: "pnpm" },
					],
				}),
				expect.any(Object),
			);
		});

		it("should handle single package manager available", async () => {
			vi.mocked(prompts).mockResolvedValue({ packageManager: "yarn" });

			const availableManagers = ["yarn"] as const satisfies PackageManager[];
			const result = await promptPackageManager(availableManagers);

			expect(result).toBe("yarn");
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Multiple package managers detected. Choose one:",
					choices: [{ title: "yarn", value: "yarn" }],
				}),
				expect.any(Object),
			);
		});

		it("should handle three package managers available", async () => {
			vi.mocked(prompts).mockResolvedValue({ packageManager: "bun" });

			const availableManagers = [
				"npm",
				"yarn",
				"bun",
			] as const satisfies PackageManager[];
			const result = await promptPackageManager(availableManagers);

			expect(result).toBe("bun");
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Multiple package managers detected. Choose one:",
					choices: [
						{ title: "npm", value: "npm" },
						{ title: "yarn", value: "yarn" },
						{ title: "bun", value: "bun" },
					],
				}),
				expect.any(Object),
			);
		});
	});

	describe("promptProjectType", () => {
		it("should select base project type", async () => {
			vi.mocked(prompts).mockResolvedValue({ projectType: PROJECT_TYPES.BASE });

			const result = await promptProjectType();
			expect(result).toBe(PROJECT_TYPES.BASE);
		});

		it("should select react project type", async () => {
			vi.mocked(prompts).mockResolvedValue({
				projectType: PROJECT_TYPES.REACT,
			});

			const result = await promptProjectType();
			expect(result).toBe(PROJECT_TYPES.REACT);
		});

		it("should select next project type", async () => {
			vi.mocked(prompts).mockResolvedValue({ projectType: PROJECT_TYPES.NEXT });

			const result = await promptProjectType();
			expect(result).toBe(PROJECT_TYPES.NEXT);
		});

		it("should exit when prompt is cancelled", async () => {
			vi.mocked(prompts).mockImplementation((_question, options) => {
				if (options?.onCancel) {
					options.onCancel({} as never, {} as never);
				}
				return Promise.resolve({});
			});

			await expect(promptProjectType()).rejects.toThrow("Process exit");
			expect(consoleLogSpy).toHaveBeenCalledWith("\nOperation cancelled.");
			expect(exitSpy).toHaveBeenCalledWith(EXIT_CODES.FAILURE);
		});

		it("should return base when response is empty", async () => {
			vi.mocked(prompts).mockResolvedValue({});

			const result = await promptProjectType();
			expect(result).toBe(PROJECT_TYPES.BASE);
		});

		it("should verify choices content is correct", async () => {
			vi.mocked(prompts).mockResolvedValue({ projectType: PROJECT_TYPES.BASE });

			await promptProjectType();
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "select",
					name: "projectType",
					message: "Which type of project is this?",
					choices: expect.arrayContaining([
						expect.objectContaining({
							title: "Base (Node.js/TypeScript)",
							value: PROJECT_TYPES.BASE,
						}),
						expect.objectContaining({
							title: "React",
							value: PROJECT_TYPES.REACT,
						}),
						expect.objectContaining({
							title: "Next",
							value: PROJECT_TYPES.NEXT,
						}),
					]),
				}),
				expect.any(Object),
			);
		});
	});

	describe("promptFormatterChoice", () => {
		it("should return 'with-prettier' when selected", async () => {
			vi.mocked(prompts).mockResolvedValue({ formatter: "with-prettier" });

			const result = await promptFormatterChoice();
			expect(result).toBe("with-prettier");
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "select",
					name: "formatter",
					message: "Which formatter configuration would you like to use?",
					choices: [
						{
							title: "Biome + Prettier (for Markdown)",
							value: "with-prettier",
						},
						{ title: "Biome only", value: "biome-only" },
					],
					initial: 0,
				}),
				expect.any(Object),
			);
		});

		it("should return 'biome-only' when selected", async () => {
			vi.mocked(prompts).mockResolvedValue({ formatter: "biome-only" });

			const result = await promptFormatterChoice();
			expect(result).toBe("biome-only");
		});

		it("should return default 'with-prettier' when response is empty", async () => {
			vi.mocked(prompts).mockResolvedValue({});

			const result = await promptFormatterChoice();
			expect(result).toBe("with-prettier");
		});

		it("should exit when prompt is cancelled", async () => {
			vi.mocked(prompts).mockImplementation((_question, options) => {
				if (options?.onCancel) {
					options.onCancel({} as never, {} as never);
				}
				return Promise.resolve({});
			});

			await expect(promptFormatterChoice()).rejects.toThrow("Process exit");
			expect(consoleLogSpy).toHaveBeenCalledWith("\nOperation cancelled.");
			expect(exitSpy).toHaveBeenCalledWith(EXIT_CODES.FAILURE);
		});

		it("should have correct default selection (with-prettier)", async () => {
			vi.mocked(prompts).mockResolvedValue({ formatter: "with-prettier" });

			await promptFormatterChoice();
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					initial: 0, // First choice is "with-prettier"
				}),
				expect.any(Object),
			);
		});
	});

	describe("promptLefthookIntegration", () => {
		it("should return true when yes is selected", async () => {
			vi.mocked(prompts).mockResolvedValue({ integrate: true });

			const result = await promptLefthookIntegration();
			expect(result).toBe(true);
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "confirm",
					name: "integrate",
					message: "Would you like to integrate lefthook for Git hooks?",
					initial: true,
				}),
				expect.any(Object),
			);
		});

		it("should return false when no is selected", async () => {
			vi.mocked(prompts).mockResolvedValue({ integrate: false });

			const result = await promptLefthookIntegration();
			expect(result).toBe(false);
		});

		it("should return false when response is empty", async () => {
			vi.mocked(prompts).mockResolvedValue({});

			const result = await promptLefthookIntegration();
			expect(result).toBe(false);
		});

		it("should exit when prompt is cancelled", async () => {
			vi.mocked(prompts).mockImplementation((_question, options) => {
				if (options?.onCancel) {
					options.onCancel({} as never, {} as never);
				}
				return Promise.resolve({});
			});

			await expect(promptLefthookIntegration()).rejects.toThrow("Process exit");
			expect(consoleLogSpy).toHaveBeenCalledWith("\nOperation cancelled.");
			expect(exitSpy).toHaveBeenCalledWith(EXIT_CODES.FAILURE);
		});

		it("should have correct default selection (true)", async () => {
			vi.mocked(prompts).mockResolvedValue({ integrate: true });

			await promptLefthookIntegration();
			expect(prompts).toHaveBeenCalledWith(
				expect.objectContaining({
					initial: true,
				}),
				expect.any(Object),
			);
		});
	});
});
