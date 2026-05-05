# Mailspring LM Studio translator

A [Mailspring](https://github.com/Foundry376/Mailspring) plugin that translates **Chinese** and **Japanese** email to **English** using a local LLM via [LM Studio](https://lmstudio.ai/) (OpenAI-compatible API, default `http://127.0.0.1:1234`).

It does **not** use the LLM for language detection. Script heuristics (Hiragana/Katakana → Japanese; Han characters → Chinese) decide when to translate. All other languages are left unchanged.

## Features

- **Local translation** through LM Studio’s chat API (`/v1/chat/completions`).
- **Same `localStorage` contract as Mailspring’s built-in translation plugin** (`translated-<messageId>`, `translated-index`) so the **message body view** can show the English HTML in the standard iframe.
- A **MessageViewExtension** applies stored HTML on every body pass (so you are not stuck until an app restart).
- **Prefetch** for messages in the focused thread (configurable concurrency).
- Short **status line** above the message: translating, success, or error text.

## Requirements

- [Mailspring](https://getmailspring.com/) ≥ 1.6.3 (see `package.json` → `engines`).
- LM Studio running locally with the **local server** enabled and a **model loaded** (the plugin uses `GET /v1/models` and picks the first model).
- [Node.js](https://nodejs.org/) for building from source (`npm install`, `npm run build`).

## Install

1. Clone or copy this folder.
2. In the plugin directory run:

   ```bash
   npm install
   npm run build
   ```

3. Copy or symlink the folder into Mailspring’s **packages** directory (same idea as the [plugin starter](https://github.com/Foundry376/Mailspring-Plugin-Starter)):

   | OS      | Typical path |
   |---------|----------------|
   | Linux   | `~/.config/Mailspring/packages/` |
   | macOS   | `~/Library/Application Support/Mailspring/packages/` |
   | Windows | `%APPDATA%\Mailspring\packages\` |

4. Restart Mailspring, or reload the main window (Developer tools → reload).

Mailspring expects **compiled** JavaScript under `lib/` (this repo includes it after `npm run build`). Keep `package.json` → `"main": "./lib/main"`.

## Configuration

In Mailspring preferences, settings are namespaced by package name (`mailspring-lmstudio-translator`):

| Key | Default | Meaning |
|-----|---------|---------|
| `lmstudioBaseUrl` | `http://127.0.0.1:1234` | LM Studio OpenAI root URL (no trailing slash). |
| `prefetchConcurrency` | `2` | Parallel prefetch requests (1–8). |

## Built-in “Translation” plugin

Mailspring ships an optional **Translation** plugin (Yandex, Pro features, etc.). This plugin **reuses the same `localStorage` keys**. For less clutter and fewer duplicate headers, consider **disabling** the official Translation plugin under **Preferences → Plugins** while using this one.

## Development

- **Source:** `src/` (TypeScript/JSX compiled with `tsc` to `lib/`).
- **Styles:** `styles/lmstudio-translator.less` (loaded automatically by Mailspring).
- **Test:** `npm test` runs `npm run build`.

## Troubleshooting

- **Nothing translates:** Confirm the message body is **Chinese or Japanese** by the plugin’s rules; other languages are skipped on purpose.
- **LM Studio errors:** Ensure the server is on and a model is loaded; check the red error strip above the message.
- **Stylesheet compile errors in Mailspring:** Some themes expose fewer Less variables; the stylesheet avoids uncommon tokens where possible.

## License

MIT (see repository).
