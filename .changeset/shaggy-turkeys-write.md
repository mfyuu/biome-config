---
"@mfyuu/biome-config": minor
---

- Add automatic Biome scripts to package.json during init process
  - Automatically adds format, lint, lint-fix, and check scripts
  - Uses npm pkg set for reliable script addition
  - Shows scripts status in the setup summary (4/4 completed)
  - Gracefully handles errors without interrupting the init flow
  - No user interaction required - scripts are always added
