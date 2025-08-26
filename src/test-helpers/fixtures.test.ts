import { describe, expect, it } from "vitest";
import {
	baseBiomeConfig,
	basePackageJson,
	biomeInstalledPackageJson,
	createProjectStructure,
	nextBiomeConfig,
	nextPackageJson,
	reactBiomeConfig,
	reactPackageJson,
	vscodeSettings,
} from "./fixtures.js";

describe("fixtures", () => {
	describe("package.json fixtures", () => {
		it("should have correct structure for basePackageJson", () => {
			expect(basePackageJson).toHaveProperty("name", "test-project");
			expect(basePackageJson).toHaveProperty("version", "1.0.0");
			expect(basePackageJson).toHaveProperty("dependencies");
			expect(basePackageJson).toHaveProperty("devDependencies");
			expect(basePackageJson.dependencies).toEqual({});
		});

		it("should include React dependencies in reactPackageJson", () => {
			expect(reactPackageJson).toHaveProperty("name", "test-react-project");
			expect(reactPackageJson.dependencies).toHaveProperty("react");
			expect(reactPackageJson.dependencies).toHaveProperty("react-dom");
			expect(reactPackageJson.devDependencies).toHaveProperty("@types/react");
		});

		it("should include Next.js dependencies in nextPackageJson", () => {
			expect(nextPackageJson).toHaveProperty("name", "test-next-project");
			expect(nextPackageJson.dependencies).toHaveProperty("next");
			expect(nextPackageJson.dependencies).toHaveProperty("react");
			expect(nextPackageJson.dependencies).toHaveProperty("react-dom");
			expect(nextPackageJson.devDependencies).toHaveProperty("@types/react");
		});

		it("should include Biome dependencies in biomeInstalledPackageJson", () => {
			expect(biomeInstalledPackageJson).toHaveProperty(
				"name",
				"test-biome-project",
			);
			expect(biomeInstalledPackageJson.devDependencies).toHaveProperty(
				"@biomejs/biome",
			);
		});
	});

	describe("biome.json fixtures", () => {
		it("should have correct structure for baseBiomeConfig", () => {
			expect(baseBiomeConfig).toHaveProperty("$schema");
			expect(baseBiomeConfig).toHaveProperty("extends");
			expect(baseBiomeConfig.extends).toContain("@mfyuu/biome-config/base");
		});

		it("should extend React configuration in reactBiomeConfig", () => {
			expect(reactBiomeConfig).toHaveProperty("$schema");
			expect(reactBiomeConfig.extends).toContain("@mfyuu/biome-config/react");
		});

		it("should extend Next.js configuration in nextBiomeConfig", () => {
			expect(nextBiomeConfig).toHaveProperty("$schema");
			expect(nextBiomeConfig.extends).toContain("@mfyuu/biome-config/next");
		});
	});

	describe("VS Code settings", () => {
		it("should include Biome configuration in vscodeSettings", () => {
			expect(vscodeSettings).toHaveProperty("editor.formatOnSave", true);
			expect(vscodeSettings["[javascript]"]).toHaveProperty(
				"editor.defaultFormatter",
				"biomejs.biome",
			);
			expect(vscodeSettings["[typescript]"]).toHaveProperty(
				"editor.defaultFormatter",
				"biomejs.biome",
			);
			expect(vscodeSettings["[json]"]).toHaveProperty(
				"editor.defaultFormatter",
				"biomejs.biome",
			);
			expect(vscodeSettings).toHaveProperty("editor.codeActionsOnSave");
		});
	});

	describe("createProjectStructure", () => {
		it("should default to base type", () => {
			const structure = createProjectStructure();
			const project = structure["/project"] as Record<string, unknown>;

			expect(project).toBeDefined();
			expect(project["package.json"] as string).toContain("test-project");
			expect(project["biome.json"] as string).toContain(
				"@mfyuu/biome-config/base",
			);
		});

		it("should generate base type project structure", () => {
			const structure = createProjectStructure("base");
			const project = structure["/project"] as Record<string, unknown>;

			expect(project).toHaveProperty(".git");
			expect(project).toHaveProperty("package.json");
			expect(project).toHaveProperty("biome.json");
			expect(project).toHaveProperty("src");

			const packageJson = JSON.parse(project["package.json"] as string);
			expect(packageJson.name).toBe("test-project");

			const biomeConfig = JSON.parse(project["biome.json"] as string);
			expect(biomeConfig.extends).toContain("@mfyuu/biome-config/base");

			expect(project.src).toHaveProperty("index.ts", "// test file");
		});

		it("should generate react type project structure", () => {
			const structure = createProjectStructure("react");
			const project = structure["/project"] as Record<string, unknown>;

			const packageJson = JSON.parse(project["package.json"] as string);
			expect(packageJson.name).toBe("test-react-project");
			expect(packageJson.dependencies).toHaveProperty("react");
			expect(packageJson.dependencies).toHaveProperty("react-dom");

			const biomeConfig = JSON.parse(project["biome.json"] as string);
			expect(biomeConfig.extends).toContain("@mfyuu/biome-config/react");
		});

		it("should generate next type project structure", () => {
			const structure = createProjectStructure("next");
			const project = structure["/project"] as Record<string, unknown>;

			const packageJson = JSON.parse(project["package.json"] as string);
			expect(packageJson.name).toBe("test-next-project");
			expect(packageJson.dependencies).toHaveProperty("next");
			expect(packageJson.dependencies).toHaveProperty("react");

			const biomeConfig = JSON.parse(project["biome.json"] as string);
			expect(biomeConfig.extends).toContain("@mfyuu/biome-config/next");
		});

		it("should generate structure with correct format", () => {
			const structure = createProjectStructure("base");
			const project = structure["/project"] as Record<string, unknown>;

			// JSON should be parseable correctly
			expect(() => JSON.parse(project["package.json"] as string)).not.toThrow();
			expect(() => JSON.parse(project["biome.json"] as string)).not.toThrow();

			// Indentation should be 2 spaces
			expect(project["package.json"] as string).toMatch(/^ {2}"/m); // 2 space indent
			expect(project["biome.json"] as string).toMatch(/^ {2}"/m);
		});
	});
});
