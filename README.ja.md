# @mfyuu/biome-config

[English](./README.md) | Japanese

[@mfyuu](https://github.com/mfyuu)による JavaScript/TypeScript プロジェクト用の共有可能な Biome 設定パッケージです。

プロジェクトタイプに応じて、base、React、Next.js の 3 つの設定から選択できます。

## Usage

### Starter Wizard (Recommended)

プロジェクトに Biome をセットアップする最も簡単な方法は、インタラクティブな CLI ウィザードを使用することです：

```bash
npx @mfyuu/biome-config
```

このコマンドは以下を実行します：

- プロジェクトタイプの検出（base、React、または Next.js）
- 必要な依存関係のインストール（`@biomejs/biome` と `@mfyuu/biome-config`）
- 適切な設定で `biome.json` または `biome.jsonc` を作成
- `package.json` に Biome スクリプトを追加（`format`、`lint`、`lint-fix`、`check`）
- `.vscode/settings.json` で VS Code 統合をセットアップ
  - Biome のみのフォーマットか、Markdown ファイル用の Biome + Prettier かを選択
- オプションで Git hooks 自動化のための Lefthook 統合
  - lefthook 設定ファイルの作成
  - 自動 Git hooks インストール用の `prepare` スクリプトの追加

利用可能なすべてのオプションを確認するには：

```bash
npx @mfyuu/biome-config --help
```

### Manual Setup

手動でセットアップしたい場合：

1. 必要なパッケージをインストール：

```bash
npm i -D @biomejs/biome @mfyuu/biome-config
```

2. プロジェクトルートに `biome.json` または `biome.jsonc` を作成：

#### Base Configuration (Node.js/TypeScript プロジェクト)

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
> 物理ファイルの解決に問題がある場合は、このサイトで公開されているものを使用できます：
>
> ```json
> "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json"
> ```

## Configuration Contents

### base

- 基本的なフォーマット設定（インデント、改行など）
- 一般的な TypeScript/JavaScript lint ルール
- 一般的なベストプラクティス

### react

- base の全設定を継承
- React/JSX 固有のルール
- Hooks 関連のルール
- アクセシビリティルール

### next

- react の全設定を継承
- Next.js 固有のファイルパターン除外
- App Router と Pages Router の両方をサポート

## Customization

`biome.json` または `biome.jsonc` にカスタム設定を追加することで、継承した設定を上書きできます：

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
