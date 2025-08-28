# @mfyuu/biome-config

## 1.3.3

### Patch Changes

- [#34](https://github.com/mfyuu/biome-config/pull/34) [`546f629`](https://github.com/mfyuu/biome-config/commit/546f6296ad576f4a6b79e10e519b203d083640cb) Thanks [@mfyuu](https://github.com/mfyuu)! - Fix npm errors and enhance cross-platform compatibility with improved type safety
  - Migrate from execSync to cross-spawn for reliable cross-platform execution
  - Add spinner animation during command execution with unified dots style
  - Add comprehensive input validation for npm pkg set commands
  - Block newline/carriage return/NUL characters for security
  - Prevent ENOENT errors when package.json is missing
  - Capture stderr for detailed error messages
  - Add timeout support with graceful and forceful kill options
  - Remove all `any` type usage across the codebase
  - Add proper PackageJson interface with well-known fields
  - Implement type guards for ProjectType validation
  - Centralize package manager constants and options
  - Extract reusable npm-command utility module

## 1.3.2

### Patch Changes

- [#32](https://github.com/mfyuu/biome-config/pull/32) [`7cd3a27`](https://github.com/mfyuu/biome-config/commit/7cd3a2750d586832e4ce44fec66320315d1a716e) Thanks [@mfyuu](https://github.com/mfyuu)! - - Update documentation to match actual CLI implementation and add Japanese support
  - Fix outdated "This command will" section with complete feature list
  - Add missing CLI features: package.json scripts, Lefthook integration, formatter choices
  - Create comprehensive Japanese documentation (README.ja.md)
  - Add language switcher between English and Japanese versions
  - Keep technical section headers in English for developer consistency

## 1.3.1

### Patch Changes

- [#30](https://github.com/mfyuu/biome-config/pull/30) [`bf1cfa9`](https://github.com/mfyuu/biome-config/commit/bf1cfa9e09db52d067f9c0fa04585118df70d3a6) Thanks [@mfyuu](https://github.com/mfyuu)! - - Improved formatter choice implementation and message consistency
  - Improve project type detection logic for better accuracy
  - Refactor parameter passing between components for consistency and maintainability
  - Preserve formatter choice even when installation errors occur
  - Add PRETTIER constant and use it consistently throughout codebase
  - Unify prompt messages with casual "Pick a" format
  - Change "formatter configuration" to "formatter template" for consistency
  - Replace error exclamation marks with periods for professional tone
  - Simplify verbose messages (e.g., "Run manually:" instead of "Please run the following command manually:")
  - Change "Detected" to "Found" for more casual and friendly tone
  - Use long-form package manager flags consistently (--save-dev, --dev instead of -D)
  - Add interactive overwrite prompt for existing lefthook.yml files
  - Improve consistency of lefthook integration with other starter wizard features

## 1.3.0

### Minor Changes

- [#28](https://github.com/mfyuu/biome-config/pull/28) [`afa0f85`](https://github.com/mfyuu/biome-config/commit/afa0f853c710a685d3d4b93daf3a1b7071659938) Thanks [@mfyuu](https://github.com/mfyuu)! - - Add lefthook integration and improve dependency management
  - Add --lefthook flag to automatically set up Git hooks
  - Create package manager-specific lefthook configuration templates
  - Display lefthook status in initialization summary
  - Add hooks sync message with visual indicators for successful Git hooks installation
  - Add exact version flag (-E) for @biomejs/biome to ensure version compatibility
  - Generate separate install commands for each package
  - Fix command display formatting to remove excessive blank lines
  - Add comprehensive E2E and unit tests for new features

## 1.2.0

### Minor Changes

- [#26](https://github.com/mfyuu/biome-config/pull/26) [`ea569f0`](https://github.com/mfyuu/biome-config/commit/ea569f07cc419101eb4079b117db75a4b9483e00) Thanks [@mfyuu](https://github.com/mfyuu)! - - Add automatic Biome scripts to package.json during init process
  - Automatically adds format, lint, lint-fix, and check scripts
  - Uses npm pkg set for reliable script addition
  - Shows scripts status in the setup summary (4/4 completed)
  - Gracefully handles errors without interrupting the init flow
  - No user interaction required - scripts are always added

## 1.1.0

### Minor Changes

- [#23](https://github.com/mfyuu/biome-config/pull/23) [`2367c95`](https://github.com/mfyuu/biome-config/commit/2367c95ab3f2bb4c034daf766d3e68dec2bdc586) Thanks [@mfyuu](https://github.com/mfyuu)! - - Add formatter template selection with CLI flags and improve package manager validation
  - Add --biome-only and --with-prettier flags for non-interactive setup
  - Add interactive promptFormatterChoice when flags are not specified
  - Support template selection between biome-only.json and with-prettier.json
  - Fix process continuation bug when multiple package manager flags are specified
  - Rename settings.json template to with-prettier.json and add biome-only.json template
  - Add comprehensive test coverage for new functionality
  - Add related type definitions and constants

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
