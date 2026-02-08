<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="imgs/logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="imgs/logo-light.png">
  <img alt="LMMs-Lab Writer" src="imgs/logo-light.png">
</picture>

### Think Deep, Write Easy.

Stop manually writing LaTeX. Let agents handle the syntax while you focus on outlier science.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)
[![macOS](https://img.shields.io/badge/macOS-black.svg)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)
[![Windows](https://img.shields.io/badge/Windows-black.svg)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)
[![Linux](https://img.shields.io/badge/Linux-black.svg)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)

[Download](https://writer.lmms-lab.com/download) | [Documentation](https://writer.lmms-lab.com/docs) | [Website](https://writer.lmms-lab.com)

</div>

---

## There's a reason you're still frustrated.

| Feature | Overleaf | LMMs-Lab Writer |
|---------|----------|-----------------|
| File storage | Cloud only | Local (your machine) |
| AI editing | Built-in grammar help | OpenCode & More AI Agents |
| Compilation | Their servers | Local (faster, flexible) |
| Git integration | Paid plans only | First-class |
| Offline work | Not available | Full support |
| Price | $21-42/month | Open source |

## How it works

Your files stay on your machine. AI tools edit directly. You compile and commit locally.

```
Your laptop
+---------------------------------+
|  ~/papers/neurips-2025/         |
|  +-- main.tex    <-- AI edits   |
|  +-- figures/                   |
|  +-- refs.bib                   |
|                                 |
|  Claude Code / Cursor / Codex   |
|       | Direct file access      |
|  LMMs-Lab Writer (Tauri app)    |
+---------------------------------+
```

## Quick Start

**1. Download**

```bash
# macOS (Homebrew)
brew tap EvolvingLMMs-Lab/tap && brew install --cask lmms-lab-writer

# Or download directly from releases
```

[Download for macOS / Windows / Linux](https://writer.lmms-lab.com/download) | [All Releases](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)

**2. Open your project**

Launch the app. Click "Open Folder". Select your LaTeX project.

**3. Write with AI**

```
Claude Code: "Add a related work section comparing our method to LoRA"
Cursor:      "Fix the table formatting in Section 3"
Codex:       "Generate a figure showing the training curves"
OpenCode:    Use the integrated AI panel directly in the app
```

The editor shows real-time changes. Hit compile. Done.

## Works with any AI editor

| Tool | How it works |
|------|--------------|
| Claude Code | Direct file editing via terminal |
| Cursor | Edit in Cursor, preview in Writer |
| Codex CLI | Batch edits via command line |
| OpenCode | Integrated panel in app |
| Any AI Editor | If it can edit files, it works |

## Features

- **Local-First** - Your files never leave your machine
- **AI-Native** - Designed for Claude, Cursor, Codex, and any AI editor
- **Real-time Preview** - See changes as AI writes them
- **Git Integration** - Stage, commit, diff, push, pull, and publish to GitHub
- **Local Compilation** - pdfLaTeX, XeLaTeX, LuaLaTeX via `latexmk`
- **Built-in Terminal** - Full PTY terminal for advanced operations
- **OpenCode Panel** - Integrated AI chat with task and tool display
- **File Tree** - Project navigation with drag-and-drop support
- **Diff Viewer** - Inline and unified diff review before committing
- **Cross-Platform** - macOS (Apple Silicon & Intel), Windows, Linux
- **Recent Projects** - Quick access to frequently edited papers
- **LaTeX Detection** - Auto-detects compilers and main files

## Architecture

```
lmms-lab-writer/                    # pnpm + Turbo monorepo
├── apps/
│   ├── desktop/                    # Tauri v2 desktop app
│   │   ├── src/                    # Next.js frontend (React 19, static export)
│   │   │   ├── app/page.tsx        # Main editor page
│   │   │   ├── components/         # 40+ React components
│   │   │   └── lib/tauri/          # Tauri IPC hooks
│   │   └── src-tauri/              # Rust backend
│   │       └── src/commands/       # fs, git, latex, terminal, opencode, auth
│   ├── web/                        # Marketing website (Next.js 15, Vercel)
│   │   ├── src/app/                # Landing, docs, auth, download pages
│   │   └── content/docs/           # MDX documentation
│   └── video/                      # Marketing video (Remotion)
├── packages/
│   └── shared/                     # Shared TypeScript types & utilities
├── docs/                           # Design system, marketing, guides
├── turbo.json                      # Build orchestration
└── pnpm-workspace.yaml             # Monorepo config
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | Tauri v2 (Rust backend) |
| Frontend | React 19, Next.js 16 (static export) |
| Editor | CodeMirror 6 (LaTeX), Monaco (diff) |
| Terminal | xterm.js + portable-pty |
| UI | Tailwind CSS 4, Radix UI, Phosphor Icons, Framer Motion |
| Async Runtime | Tokio (full features) |
| Build | pnpm 10, Turbo, TypeScript 5.9 (strict) |
| Website | Next.js 15, Supabase, MDX |

### Rust Command Modules

| Module | Purpose |
|--------|---------|
| `fs` | File operations, directory watching, file tree |
| `git` | Status, log, diff, commit, push, pull, clone, GitHub CLI |
| `latex` | Compilation, compiler detection, main file detection |
| `terminal` | PTY spawn, write, resize, kill |
| `opencode` | AI integration start/stop/status |
| `auth` | OAuth callback server |

## Requirements

- **LaTeX distribution** (one of):
  - [MacTeX](https://www.tug.org/mactex/) (macOS)
  - [TeX Live](https://www.tug.org/texlive/) (Linux / cross-platform)
  - [MiKTeX](https://miktex.org/) (Windows)
- **Git** (for version control features)

## FAQ

**Do I need an account?**
No. Everything runs locally. Accounts are optional and only for cloud sync features.

**Is my data sent anywhere?**
No. All files stay on your machine. AI tools run locally or through your own API keys.

**Can I use this with Overleaf projects?**
Yes. Clone your Overleaf git repo locally and open it in Writer.

**Which LaTeX engines are supported?**
pdfLaTeX, XeLaTeX, and LuaLaTeX, all managed through `latexmk`.

**Does it work offline?**
Yes. Editing, compilation, and Git operations all work without internet.

## Development

```bash
# Clone and install
git clone https://github.com/EvolvingLMMs-Lab/lmms-lab-writer.git
cd lmms-lab-writer
pnpm install

# Run desktop app in dev mode
pnpm tauri:dev

# Run website in dev mode
pnpm --filter @lmms-lab/writer-web dev

# Build desktop app
pnpm tauri:build

# Type check
cd apps/desktop/src-tauri && cargo check     # Rust
cd apps/web && pnpm tsc --noEmit             # TypeScript (web)
```

See [AGENTS.md](AGENTS.md) for full development guide, conventions, and debugging tips.

## License

MIT

---

<div align="center">

**Built by [LMMs-Lab](https://lmms-lab.com)**

Every legendary paper started somewhere. Yours starts here.

</div>
