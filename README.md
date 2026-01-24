<div align="center">

# Agentic LaTeX Writer

**Stop writing LaTeX. Start thinking.**

Let Claude, Cursor, and Codex write your papers while you focus on what matters - your research.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

[Live Demo](https://agentic-latex-writer.vercel.app) | [Documentation](https://agentic-latex-writer.vercel.app/docs) | [GitHub](https://github.com/EvolvingLMMs-Lab/agentic-latex-writer)

</div>

---

## The Problem

You're a researcher. You should be thinking about your next breakthrough - not wrestling with LaTeX syntax, citation formatting, or figure placement.

Every hour spent on `\begin{figure}[htbp]` is an hour not spent on your actual work.

## The Solution

**Agentic LaTeX Writer** is a local-first LaTeX editor designed for AI pair-programming. Your files stay on your machine. AI tools edit directly. You compile and commit locally.

```
Your laptop                          Cloud (optional)
┌────────────────────────────────┐   ┌──────────────┐
│  ~/papers/neurips-2025/        │   │   Supabase   │
│  ├── main.tex  <-- AI edits    │   │   (sync)     │
│  ├── figures/                  │   └──────────────┘
│  └── refs.bib                  │
│                                │
│  Claude Code / Cursor / Codex  │
│  ↕ WebSocket                   │
│  llw serve (daemon)            │
└────────────────────────────────┘
```

## Why Local-First?

| Overleaf                     | Agentic LaTeX Writer     |
| ---------------------------- | ------------------------ |
| Files locked in cloud        | Your files, your machine |
| AI can't access your project | AI edits directly        |
| Compile on their servers     | Compile locally (faster) |
| Git sync is an afterthought  | Git is first-class       |
| $15/month for "features"     | Free and open source     |

## Quick Start

### 1. Install the CLI

```bash
# macOS / Linux
curl -fsSL https://agentic-latex-writer.vercel.app/install.sh | bash

# Windows
irm https://agentic-latex-writer.vercel.app/install.ps1 | iex
```

### 2. Open your project

```bash
cd ~/papers/my-paper
llw serve
```

### 3. Write with AI

Open [agentic-latex-writer.vercel.app](https://agentic-latex-writer.vercel.app) and select your folder. Now any AI tool with file access can edit your LaTeX:

- **Claude Code**: "Add a related work section comparing our method to LoRA"
- **Cursor**: "Fix the table formatting in Section 3"
- **Codex**: "Generate a figure showing the training curves"

The web editor shows real-time changes. Hit compile. Done.

## Works With

<div align="center">

| Tool          | Status      | How it works                       |
| ------------- | ----------- | ---------------------------------- |
| Claude Code   | Recommended | Direct file editing via MCP        |
| Cursor        | Supported   | Edit in Cursor, preview in browser |
| Codex CLI     | Supported   | Batch edits via command line       |
| OpenCode      | Supported   | VSCode extension support           |
| Any AI Editor | Supported   | If it can edit files, it works     |

</div>

## Features

- **Local-First** - Your files never leave your machine (unless you sync to cloud)
- **AI-Native** - Designed for Claude, Cursor, Codex, and any AI editor
- **Real-time Preview** - See changes as AI writes them
- **Git Integration** - Commit, diff, and push without leaving the editor
- **Compilation** - Local `latexmk` with XeLaTeX/LuaLaTeX support
- **Templates** - NeurIPS, ICLR, tech reports, and more
- **Collaboration** - Optional cloud sync for team projects

## Project Structure

```
agentic-latex-writer/
├── packages/
│   ├── cli/          # Local daemon (llw serve)
│   ├── web/          # Next.js 15 web editor
│   └── shared/       # Shared types
├── turbo.json        # Monorepo config
└── pnpm-workspace.yaml
```

## CLI Commands

```bash
llw serve              # Start local daemon (required for AI editing)
llw compile main.tex   # Compile LaTeX file
llw watch main.tex     # Watch mode - recompile on changes
llw init               # Initialize from template
llw login              # Connect to cloud sync (optional)
```

## Development

```bash
# Clone
git clone https://github.com/EvolvingLMMs-Lab/agentic-latex-writer.git
cd agentic-latex-writer

# Install
pnpm install

# Build
pnpm build

# Dev (web on :3000, daemon on :3001)
pnpm dev
```

## Requirements

- Node.js 20+
- LaTeX distribution (MacTeX, TeX Live, or MiKTeX)
- Git (for version control features)

## FAQ

**Q: Do I need an account?**
A: No. The CLI works fully offline. Accounts are only for optional cloud sync.

**Q: Is my data sent anywhere?**
A: Only if you enable cloud sync. Otherwise, everything stays local.

**Q: Can I use this with Overleaf projects?**
A: Yes. Clone your Overleaf git repo locally and use this for editing.

**Q: Why not just use Overleaf?**
A: You can't give Claude direct access to Overleaf. With local files, AI tools work naturally.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT - Use it however you want.

---

<div align="center">

**Built by [EvolvingLMMs Lab](https://github.com/EvolvingLMMs-Lab)**

_Stop formatting. Start discovering._

</div>
