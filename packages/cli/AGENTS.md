# AGENTS.md - CLI Daemon

**Package:** `@lmms-lab/writer-cli`
**Binaries:** `llw`, `lmms-lab-writer`

## Overview

Local Node.js daemon bridging the web editor to the local filesystem. Starts a WebSocket server on port 3001. Handles PTY terminal, file watching, Git operations, and LaTeX compilation.

## Key Hotspot

- `src/commands/serve.ts`: WebSocket server logic, PTY management, and Git/LaTeX command execution.

## WebSocket Protocol

### Client to Server (Inbound)

| Type          | Payload                          | Description                                                           |
| :------------ | :------------------------------- | :-------------------------------------------------------------------- |
| `set-project` | `path: string`                   | Sets active directory and starts watcher/PTY                          |
| `read-file`   | `path: string`                   | Reads file content relative to project root                           |
| `write-file`  | `path: string, content: string`  | Overwrites/creates file                                               |
| `compile`     | `file?: string, engine?: string` | Runs `latexmk` (default: xelatex)                                     |
| `input`       | `data: string`                   | Sends keystrokes to PTY process                                       |
| `resize`      | `cols: number, rows: number`     | Resizes PTY terminal                                                  |
| `git-*`       | Various                          | Executes `git status`, `add`, `commit`, `push`, `pull`, `log`, `diff` |

### Server to Client (Outbound)

| Type           | Payload            | Description                         |
| :------------- | :----------------- | :---------------------------------- |
| `files`        | `data: FileNode[]` | Full directory tree (recursive)     |
| `file-changed` | `path: string`     | Triggered by chokidar on FS changes |
| `output`       | `data: string`     | Incremental stdout/stderr from PTY  |
| `pdf-url`      | `url: string`      | `file://` link to compiled PDF      |
| `git-status`   | `data: GitStatus`  | Structured Git porcelain info       |

## Git Operations

Implemented via `execSync` with `--porcelain` and custom parsing in `serve.ts`.

- `getGitStatus`: Parses `git status --porcelain` into staged/unstaged changes.
- `getGitLog`: Custom format `%H%n%h%n%s%n%an%n%ci%n---` for structured history.
- `gitClone`: Clones to `~/Documents` by default if no path provided.

## LaTeX Template System

Templates located in `templates/`. Copied to new projects during initialization.

- `neurips`: Standard NeurIPS 2024 style files.
- `iclr`: ICLR 2025 conference style and bst.
- `tech-report`: Generic technical report class.

## System Dependencies

The following must be available in the user's `PATH`:

- `git`: For all version control features.
- `latexmk`: Primary build tool.
- `xelatex` / `lualatex`: Engines used by `latexmk`.
- `node-pty`: Requires build tools (C++, Python) for native compilation.
