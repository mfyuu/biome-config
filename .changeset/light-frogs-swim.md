---
"@mfyuu/biome-config": patch
---

- Fix pnpm migration in CI/CD workflows
  - Add pnpm action setup to release workflow
  - Update Node.js cache configuration from npm to pnpm
  - Replace npm install commands with pnpm install
  - Ensure proper dependency installation in release process
