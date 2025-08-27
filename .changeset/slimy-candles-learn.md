---
"@mfyuu/biome-config": patch
---

Fix npm errors and add spinner for better UX

- Prevent ENOENT errors when package.json is missing
- Add spinner animation during command execution with unified dots style
- Use non-blocking spawn instead of blocking execSync
- Implement shell:false for improved security (prevents shell injection)
- Add minimal input validation for early error detection
- Capture stderr for detailed error messages
- Extract reusable npm-command utility module
- Fix Windows compatibility with npm.cmd support
