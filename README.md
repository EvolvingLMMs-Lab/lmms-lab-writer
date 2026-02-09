<div align="center">

<a href="https://writer.lmms-lab.com">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="imgs/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="imgs/logo-light.svg">
  <img alt="LMMs-Lab Writer" src="imgs/logo-light.svg" width="512">
</picture>
</a>

**The AI-native LaTeX editor for researchers who prioritize ideas over syntax.**

[![Website](https://img.shields.io/badge/-Website-8957e5?style=flat-square&logo=safari&logoColor=white)](https://writer.lmms-lab.com)
[![Docs](https://img.shields.io/badge/-Docs-0969da?style=flat-square&logo=gitbook&logoColor=white)](https://writer.lmms-lab.com/docs)
[![Download](https://img.shields.io/badge/-Download-2ea44f?style=flat-square&logo=github&logoColor=white)](https://writer.lmms-lab.com/download)

[![macOS](https://img.shields.io/badge/-macOS-111111?style=flat-square&logo=apple&logoColor=white)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)
[![Windows](https://img.shields.io/badge/-Windows-0078D4?style=flat-square&logo=windows11&logoColor=white)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-f0c000?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/EvolvingLMMs-Lab/lmms-lab-writer?style=flat-square&color=e8a317)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer)

English | [中文](README_zh.md) | [日本語](README_ja.md)

</div>

---

![](imgs/demo.webp)

## Why LMMs-Lab Writer?

As a researcher, your time belongs to breakthroughs—not wrestling with LaTeX boilerplate, resolving package conflicts, or the endless copy-paste loop between Overleaf and ChatGPT.

LMMs-Lab Writer is a **local-first, AI-native** LaTeX editor. Your files remain secure on your machine. AI agents assist with editing directly. Compile, review, and publish—all within a single, unified environment.

## One-Click LaTeX Setup

Say goodbye to hour-long TeX Live installations. LMMs-Lab Writer **automatically detects and installs a lightweight LaTeX distribution**. If a package is missing, it’s installed on the fly during compilation. Zero manual configuration required—just open the app and start writing.

Supports **TinyTeX**, **MiKTeX**, **MacTeX**, and **TeX Live**—with streamlined, one-click management.

<div align="center">
<img src="imgs/latex.png" alt="One-click LaTeX setup with auto package installation" width="720">
</div>

## Built for Every Language

Write effortlessly in **English, Chinese, Japanese, Korean, Arabic, or any other language**. XeLaTeX and LuaLaTeX are supported out of the box with full Unicode and system font compatibility. CJK documents work instantly with `ctex`, `xeCJK`, and other multilingual packages—no extra setup needed.

<div align="center">
<img src="imgs/compile-cn.png" alt="Full CJK and Unicode support with XeLaTeX">
</div>

## AI-Powered Workflows with OpenCode

The built-in **OpenCode** panel brings AI directly into your editing experience:

```
You: "Add a related work section comparing our method to LoRA and QLoRA"
Agent: *writes directly to main.tex in real-time*
You: *hit compile* Done.
```

- Chat with AI, attach files, and manage context seamlessly
- AI analyzes your entire project for deep context awareness
- Edits are reflected in the editor in real-time
- Compatible with **any model**—Claude, GPT, Gemini, DeepSeek, or local LLMs

It also pairs perfectly with **Claude Code**, **Cursor**, **Codex CLI**, **Aider**, and other tools. The editor monitors your project directory, syncing external changes instantly.

<div align="center">
<img src="imgs/interaction.png" alt="OpenCode AI integration — chat with AI to write LaTeX" width="512">
</div>

## Git Integration for Modern Collaboration

Git isn't just an add-on; it's **deeply integrated into the sidebar**:

- **Stage, commit, diff, push, pull**—entirely via the UI
- **AI-generated commit messages** based on your staged changes
- **Side-by-side diff viewer** for reviewing AI suggestions before committing
- **One-click GitHub publishing**—create and push repositories without touching the terminal
- **Seamless GitHub CLI integration** for effortless authentication

Stop paying premium prices for basic Git sync. Here, version control is free, powerful, and built-in.

<div align="center">
<img src="imgs/git-support.png" alt="Git integration — stage, commit, diff, push from the sidebar" width="720">
</div>

## Fully Open Source

MIT licensed. Every line of code is open on GitHub. No vendor lock-in, no telemetry, no hidden costs.

- Your files **never leave your local machine**
- AI tools utilize **your own API keys**
- Fully functional **offline** (editing, compilation, Git)
- Fork it, modify it, self-host it—it's yours to control

## Cross-Platform

Native performance on **macOS** (Apple Silicon & Intel) and **Windows** (64-bit). Built with [Tauri](https://tauri.app/) for a lightweight, responsive experience—not just another heavy Electron wrapper.

<div align="center">
<table>
<tr>
<td align="center"><strong>Light Mode</strong></td>
<td align="center"><strong>Dark Mode</strong></td>
</tr>
<tr>
<td><img src="imgs/light.png" alt="Light mode" width="360"></td>
<td><img src="imgs/dark.png" alt="Dark mode" width="360"></td>
</tr>
</table>
</div>

```bash
# macOS (Homebrew)
brew tap EvolvingLMMs-Lab/tap && brew install --cask lmms-lab-writer
```

Or [download for macOS / Windows](https://writer.lmms-lab.com/download) from the website.

---

## Overleaf vs. LMMs-Lab Writer

| | Overleaf | LMMs-Lab Writer |
|---|---|---|
| **File storage** | Cloud only | Local (your machine) |
| **AI editing** | Basic grammar | OpenCode + any AI agent |
| **Non-English** | Limited CJK support | Full Unicode, XeLaTeX, system fonts |
| **LaTeX setup** | Pre-configured | One-click install, agent-managed |
| **Git** | Paid plans only | Free, built into sidebar |
| **Offline** | No | Full support |
| **Compilation** | Cloud queue | Local, instant |
| **Open source** | No | MIT license |
| **Price** | $21-42/month | Free |

## Quick Start

**1. Download & Install**

Get the latest version from [writer.lmms-lab.com/download](https://writer.lmms-lab.com/download), or install via Homebrew on macOS.

**2. Open Your Project**

Launch the app, click **Open Folder**, and select your LaTeX project. The main file is detected automatically.

**3. Write with AI**

Leverage the integrated OpenCode panel, or execute any AI tool via the terminal:

```bash
claude "Write the abstract summarizing our three key contributions"
```

**4. Compile & Publish**

One click to compile and preview your PDF. Stage changes, commit, and push to GitHub—all from the sidebar.

## FAQ

**Do I need to install LaTeX separately?**
Not necessarily. The app automates the installation of a minimal LaTeX distribution. Missing packages are handled automatically during compilation.

**Does it work with non-English documents?**
Absolutely. Full Unicode support is provided via XeLaTeX and LuaLaTeX. CJK, Arabic, Cyrillic—all work out of the box.

**Is my data sent anywhere?**
No. All files remain locally on your device. AI tools operate locally or via your personal API keys.

**Can I use this with Overleaf projects?**
Yes. Simply clone your Overleaf Git repository locally and open it in Writer.

**Does it work offline?**
Yes. Editing, compilation, and Git operations are fully functional without an internet connection.

## Development

```bash
git clone https://github.com/EvolvingLMMs-Lab/lmms-lab-writer.git
cd lmms-lab-writer
pnpm install
pnpm tauri:dev
```

See the **[Developer Guide](docs/dev.md)** for full architecture, tech stack, Rust commands, debugging, and contribution conventions.

## License

MIT

---

<div align="center">

**Built by [LMMs-Lab](https://lmms-lab.com)**

Every legendary paper started somewhere. Yours starts here.

</div>