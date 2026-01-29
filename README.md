<div align="center">

# LMMs-Lab Writer

### Think Deep, Write Easy.

Stop manually writing LaTeX. Let agents handle the syntax while you focus on outlier science.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)
[![macOS](https://img.shields.io/badge/macOS-black.svg)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)

[Download](https://writer.lmms-lab.com/download) | [Documentation](https://writer.lmms-lab.com/docs) | [Website](https://writer.lmms-lab.com)

</div>

---

## There's a reason you're still frustrated.

| Feature | Overleaf | LMMs-Lab Writer |
|---------|----------|-----------------|
| File storage | Cloud only | Local (your machine) |
| AI editing | Built-in grammar help | OpenCode & More AI Agents |
| Compilation | Their servers | Local (faster, offline) |
| Git integration | Paid plans only | First-class |
| Offline work | Not available | Full support |
| Price | $21-42/month | Free & Very Cheap |

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

[Download for macOS](https://writer.lmms-lab.com/download) | [All Releases](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)

**2. Open your project**

Launch the app. Click "Open Folder". Select your LaTeX project.

**3. Write with AI**

```
Claude Code: "Add a related work section comparing our method to LoRA"
Cursor:      "Fix the table formatting in Section 3"  
Codex:       "Generate a figure showing the training curves"
```

The editor shows real-time changes. Hit compile. Done.

## Works with any AI editor

| Tool | How it works |
|------|--------------|
| Claude Code | Direct file editing via MCP |
| Cursor | Edit in Cursor, preview in app |
| Codex CLI | Batch edits via command line |
| OpenCode | Integrated panel in app |
| Any AI Editor | If it can edit files, it works |

## Features

- **Local-First** - Your files never leave your machine
- **AI-Native** - Designed for Claude, Cursor, Codex, and any AI editor
- **Real-time Preview** - See changes as AI writes them
- **Git Integration** - Commit, diff, and push without leaving the editor
- **Local Compilation** - `latexmk` with XeLaTeX/LuaLaTeX support
- **Built-in Terminal** - For advanced operations
- **OpenCode Panel** - Integrated AI chat

## Requirements

- LaTeX distribution ([MacTeX](https://www.tug.org/mactex/), [TeX Live](https://www.tug.org/texlive/), or [MiKTeX](https://miktex.org/))
- Git (for version control features)

## FAQ

**Do I need an account?**
No. Everything runs locally.

**Is my data sent anywhere?**
No. All files stay on your machine.

**Can I use this with Overleaf projects?**
Yes. Clone your Overleaf git repo locally and edit here.

## Development

```bash
git clone https://github.com/EvolvingLMMs-Lab/lmms-lab-writer.git
cd latex-writer
pnpm install
pnpm tauri:dev
```

## License

MIT

---

<div align="center">

**Built by [LMMs-Lab](https://lmms-lab.com)**

Every legendary paper started somewhere. Yours starts here.

</div>
