<div align="center">

# LMMs-Lab Writer

**Stop writing LaTeX. Start thinking.**

Let Claude, Cursor, and Codex write your papers while you focus on what matters - your research.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)
[![macOS](https://img.shields.io/badge/macOS-black.svg)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)

[Download](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases) | [GitHub](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer)

</div>

---

## The Problem

You're a researcher. You should be thinking about your next breakthrough - not wrestling with LaTeX syntax, citation formatting, or figure placement.

Every hour spent on `\begin{figure}[htbp]` is an hour not spent on your actual work.

## The Solution

**LMMs-Lab Writer** is a local-first LaTeX editor designed for AI pair-programming. Your files stay on your machine. AI tools edit directly. You compile and commit locally.

```
Your laptop
┌────────────────────────────────┐
│  ~/papers/neurips-2025/        │
│  ├── main.tex  <-- AI edits    │
│  ├── figures/                  │
│  └── refs.bib                  │
│                                │
│  Claude Code / Cursor / Codex  │
│  ↕ Direct file access          │
│  LMMs-Lab Writer (Tauri app)   │
└────────────────────────────────┘
```

## Why Local-First?

| Overleaf                     | LMMs-Lab Writer          |
| ---------------------------- | ------------------------ |
| Files locked in cloud        | Your files, your machine |
| AI can't access your project | AI edits directly        |
| Compile on their servers     | Compile locally (faster) |
| Git sync is an afterthought  | Git is first-class       |
| $15/month for "features"     | Free and open source     |

## Quick Start

### 1. Download the App

Download the latest release from [GitHub Releases](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases):

- **macOS**: `LMMs-Lab Writer_x.x.x_aarch64.dmg` (Apple Silicon) or `_x64.dmg` (Intel)
- **Windows**: `LMMs-Lab Writer_x.x.x_x64-setup.exe`
- **Linux**: `LMMs-Lab Writer_x.x.x_amd64.AppImage`

### 2. Open Your Project

Launch the app and click "Open Folder" to select your LaTeX project directory.

### 3. Write with AI

Any AI tool with file access can now edit your LaTeX:

- **Claude Code**: "Add a related work section comparing our method to LoRA"
- **Cursor**: "Fix the table formatting in Section 3"
- **Codex**: "Generate a figure showing the training curves"

The editor shows real-time changes. Hit compile. Done.

## Works With

<div align="center">

| Tool          | Status      | How it works                   |
| ------------- | ----------- | ------------------------------ |
| Claude Code   | Recommended | Direct file editing via MCP    |
| Cursor        | Supported   | Edit in Cursor, preview in app |
| Codex CLI     | Supported   | Batch edits via command line   |
| OpenCode      | Supported   | Integrated panel in app        |
| Any AI Editor | Supported   | If it can edit files, it works |

</div>

## Features

- **Local-First** - Your files never leave your machine
- **AI-Native** - Designed for Claude, Cursor, Codex, and any AI editor
- **Real-time Preview** - See changes as AI writes them
- **Git Integration** - Commit, diff, and push without leaving the editor
- **Compilation** - Local `latexmk` with XeLaTeX/LuaLaTeX support
- **Terminal** - Built-in terminal for advanced operations
- **OpenCode Panel** - Integrated AI chat panel

## Development

```bash
# Clone
git clone https://github.com/EvolvingLMMs-Lab/lmms-lab-writer.git
cd latex-writer

# Install
pnpm install

# Development
pnpm tauri:dev

# Build
pnpm tauri:build
```

## Requirements

- LaTeX distribution (MacTeX, TeX Live, or MiKTeX)
- Git (for version control features)

## FAQ

**Q: Do I need an account?**
A: No. Everything runs locally on your machine.

**Q: Is my data sent anywhere?**
A: No. All files stay on your machine.

**Q: Can I use this with Overleaf projects?**
A: Yes. Clone your Overleaf git repo locally and use this for editing.

**Q: Why not just use Overleaf?**
A: You can't give Claude direct access to Overleaf. With local files, AI tools work naturally.

## License

MIT - Use it however you want.

---

<div align="center">

**Built by [LMMs-Lab](https://github.com/LMMs-Lab)**

_Stop formatting. Start discovering._

</div>
