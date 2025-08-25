# @mfyuu/biome-config

Shareable Biome configuration package for JavaScript/TypeScript projects by [@mfyuu](https://github.com/mfyuu).

Choose from three configurations based on your project type: base, React, or Next.js.

## Usage

### Starter Wizard (Recommended)

The easiest way to set up Biome in your project is using our interactive CLI wizard:

```bash
npx @mfyuu/biome-config
```

This command will:

- Detect your project type (base, React, or Next.js)
- Install required dependencies (`@biomejs/biome` and `@mfyuu/biome-config`)
- Create `biome.json` or `biome.jsonc` with the appropriate configuration
- Set up VS Code integration with `.vscode/settings.json`

For all available options:

```bash
npx @mfyuu/biome-config --help
```

### Manual Setup

If you prefer to set up manually:

1. Install the required packages:

```bash
npm i -D @biomejs/biome @mfyuu/biome-config
```

2. Create `biome.json` or `biome.jsonc` in your project root:

#### Base Configuration (Node.js/TypeScript Projects)

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "extends": ["@mfyuu/biome-config/base"]
}
```

#### React Configuration

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "extends": ["@mfyuu/biome-config/react"]
}
```

#### Next.js Configuration

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "extends": ["@mfyuu/biome-config/next"]
}
```

> [!note]
> If you have problems with resolving the physical file, you can use the one published on this site:
>
> ```json
> "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json"
> ```

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

You can override inherited settings by adding custom configuration in your `biome.json` or `biome.jsonc`:

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "extends": ["@mfyuu/biome-config/base"],
  "formatter": {
    "indentStyle": "space"
  }
}
```

## License

[MIT](./LICENSE) License © 2025-PRESENT [Kazuya Suzuki](https://github.com/mfyuu)
