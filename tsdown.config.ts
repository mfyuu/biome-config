import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/cli.ts"],
	format: ["esm"],
	shims: true,
	clean: true,
});
