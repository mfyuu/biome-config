# @mfyuu/biome-config

## 1.0.0

### Major Changes

- [#7](https://github.com/mfyuu/biome-config/pull/7) [`e1b02db`](https://github.com/mfyuu/biome-config/commit/e1b02db51f8c6ecb2e6f95fc0eef11d23d9d4895) Thanks [@mfyuu](https://github.com/mfyuu)! - - Added
  - Starter wizard CLI command for interactive Biome setup
  - Automatic package manager detection (npm/yarn/pnpm/bun)
  - Project type selection with templates (Base, React, Next.js)
  - VS Code settings.json generation for Biome integration
  - Dependency auto-installation with confirmation prompts
  - File overwrite protection with user confirmations
  - Colorful terminal output with progress indicators
  - Modular architecture with separated concerns
  - Zero runtime dependencies through bundling
  - Changed
    - Build process from tsc to tsdown for optimized output
    - Package exports to include CLI binary
    - Documentation to reflect new CLI capabilities
    - TypeScript configuration optimized for bundler (ESNext target, Bundler module resolution)
  - Technical Details
    - Bundled commander.js to eliminate runtime dependencies
    - Added comprehensive TypeScript types for all modules
    - Implemented Git-aware file operations
    - Added support for both .json and .jsonc Biome configs

## 0.1.2

### Patch Changes

- [#4](https://github.com/mfyuu/biome-config/pull/4) [`45feda8`](https://github.com/mfyuu/biome-config/commit/45feda8b6de7ffc26b3677b4b1edac9c84d82335) Thanks [@mfyuu](https://github.com/mfyuu)! - Fix Japanese text in README documentation
  - Translate Japanese note about schema resolution to English
  - Ensure documentation consistency in English throughout

## 0.1.1

### Patch Changes

- [#2](https://github.com/mfyuu/biome-config/pull/2) [`d675e9e`](https://github.com/mfyuu/biome-config/commit/d675e9ea24ab1fde17c220c23e8cd2ef94a66bf3) Thanks [@mfyuu](https://github.com/mfyuu)! - Update Biome schema references to use local node_modules path
  - Changed schema references from remote URLs to local node_modules
  - Improves IDE support and reduces dependency on external URLs
  - No functional changes to configuration behavior

## 0.1.0

### Minor Changes

- Initial release of shareable Biome configuration presets
  - Provides base configuration for TypeScript/JavaScript projects
  - React configuration with React-specific rules
  - Next.js configuration with Next.js-specific rules
  - All configurations use Biome 2.2.0
  - Configured with sensible defaults for modern web development
