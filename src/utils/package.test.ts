import { vol } from "memfs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PROJECT_TYPES } from "../constants.js";
import {
	basePackageJson,
	nextPackageJson,
	reactPackageJson,
} from "../test-helpers/fixtures.js";
import {
	detectProjectType,
	hasDependency,
	readUserPackageJson,
} from "./package.js";

// Mock fs modules using memfs
vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("package", () => {
	afterEach(() => {
		vol.reset();
	});

	describe("readUserPackageJson", () => {
		it("should read package.json when it exists", () => {
			const packageData = {
				name: "test-project",
				version: "1.0.0",
				dependencies: {
					express: "^4.18.0",
				},
			};

			vol.fromJSON({
				"/project/package.json": JSON.stringify(packageData, null, 2),
			});

			const result = readUserPackageJson("/project");
			expect(result).toEqual(packageData);
		});

		it("should return null when package.json does not exist", () => {
			vol.fromJSON({
				"/project": null,
			});

			const result = readUserPackageJson("/project");
			expect(result).toBeNull();
		});

		it("should return null for invalid JSON", () => {
			vol.fromJSON({
				"/project/package.json": "{ invalid json",
			});

			const result = readUserPackageJson("/project");
			expect(result).toBeNull();
		});

		it("should handle empty package.json", () => {
			vol.fromJSON({
				"/project/package.json": "{}",
			});

			const result = readUserPackageJson("/project");
			expect(result).toEqual({});
		});

		it("should read package.json from nested directory", () => {
			const packageData = {
				name: "nested-project",
				version: "2.0.0",
			};

			vol.fromJSON({
				"/workspace/projects/app/package.json": JSON.stringify(packageData),
			});

			const result = readUserPackageJson("/workspace/projects/app");
			expect(result).toEqual(packageData);
		});
	});

	describe("hasDependency", () => {
		it("should return true when dependency exists", () => {
			const packageJson = {
				dependencies: {
					express: "^4.18.0",
					lodash: "^4.17.21",
				},
			};

			expect(hasDependency(packageJson, "express")).toBe(true);
			expect(hasDependency(packageJson, "lodash")).toBe(true);
		});

		it("should return true when in devDependencies", () => {
			const packageJson = {
				devDependencies: {
					jest: "^29.0.0",
					typescript: "^5.0.0",
				},
			};

			expect(hasDependency(packageJson, "jest")).toBe(true);
			expect(hasDependency(packageJson, "typescript")).toBe(true);
		});

		it("should return false when dependency does not exist", () => {
			const packageJson = {
				dependencies: {
					express: "^4.18.0",
				},
				devDependencies: {
					jest: "^29.0.0",
				},
			};

			expect(hasDependency(packageJson, "react")).toBe(false);
			expect(hasDependency(packageJson, "vue")).toBe(false);
		});

		it("should return true when in both dependencies and devDependencies", () => {
			const packageJson = {
				dependencies: {
					typescript: "^5.0.0",
				},
				devDependencies: {
					typescript: "^5.0.0",
				},
			};

			expect(hasDependency(packageJson, "typescript")).toBe(true);
		});

		it("should return false when neither dependencies nor devDependencies exist", () => {
			const packageJson = {};

			expect(hasDependency(packageJson, "express")).toBe(false);
		});

		it("should return false for empty dependencies and devDependencies", () => {
			const packageJson = {
				dependencies: {},
				devDependencies: {},
			};

			expect(hasDependency(packageJson, "express")).toBe(false);
		});
	});

	describe("detectProjectType", () => {
		it("should detect Next.js project", () => {
			const result = detectProjectType(nextPackageJson);
			expect(result).toBe(PROJECT_TYPES.NEXT);
		});

		it("should detect React project", () => {
			const result = detectProjectType(reactPackageJson);
			expect(result).toBe(PROJECT_TYPES.REACT);
		});

		it("should detect base project", () => {
			const result = detectProjectType(basePackageJson);
			expect(result).toBe(PROJECT_TYPES.BASE);
		});

		it("should return null when packageJson is null", () => {
			const result = detectProjectType(null);
			expect(result).toBeNull();
		});

		it("should detect React when only react-dom exists", () => {
			const packageJson = {
				dependencies: {
					"react-dom": "^18.2.0",
				},
			};

			const result = detectProjectType(packageJson);
			expect(result).toBe(PROJECT_TYPES.REACT);
		});

		it("should prefer Next when both Next and React are present", () => {
			const packageJson = {
				dependencies: {
					next: "^14.0.0",
					react: "^18.2.0",
					"react-dom": "^18.2.0",
				},
			};

			const result = detectProjectType(packageJson);
			expect(result).toBe(PROJECT_TYPES.NEXT);
		});

		it("should detect framework in devDependencies only", () => {
			const packageJson = {
				devDependencies: {
					next: "^14.0.0",
				},
			};

			const result = detectProjectType(packageJson);
			expect(result).toBe(PROJECT_TYPES.NEXT);
		});

		it("should return base for other packages only", () => {
			const packageJson = {
				dependencies: {
					express: "^4.18.0",
					lodash: "^4.17.21",
				},
			};

			const result = detectProjectType(packageJson);
			expect(result).toBe(PROJECT_TYPES.BASE);
		});

		it("should return base for empty package.json", () => {
			const result = detectProjectType({});
			expect(result).toBe(PROJECT_TYPES.BASE);
		});

		it("should return base when both dependencies and devDependencies are empty", () => {
			const packageJson = {
				name: "test",
				version: "1.0.0",
				dependencies: {},
				devDependencies: {},
			};
			const result = detectProjectType(packageJson);
			expect(result).toBe(PROJECT_TYPES.BASE);
		});

		it("should prefer Next when next in dependencies and react in devDependencies", () => {
			const packageJson = {
				dependencies: {
					next: "^14.0.0",
				},
				devDependencies: {
					react: "^18.2.0",
				},
			};
			const result = detectProjectType(packageJson);
			expect(result).toBe(PROJECT_TYPES.NEXT);
		});

		it("should prefer Next when react in dependencies and next in devDependencies", () => {
			const packageJson = {
				dependencies: {
					react: "^18.2.0",
				},
				devDependencies: {
					next: "^14.0.0",
				},
			};
			const result = detectProjectType(packageJson);
			expect(result).toBe(PROJECT_TYPES.NEXT);
		});

		it("should detect with special version formats", () => {
			const packageJson = {
				dependencies: {
					next: "latest",
					react: "~18.2.0",
					"react-dom": ">=18.0.0",
				},
			};
			const result = detectProjectType(packageJson);
			expect(result).toBe(PROJECT_TYPES.NEXT);
		});

		it("should not detect partial package name matches", () => {
			const packageJson = {
				dependencies: {
					"next-auth": "^4.0.0", // not next
					"react-router": "^6.0.0", // not react
					"some-react-dom-util": "^1.0.0", // not react-dom
				},
			};
			const result = detectProjectType(packageJson);
			expect(result).toBe(PROJECT_TYPES.BASE);
		});

		it("should not error when dependency values are undefined", () => {
			const packageJson = {
				dependencies: undefined,
				devDependencies: undefined,
			};
			const result = detectProjectType(packageJson);
			expect(result).toBe(PROJECT_TYPES.BASE);
		});
	});
});
