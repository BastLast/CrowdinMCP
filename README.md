# Crowdin MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes Crowdin translation management capabilities as tools for AI assistants.

## Features

The server provides the following tools:

| Tool | Description |
|------|-------------|
| `list_projects` | List all accessible Crowdin projects |
| `get_project` | Get detailed project information |
| `list_files` | List all source files in a project |
| `translation_progress` | Get translation & approval progress by language |
| `list_source_strings` | List source strings with filtering (file, CroQL, text) |
| `get_source_string` | Get a single source string by ID |
| `list_language_translations` | List translations for a language |
| `list_string_translations` | List all translations for a specific string |
| `add_translation` | Add or propose a new translation |
| `delete_translation` | Delete a specific translation |
| `delete_all_translations` | Delete all translations for a string |
| `approve_translation` | Approve a translation |
| `remove_approval` | Remove a translation approval |
| `search_and_replace_translations` | Bulk find & replace in translations |

## Prerequisites

- Node.js >= 18
- A [Crowdin API token](https://crowdin.com/settings#api-key)

## Installation

```bash
npm install
```

## Configuration

Set the `CROWDIN_TOKEN` environment variable:

```bash
export CROWDIN_TOKEN="your-crowdin-api-token"
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### MCP Client Configuration

Add the server to your MCP client (e.g. VS Code, Claude Desktop):

```json
{
  "mcpServers": {
    "crowdin": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "CROWDIN_TOKEN": "your-crowdin-api-token"
      }
    }
  }
}
```

Or for development with `tsx`:

```json
{
  "mcpServers": {
    "crowdin": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "env": {
        "CROWDIN_TOKEN": "your-crowdin-api-token"
      }
    }
  }
}
```

## Scripts

Utility scripts in `scripts/` for bulk translation operations:

| Script | Purpose |
|--------|---------|
| `fix-translations.ts` | Bulk search & replace for branding updates |
| `fix-followup.ts` | Follow-up fixes after initial bulk update |
| `fix-individual-qa.ts` | Fix individual QA issues |
| `approve-fixes.ts` | Approve corrected translations |
| `verify-fixes.ts` | Verify applied fixes |
| `assess-translations.ts` | Assess translation quality |
| `compare-translations.ts` | Compare translations across languages |
| `revoke-all-approvals.ts` | Revoke all approvals for a language |
| `search-replace-preview.ts` | Preview search & replace changes |

Run any script with:

```bash
npx tsx scripts/<script-name>.ts
```

## Tech Stack

- [TypeScript](https://www.typescriptlang.org/)
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) — MCP server SDK
- [@crowdin/crowdin-api-client](https://www.npmjs.com/package/@crowdin/crowdin-api-client) — Crowdin API client

## License

MIT
