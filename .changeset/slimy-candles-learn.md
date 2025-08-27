---
"@mfyuu/biome-config": patch
---

Fix npm errors and add spinner for better UX

- Prevent ENOENT errors when package.json is missing
- Add spinner animation during command execution
- Use non-blocking spawn instead of blocking execSync
- Show platform-specific spinner styles (Windows/Unix)
- Capture stderr for detailed error messages
- Extract reusable npm-command utility module
- Fix Windows compatibility by using shell option for .cmd files
