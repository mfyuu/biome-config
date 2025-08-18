# @mfyuu/biome-config

Shareable Biome configuration package for JavaScript/TypeScript projects. Choose from three configurations based on your project type: base, React, or Next.js.

## Installation

```bash
npm install -D @mfyuu/biome-config
```

or

```bash
yarn add -D @mfyuu/biome-config
```

or

```bash
pnpm add -D @mfyuu/biome-config
```

or

```bash
bun add -D @mfyuu/biome-config
```

## Usage

Extend the appropriate configuration in your project's `biome.json`:

### Base Configuration (Node.js/TypeScript Projects)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "extends": ["@mfyuu/biome-config/base"]
}
```

### React Configuration

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "extends": ["@mfyuu/biome-config/react"]
}
```

### Next.js Configuration

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "extends": ["@mfyuu/biome-config/next"]
}
```

## Configuration Contents

### base

- Basic formatting settings (indentation, line breaks, etc.)
- Common TypeScript/JavaScript lint rules
- General best practices

### react

- Inherits all settings from base
- React/JSX specific rules
- Hooks-related rules
- Accessibility rules

### next

- Inherits all settings from react
- Next.js specific file pattern exclusions
- Support for both App Router and Pages Router

## Customization

You can override inherited settings by adding custom configuration in your `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "extends": ["@mfyuu/biome-config/base"],
  "formatter": {
    "indentWidth": 4
  }
}
```

## Peer Dependencies

This package requires `@biomejs/biome` as a peer dependency. Install it separately in your project:

```bash
npm install -D @biomejs/biome
```

## License

MIT

## Author

mfyuu