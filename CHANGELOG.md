# @mfyuu/biome-config

## 1.0.3

### Patch Changes

- [#21](https://github.com/mfyuu/biome-config/pull/21) [`2aec14a`](https://github.com/mfyuu/biome-config/commit/2aec14a25b9e148a5f0cc259f964817836a59c94) Thanks [@mfyuu](https://github.com/mfyuu)! - - Fix pnpm migration in CI/CD workflows
  - Add pnpm action setup to release workflow
  - Update Node.js cache configuration from npm to pnpm
  - Replace npm install commands with pnpm install
  - Ensure proper dependency installation in release process

## 1.0.2

### Patch Changes

- [#17](https://github.com/mfyuu/biome-config/pull/17) [`92035d6`](https://github.com/mfyuu/biome-config/commit/92035d6e36540ed93914e64ebb83c2b2d1381df1) Thanks [@mfyuu](https://github.com/mfyuu)! - - Add comprehensive testing infrastructure and improve cross-platform compatibility
  - Add 230+ unit and e2e test cases covering all major functionality
  - Set up GitHub Actions CI pipeline for multi-platform testing (Ubuntu, Windows, macOS)
  - Configure Vitest with coverage reporting and snapshot testing
  - Add test utilities and mock helpers for file system and git operations
  - Fix Windows path separator compatibility issues in file handling tests
  - Fix cross-platform Unicode character display in console output
  - Mock external dependencies (log-symbols, kleur) for consistent test results
  - Add comprehensive test fixtures and test data generators

## 1.0.1

### Patch Changes

- [#10](https://github.com/mfyuu/biome-config/pull/10) [`2372307`](https://github.com/mfyuu/biome-config/commit/23723071216c63eedfe5fdc9d23b6926b6f6c4c0) Thanks [@mfyuu](https://github.com/mfyuu)! - - Update README documentation
  - Remove unnecessary @latest tag from npx commands
  - Clarify configuration file format (biome.json or biome.jsonc)

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
