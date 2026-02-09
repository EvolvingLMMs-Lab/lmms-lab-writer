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

作为研究人员，你的宝贵时间应倾注于那些突破性的发现——而不是浪费在繁琐的 LaTeX 模板、解决宏包冲突，或是在 Overleaf 和 ChatGPT 之间反复复制粘贴。

LMMs-Lab Writer 是一款**本地优先、AI 原生**的 LaTeX 编辑器。你的文件始终安全地存储在本地，而 AI 智能体则能直接协助编辑。编译、审阅、发布——所有环节都在一个应用内流畅完成。

## 一键搞定 LaTeX 环境

告别动辄数小时的 TeX Live 安装过程。LMMs-Lab Writer **自动检测并配置最小化的 LaTeX 发行版**。如果编译过程中发现缺少宏包，它会自动为你安装。无需任何手动配置，打开应用，即刻开始创作。

支持 **TinyTeX**、**MiKTeX**、**MacTeX** 和 **TeX Live**——所有环境配置均由应用一键接管。

<div align="center">
<img src="imgs/latex.png" alt="一键 LaTeX 环境配置，自动安装宏包" width="720">
</div>

## 原生支持多语言写作

无论是**中文、英文、日文、韩文，还是阿拉伯文**，都能流畅写作。XeLaTeX 和 LuaLaTeX 作为一等公民，提供对 Unicode 和系统字体的完整支持。通过内置的 `ctex`、`xeCJK` 等多语言宏包，中日韩（CJK）文档**开箱即用**，无需任何额外折腾。

<div align="center">
<img src="imgs/compile-cn.png" alt="完整的 CJK 和 Unicode 支持（XeLaTeX）" width="720">
</div>

## OpenCode：深度集成的 AI 工作流

内置的 **OpenCode** 面板将 AI 的能力直接注入编辑器核心：

```
你："增加一个相关工作章节，对比我们的方法与 LoRA 和 QLoRA 的异同"
AI 智能体：*实时在 main.tex 中撰写内容*
你：*点击编译* 搞定。
```

- 与 AI 对话、发送文件、管理会话上下文
- AI 能够读取整个项目，理解完整的上下文语境
- 修改内容即时呈现在编辑器中，所见即所得
- 支持 **任意模型**——无论是 Claude, GPT, Gemini, DeepSeek，还是本地运行的模型

它还完美兼容 **Claude Code**、**Cursor**、**Codex CLI**、**Aider** 等任何文件编辑工具。编辑器会实时监听项目目录，同步反映所有外部更改。

<div align="center">
<img src="imgs/interaction.png" alt="OpenCode AI 集成——与 AI 对话编写 LaTeX" width="720">
</div>

## 内置 Git，专为协作设计

Git 绝非事后补充的功能——它被**原生构建在侧边栏**中：

- **暂存、提交、对比差异、推送、拉取**——全图形化界面操作
- **AI 自动生成提交信息**——基于你的修改内容智能总结
- **并排差异查看器**——在提交前轻松审阅 AI 的修改
- **一键发布到 GitHub**——无需接触终端即可创建仓库并推送代码
- **GitHub CLI 集成**——无缝的身份验证体验

不再需要为 Overleaf 的 Git 同步功能每月支付 $21。在这里，版本控制是免费且核心的功能。

<div align="center">
<img src="imgs/git-support.png" alt="Git 集成——从侧边栏暂存、提交、差异对比、推送" width="720">
</div>

## 完全开源

采用 MIT 许可证。每一行代码都在 GitHub 上公开。没有供应商锁定，没有数据遥测，没有隐藏费用。

- 你的文件**永远不会离开你的设备**
- AI 工具使用**你自己的 API 密钥**
- 所有功能**完全离线可用**（编辑、编译、Git 操作）
- 自由 Fork、修改、自托管——它是完全属于你的工具

## 跨平台原生体验

原生支持 **macOS**（Apple Silicon 和 Intel）以及 **Windows**（64 位）。基于 [Tauri](https://tauri.app/) 构建，带来极致的原生性能——绝非笨重的 Electron 套壳应用。

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

或者直接从官网[下载 macOS / Windows 版本](https://writer.lmms-lab.com/download)。

---

## Overleaf vs. LMMs-Lab Writer

| | Overleaf | LMMs-Lab Writer |
|---|---|---|
| **文件存储** | 仅限云端 | 本地（完全掌控） |
| **AI 编辑** | 仅基础语法检查 | OpenCode + 任意 AI 智能体 |
| **多语言支持** | CJK 支持有限 | 完整 Unicode、XeLaTeX、系统字体支持 |
| **LaTeX 环境** | 预设环境 | 一键安装，智能托管 |
| **Git 集成** | 需付费 | 免费，原生内置 |
| **离线使用** | 不支持 | 完整支持 |
| **编译速度** | 云端排队 | 本地极速编译 |
| **开源** | 否 | MIT 协议开源 |
| **价格** | $21-42/月 | 免费 |

## 快速开始

**1. 下载安装**

前往 [writer.lmms-lab.com/download](https://writer.lmms-lab.com/download) 下载，macOS 用户也可通过 Homebrew 安装。

**2. 打开项目**

启动应用，点击 **打开文件夹**，选择你的 LaTeX 项目目录。应用会自动识别主文件。

**3. AI 辅助写作**

使用内置的 OpenCode 面板，或者在终端运行你喜欢的 AI 工具：

```bash
claude "写一段摘要，总结我们的三个核心贡献"
```

**4. 编译与发布**

点击编译，预览 PDF。在侧边栏暂存更改、提交代码、推送到 GitHub——一气呵成。

## 常见问题

**我需要单独安装 LaTeX 吗？**
通常不需要。应用会自动检测并安装一个最小化的 LaTeX 发行版。编译时如果缺少宏包，也会自动为你安装。

**支持中文等非英文文档吗？**
完美支持。通过 XeLaTeX 和 LuaLaTeX 提供完整的 Unicode 支持。中文、日文、韩文、阿拉伯文等均可开箱即用。

**我的数据安全吗？**
绝对安全。所有文件都存储在你的本地设备上。AI 工具也是在本地运行或通过你自己的 API 密钥调用，我们不会上传你的任何数据。

**可以兼容 Overleaf 项目吗？**
可以。只需将你的 Overleaf Git 仓库克隆到本地，然后用 Writer 打开即可无缝衔接。

**没有网络能用吗？**
当然。编辑、编译和 Git 操作均支持完全离线使用。

## 参与开发

```bash
git clone https://github.com/EvolvingLMMs-Lab/lmms-lab-writer.git
cd lmms-lab-writer
pnpm install
pnpm tauri:dev
```

请参阅 **[开发者指南](docs/dev.md)** 了解完整的架构、技术栈、Rust 命令、调试技巧以及贡献规范。

## 许可证

MIT

---

<div align="center">

**由 [LMMs-Lab](https://lmms-lab.com) 匠心打造**

每一篇传世论文都有起点。你的杰作，从这里开始。

</div>