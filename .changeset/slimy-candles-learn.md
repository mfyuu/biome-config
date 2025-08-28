---
"@mfyuu/biome-config": patch
---

Fix npm errors and enhance cross-platform compatibility with improved type safety

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
