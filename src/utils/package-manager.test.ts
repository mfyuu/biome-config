import { vol } from "memfs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	detectAllPackageManagers,
	detectAndSelectPackageManager,
	detectPackageManager,
	getInstallCommand,
	validatePackageManagerChoice,
} from "./package-manager";
import { promptPackageManager } from "./prompt";

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

// Mock promptPackageManager
vi.mock("./prompt", () => ({
	promptPackageManager: vi.fn(),
}));

describe("package-manager", () => {
	afterEach(() => {
		vol.reset();
	});

	describe("detectPackageManager", () => {
		it("should detect npm when package-lock.json exists", () => {
			vol.fromJSON({
				"/project/package-lock.json": "{}",
				"/project/package.json": "{}",
			});

			const result = detectPackageManager("/project");
			expect(result).toBe("npm");
		});

		it("should detect yarn when yarn.lock exists", () => {
			vol.fromJSON({
				"/project/yarn.lock": "",
				"/project/package.json": "{}",
			});

			const result = detectPackageManager("/project");
			expect(result).toBe("yarn");
		});

		it("should detect pnpm when pnpm-lock.yaml exists", () => {
			vol.fromJSON({
				"/project/pnpm-lock.yaml": "",
				"/project/package.json": "{}",
			});

			const result = detectPackageManager("/project");
			expect(result).toBe("pnpm");
		});

		it("should detect bun when bun.lockb exists", () => {
			vol.fromJSON({
				"/project/bun.lockb": Buffer.from([]),
				"/project/package.json": "{}",
			});

			const result = detectPackageManager("/project");
			expect(result).toBe("bun");
		});

		it("should detect bun when bun.lock exists", () => {
			vol.fromJSON({
				"/project/bun.lock": "",
				"/project/package.json": "{}",
			});

			const result = detectPackageManager("/project");
			expect(result).toBe("bun");
		});

		it("should return null when no lock file exists", () => {
			vol.fromJSON({
				"/project/package.json": "{}",
			});

			const result = detectPackageManager("/project");
			expect(result).toBeNull();
		});

		it("should return first found when multiple lock files exist", () => {
			vol.fromJSON({
				"/project/package-lock.json": "{}",
				"/project/yarn.lock": "",
				"/project/pnpm-lock.yaml": "",
				"/project/package.json": "{}",
			});

			const result = detectPackageManager("/project");
			expect(result).toBe("npm");
		});

		it("should detect in nested directories", () => {
			vol.fromJSON({
				"/workspace/projects/app/pnpm-lock.yaml": "",
				"/workspace/projects/app/package.json": "{}",
			});

			const result = detectPackageManager("/workspace/projects/app");
			expect(result).toBe("pnpm");
		});
	});

	describe("getInstallCommand", () => {
		it("should generate npm commands with grouped exact packages", () => {
			const result = getInstallCommand("npm", [
				"@biomejs/biome",
				"@mfyuu/biome-config",
			]);
			expect(result).toEqual([
				"npm i --save-dev --save-exact @biomejs/biome",
				"npm i --save-dev @mfyuu/biome-config",
			]);
		});

		it("should generate yarn commands with grouped exact packages", () => {
			const result = getInstallCommand("yarn", [
				"@biomejs/biome",
				"@mfyuu/biome-config",
			]);
			expect(result).toEqual([
				"yarn add --dev --exact @biomejs/biome",
				"yarn add --dev @mfyuu/biome-config",
			]);
		});

		it("should generate pnpm commands with grouped exact packages", () => {
			const result = getInstallCommand("pnpm", [
				"@biomejs/biome",
				"@mfyuu/biome-config",
			]);
			expect(result).toEqual([
				"pnpm add --save-dev --save-exact @biomejs/biome",
				"pnpm add --save-dev @mfyuu/biome-config",
			]);
		});

		it("should generate bun commands with grouped exact packages", () => {
			const result = getInstallCommand("bun", [
				"@biomejs/biome",
				"@mfyuu/biome-config",
			]);
			expect(result).toEqual([
				"bun add --dev --exact @biomejs/biome",
				"bun add --dev @mfyuu/biome-config",
			]);
		});

		it("should handle single biome package with exact flag", () => {
			const result = getInstallCommand("npm", ["@biomejs/biome"]);
			expect(result).toEqual(["npm i --save-dev --save-exact @biomejs/biome"]);
		});

		it("should handle single config package without exact flag", () => {
			const result = getInstallCommand("npm", ["@mfyuu/biome-config"]);
			expect(result).toEqual(["npm i --save-dev @mfyuu/biome-config"]);
		});

		it("should group biome and prettier with exact flag", () => {
			const result = getInstallCommand("npm", [
				"@biomejs/biome",
				"prettier",
				"@mfyuu/biome-config",
			]);
			expect(result).toEqual([
				"npm i --save-dev --save-exact @biomejs/biome prettier",
				"npm i --save-dev @mfyuu/biome-config",
			]);
		});

		it("should handle prettier only with exact flag", () => {
			const result = getInstallCommand("yarn", ["prettier"]);
			expect(result).toEqual(["yarn add --dev --exact prettier"]);
		});

		it("should group all exact packages together", () => {
			const result = getInstallCommand("pnpm", ["@biomejs/biome", "prettier"]);
			expect(result).toEqual([
				"pnpm add --save-dev --save-exact @biomejs/biome prettier",
			]);
		});

		it("should handle empty package list", () => {
			const result = getInstallCommand("npm", []);
			expect(result).toEqual([]);
		});
	});

	describe("validatePackageManagerChoice", () => {
		it("should select npm", () => {
			const result = validatePackageManagerChoice({ useNpm: true });
			expect(result).toBe("npm");
		});

		it("should select yarn", () => {
			const result = validatePackageManagerChoice({ useYarn: true });
			expect(result).toBe("yarn");
		});

		it("should select pnpm", () => {
			const result = validatePackageManagerChoice({ usePnpm: true });
			expect(result).toBe("pnpm");
		});

		it("should select bun", () => {
			const result = validatePackageManagerChoice({ useBun: true });
			expect(result).toBe("bun");
		});

		it("should return null when nothing selected", () => {
			const result = validatePackageManagerChoice({});
			expect(result).toBeNull();
		});

		it("should ignore false values", () => {
			const result = validatePackageManagerChoice({
				useNpm: false,
				useYarn: false,
				usePnpm: true,
				useBun: false,
			});
			expect(result).toBe("pnpm");
		});

		it("should throw error when multiple selected", () => {
			expect(() =>
				validatePackageManagerChoice({
					useNpm: true,
					useYarn: true,
				}),
			).toThrow("Multiple package managers specified. Please choose only one.");
		});

		it("should throw error when 3+ selected", () => {
			expect(() =>
				validatePackageManagerChoice({
					useNpm: true,
					useYarn: true,
					usePnpm: true,
				}),
			).toThrow("Multiple package managers specified. Please choose only one.");
		});

		it("should ignore undefined values", () => {
			const result = validatePackageManagerChoice({
				useNpm: undefined,
				useYarn: undefined,
				usePnpm: true,
			});
			expect(result).toBe("pnpm");
		});
	});

	describe("detectAllPackageManagers", () => {
		it("should detect all when multiple lock files exist", () => {
			vol.fromJSON({
				"/project/package-lock.json": "{}",
				"/project/yarn.lock": "",
				"/project/pnpm-lock.yaml": "",
				"/project/package.json": "{}",
			});

			const result = detectAllPackageManagers("/project");
			expect(result).toEqual(["npm", "yarn", "pnpm"]);
		});

		it("should handle single lock file", () => {
			vol.fromJSON({
				"/project/pnpm-lock.yaml": "",
				"/project/package.json": "{}",
			});

			const result = detectAllPackageManagers("/project");
			expect(result).toEqual(["pnpm"]);
		});

		it("should deduplicate duplicate files from same package manager", () => {
			vol.fromJSON({
				"/project/bun.lockb": Buffer.from([]),
				"/project/bun.lock": "",
				"/project/package.json": "{}",
			});

			const result = detectAllPackageManagers("/project");
			expect(result).toEqual(["bun"]);
		});

		it("should return empty array when no lock files", () => {
			vol.fromJSON({
				"/project/package.json": "{}",
			});

			const result = detectAllPackageManagers("/project");
			expect(result).toEqual([]);
		});

		it("should handle all types of lock files", () => {
			vol.fromJSON({
				"/project/package-lock.json": "{}",
				"/project/yarn.lock": "",
				"/project/pnpm-lock.yaml": "",
				"/project/bun.lockb": Buffer.from([]),
				"/project/package.json": "{}",
			});

			const result = detectAllPackageManagers("/project");
			expect(result).toEqual(["npm", "yarn", "pnpm", "bun"]);
		});
	});

	describe("detectAndSelectPackageManager", () => {
		const mockPromptPackageManager = vi.mocked(promptPackageManager);

		afterEach(() => {
			vi.clearAllMocks();
		});

		it("should return null when no lock files", async () => {
			vol.fromJSON({
				"/project/package.json": "{}",
			});

			const result = await detectAndSelectPackageManager("/project");
			expect(result).toBeNull();
			expect(mockPromptPackageManager).not.toHaveBeenCalled();
		});

		it("should return single lock file package manager", async () => {
			vol.fromJSON({
				"/project/pnpm-lock.yaml": "",
				"/project/package.json": "{}",
			});

			const result = await detectAndSelectPackageManager("/project");
			expect(result).toBe("pnpm");
			expect(mockPromptPackageManager).not.toHaveBeenCalled();
		});

		it("should call promptPackageManager when multiple lock files exist", async () => {
			vol.fromJSON({
				"/project/package-lock.json": "{}",
				"/project/yarn.lock": "",
				"/project/package.json": "{}",
			});

			mockPromptPackageManager.mockResolvedValue("yarn");

			const result = await detectAndSelectPackageManager("/project");
			expect(result).toBe("yarn");
			expect(mockPromptPackageManager).toHaveBeenCalledWith(["npm", "yarn"]);
		});
	});
});
