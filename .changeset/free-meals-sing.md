---
"@mfyuu/biome-config": minor
---

- Add lefthook integration and improve dependency management
  - Add --lefthook flag to automatically set up Git hooks
  - Create package manager-specific lefthook configuration templates
  - Display lefthook status in initialization summary
  - Add hooks sync message with visual indicators for successful Git hooks installation
  - Add exact version flag (-E) for @biomejs/biome to ensure version compatibility
  - Generate separate install commands for each package
  - Fix command display formatting to remove excessive blank lines
  - Add comprehensive E2E and unit tests for new features
