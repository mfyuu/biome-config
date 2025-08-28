---
"@mfyuu/biome-config": patch
---

Fix npm errors and enhance cross-platform compatibility

- Prevent ENOENT errors when package.json is missing
- Add spinner animation during command execution with unified dots style
- Switch to cross-spawn for reliable cross-platform support
  - Automatically handles npm vs npm.cmd on Windows
  - Proper argument escaping and quoting across all platforms
  - Eliminates shell injection vulnerabilities
- Add comprehensive input validation:
  - Reject empty keys (after trimming)
  - Reject commands ending with `=` (format validation)
  - Block newline/carriage return/NUL characters for security
  - Preserve intentional spaces in values
- Use String() for safer Buffer-to-string conversion
- Capture stderr for detailed error messages
- Extract reusable npm-command utility module
