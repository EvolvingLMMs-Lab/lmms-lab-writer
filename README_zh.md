<div align="center">

<a href="https://writer.lmms-lab.com">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="imgs/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="imgs/logo-light.svg">
  <img alt="LMMs-Lab Writer" src="imgs/logo-light.svg" width="512">
</picture>
</a>

**言者所以在意，得意而忘言。**

[![Website](https://img.shields.io/badge/-官网-8957e5?style=flat-square&logo=safari&logoColor=white)](https://writer.lmms-lab.com)
[![Docs](https://img.shields.io/badge/-文档-0969da?style=flat-square&logo=gitbook&logoColor=white)](https://writer.lmms-lab.com/docs)
[![Download](https://img.shields.io/badge/-下载-2ea44f?style=flat-square&logo=github&logoColor=white)](https://writer.lmms-lab.com/download)

[![macOS](https://img.shields.io/badge/-macOS-111111?style=flat-square&logo=apple&logoColor=white)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)
[![Windows](https://img.shields.io/badge/-Windows-0078D4?style=flat-square&logo=windows11&logoColor=white)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-f0c000?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/EvolvingLMMs-Lab/lmms-lab-writer?style=flat-square&color=e8a317)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer)

[English](README.md) | 中文 | [日本語](README_ja.md)

</div>

---

![](imgs/demo.webp)

## 为什么选择 LMMs-Lab Writer？

你是一名研究者。你的时间应该花在突破性研究上——而不是 LaTeX 模板、宏包冲突，或者在 Overleaf 和 ChatGPT 之间来回复制粘贴。

LMMs-Lab Writer 是一款本地优先、AI 原生的 LaTeX 编辑器。你的文件始终留在本地。AI 代理直接编辑它们。你只需编译、审阅和发布——一切都在一个应用中完成。

## 一键 LaTeX 环境配置

不再需要耗时数小时安装 TeX Live。LMMs-Lab Writer **自动检测并安装最小化的 LaTeX 发行版**。如果编译时缺少某个宏包，它会自动安装。零手动配置——打开应用即可开始写作。

支持 **TinyTeX**、**MiKTeX**、**MacTeX** 和 **TeX Live**——均由应用一键管理安装。

<div align="center">
<img src="imgs/latex.png" alt="一键 LaTeX 环境配置，自动安装宏包" width="720">
</div>

## 为每种语言而生

支持 **中文、英文、日文、韩文、阿拉伯文以及任何语言** 的写作。XeLaTeX 和 LuaLaTeX 作为一等公民，提供完整的 Unicode 和系统字体支持。CJK 文档可通过 `ctex`、`xeCJK` 等多语言宏包开箱即用，无需额外配置。

<div align="center">
<img src="imgs/compile-cn.png" alt="完整的 CJK 和 Unicode 支持（XeLaTeX）" width="720">
</div>

## OpenCode 驱动的 AI 工作流

内置的 **OpenCode** 面板将 AI 直接嵌入你的编辑器：

```
你："添加一个相关工作章节，比较我们的方法与 LoRA 和 QLoRA"
AI 代理：*实时写入 main.tex*
你：*点击编译* 完成。
```

- 与 AI 对话、附加文件、管理会话
- AI 读取你的整个项目以获取完整上下文
- 修改即时显示在编辑器中
- 支持 **任何模型**——Claude、GPT、Gemini、DeepSeek、本地模型

同时兼容 **Claude Code**、**Cursor**、**Codex CLI**、**Aider** 等任何可以编辑文件的工具。编辑器会监听你的项目目录，实时反映所有更改。

<div align="center">
<img src="imgs/interaction.png" alt="OpenCode AI 集成——与 AI 对话编写 LaTeX" width="720">
</div>

## 内置 Git 协作

Git 不是附加功能——它 **直接内置在侧边栏** 中：

- **暂存、提交、差异对比、推送、拉取**——全部通过界面操作
- **AI 生成提交信息**——基于你的暂存更改
- **并排差异查看器**——在提交前审阅 AI 的编辑
- **一键 GitHub 发布**——无需打开终端即可创建仓库并推送
- **GitHub CLI 集成**——无缝认证

不再需要每月支付 $21 来使用 Overleaf 的 Git 同步。版本控制免费且为一等公民。

<div align="center">
<img src="imgs/git-support.png" alt="Git 集成——从侧边栏暂存、提交、差异对比、推送" width="720">
</div>

## 完全开源

MIT 许可证。每一行代码都在 GitHub 上。没有供应商锁定、没有遥测、没有隐藏费用。

- 你的文件 **始终留在你的设备上**
- AI 工具使用 **你自己的 API 密钥**
- 一切功能 **离线可用**（编辑、编译、Git）
- 你可以自由 fork、修改、自托管——它完全属于你

## 跨平台

原生运行于 **macOS**（Apple Silicon 和 Intel）以及 **Windows**（64 位）。基于 [Tauri](https://tauri.app/) 构建，提供原生性能——不是 Electron 套壳。

<div align="center">
<table>
<tr>
<td align="center"><strong>浅色模式</strong></td>
<td align="center"><strong>深色模式</strong></td>
</tr>
<tr>
<td><img src="imgs/light.png" alt="浅色模式" width="360"></td>
<td><img src="imgs/dark.png" alt="深色模式" width="360"></td>
</tr>
</table>
</div>

```bash
# macOS (Homebrew)
brew tap EvolvingLMMs-Lab/tap && brew install --cask lmms-lab-writer
```

或从官网[下载 macOS / Windows 版本](https://writer.lmms-lab.com/download)。

---

## Overleaf vs. LMMs-Lab Writer

| | Overleaf | LMMs-Lab Writer |
|---|---|---|
| **文件存储** | 仅限云端 | 本地（你的设备） |
| **AI 编辑** | 基础语法检查 | OpenCode + 任意 AI 代理 |
| **非英文支持** | 有限的 CJK 支持 | 完整 Unicode、XeLaTeX、系统字体 |
| **LaTeX 配置** | 预配置 | 一键安装，代理管理 |
| **Git** | 仅付费用户 | 免费，内置侧边栏 |
| **离线使用** | 不支持 | 完整支持 |
| **编译** | 云端队列 | 本地，即时 |
| **开源** | 否 | MIT 许可证 |
| **价格** | $21-42/月 | 免费 |

## 快速开始

**1. 下载安装**

从 [writer.lmms-lab.com/download](https://writer.lmms-lab.com/download) 下载，或在 macOS 上通过 Homebrew 安装。

**2. 打开项目**

启动应用，点击 **打开文件夹**，选择你的 LaTeX 项目。应用会自动检测主文件。

**3. 用 AI 写作**

使用内置的 OpenCode 面板，或在终端中运行任何 AI 工具：

```bash
claude "撰写摘要，总结我们的三个关键贡献"
```

**4. 编译与发布**

点击编译，预览 PDF。暂存更改、提交、推送到 GitHub——全部通过侧边栏操作。

## 常见问题

**需要单独安装 LaTeX 吗？**
不一定。应用可以自动检测并安装最小化的 LaTeX 发行版。编译时缺少的宏包会自动安装。

**支持非英文文档吗？**
支持。通过 XeLaTeX 和 LuaLaTeX 提供完整的 Unicode 支持。中日韩文、阿拉伯文、西里尔文——全部开箱即用。

**我的数据会被发送到任何地方吗？**
不会。所有文件留在你的设备上。AI 工具在本地运行或通过你自己的 API 密钥调用。

**可以和 Overleaf 项目一起用吗？**
可以。将你的 Overleaf Git 仓库克隆到本地，然后用 Writer 打开即可。

**支持离线使用吗？**
支持。编辑、编译和 Git 操作均可在无网络环境下使用。

## 开发

```bash
git clone https://github.com/EvolvingLMMs-Lab/lmms-lab-writer.git
cd lmms-lab-writer
pnpm install
pnpm tauri:dev
```

详见 **[开发者指南](docs/dev.md)**，了解完整架构、技术栈、Rust 命令、调试方法和贡献规范。

## 许可证

MIT

---

<div align="center">

**由 [LMMs-Lab](https://lmms-lab.com) 构建**

每一篇传世论文都有起点。你的，从这里开始。

</div>
