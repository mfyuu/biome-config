# @mfyuu/biome-config

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
