---
"@mfyuu/biome-config": minor
---

- Add formatter template selection with CLI flags and improve package manager validation
  - Add --biome-only and --with-prettier flags for non-interactive setup
  - Add interactive promptFormatterChoice when flags are not specified
  - Support template selection between biome-only.json and with-prettier.json
  - Fix process continuation bug when multiple package manager flags are specified
  - Rename settings.json template to with-prettier.json and add biome-only.json template
  - Add comprehensive test coverage for new functionality
  - Add related type definitions and constants
