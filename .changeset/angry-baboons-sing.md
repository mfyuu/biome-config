---
"@mfyuu/biome-config": major
---

- Added
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

- Technical Details
  - Bundled commander.js to eliminate runtime dependencies
  - Added comprehensive TypeScript types for all modules
  - Implemented Git-aware file operations
  - Added support for both .json and .jsonc Biome configs
