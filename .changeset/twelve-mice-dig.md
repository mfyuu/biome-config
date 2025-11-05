---
"@mfyuu/biome-config": patch
---

Fix compatibility with tsdown v0.16.0 by updating CLI output extension from .js to .mjs

This change updates the package to work with tsdown v0.16.0, which changed the default output extension for ESM format to .mjs when targeting Node.js. The package.json bin field and all E2E test references have been updated accordingly. This is a patch release as it has no impact on end users - npm automatically resolves the bin field regardless of the file extension.
