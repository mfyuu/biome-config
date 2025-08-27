---
"@mfyuu/biome-config": patch
---

- Improved formatter choice implementation and message consistency
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
