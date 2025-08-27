---
"@mfyuu/biome-config": patch
---

Fix npm errors and add spinner for better UX

- Prevent ENOENT errors when package.json is missing
- Add spinner animation during command execution
- Use non-blocking spawn instead of blocking execSync
- Use unified dots spinner style across all platforms
- Capture stderr for detailed error messages
- Extract reusable npm-command utility module
- Fix Windows compatibility with proper shell option and argument quoting for .cmd files
