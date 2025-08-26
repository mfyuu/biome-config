---
"@mfyuu/biome-config": patch
---

- Add comprehensive testing infrastructure and improve cross-platform compatibility
  - Add 230+ unit and e2e test cases covering all major functionality
  - Set up GitHub Actions CI pipeline for multi-platform testing (Ubuntu, Windows, macOS)
  - Configure Vitest with coverage reporting and snapshot testing
  - Add test utilities and mock helpers for file system and git operations
  - Fix Windows path separator compatibility issues in file handling tests
  - Fix cross-platform Unicode character display in console output
  - Mock external dependencies (log-symbols, kleur) for consistent test results
  - Add comprehensive test fixtures and test data generators
