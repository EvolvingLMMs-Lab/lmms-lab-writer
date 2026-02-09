<div align="center">

<a href="https://writer.lmms-lab.com">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="imgs/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="imgs/logo-light.svg">
  <img alt="LMMs-Lab Writer" src="imgs/logo-light.svg" width="512">
</picture>
</a>

**言者所以在意、得意而忘言。**

[![Website](https://img.shields.io/badge/-公式サイト-8957e5?style=flat-square&logo=safari&logoColor=white)](https://writer.lmms-lab.com)
[![Docs](https://img.shields.io/badge/-ドキュメント-0969da?style=flat-square&logo=gitbook&logoColor=white)](https://writer.lmms-lab.com/docs)
[![Download](https://img.shields.io/badge/-ダウンロード-2ea44f?style=flat-square&logo=github&logoColor=white)](https://writer.lmms-lab.com/download)

[![macOS](https://img.shields.io/badge/-macOS-111111?style=flat-square&logo=apple&logoColor=white)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)
[![Windows](https://img.shields.io/badge/-Windows-0078D4?style=flat-square&logo=windows11&logoColor=white)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-f0c000?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/EvolvingLMMs-Lab/lmms-lab-writer?style=flat-square&color=e8a317)](https://github.com/EvolvingLMMs-Lab/lmms-lab-writer)

[English](README.md) | [中文](README_zh.md) | 日本語

</div>

---

![](imgs/demo.webp)

## なぜ LMMs-Lab Writer なのか？

研究者である皆様の時間は、LaTeX の定型文作成やパッケージの競合解決、あるいは Overleaf と ChatGPT の間を行き来するコピペ作業ではなく、**画期的な発見**のために使われるべきです。

LMMs-Lab Writer は、**ローカルファーストかつ AI ネイティブ**な LaTeX エディタです。ファイルはあなたのマシン上に安全に保存され、AI エージェントが編集を直接サポートします。コンパイル、プレビュー、そして公開まで——すべてのフローがひとつのアプリで完結します。

## 面倒な環境構築は不要

TeX Live の長いインストール待ち時間はもう過去のものです。LMMs-Lab Writer は、**最小限の LaTeX 環境を自動検出し、セットアップ**します。コンパイル中にパッケージ不足が検知されれば、自動的にインストールされます。手動設定は一切不要——アプリを開けば、すぐに執筆を始められます。

**TinyTeX**、**MiKTeX**、**MacTeX**、**TeX Live** に対応しており、インストール管理もアプリにお任せください。

<div align="center">
<img src="imgs/latex.png" alt="ワンクリック LaTeX セットアップ、パッケージ自動インストール" width="720">
</div>

## あらゆる言語での執筆をサポート

**日本語、英語、中国語、韓国語、アラビア語**など、あらゆる言語での執筆をネイティブサポートしています。XeLaTeX と LuaLaTeX を標準採用し、Unicode とシステムフォントを完全にサポート。`ctex` や `xeCJK` などの多言語パッケージも**設定不要ですぐに使えます**。

<div align="center">
<img src="imgs/compile-cn.png" alt="XeLaTeX による完全な CJK・Unicode サポート">
</div>

## OpenCode：AI と共にあるワークフロー

内蔵の **OpenCode** パネルにより、エディタ内で AI の力を直接活用できます：

```
あなた：「LoRA と QLoRA を比較する関連研究のセクションを追加して」
AI エージェント：*main.tex にリアルタイムで執筆*
あなた：*コンパイルボタンをクリック* 完了。
```

- AI との対話、ファイル添付、コンテキスト管理
- プロジェクト全体を AI が読み込み、文脈を完全に理解
- 変更内容はエディタに即座に反映
- **あらゆるモデルに対応**——Claude、GPT、Gemini、DeepSeek、ローカル LLM など

また、**Claude Code**、**Cursor**、**Codex CLI**、**Aider** など、外部のファイル編集ツールとも完全に連携。エディタはプロジェクトディレクトリを監視し、外部からの変更をリアルタイムに反映します。

<div align="center">
<img src="imgs/interaction.png" alt="OpenCode AI 統合——AI と対話して LaTeX を執筆" width="512">
</div>

## 共同作業のための Git 統合

Git は単なる「おまけ機能」ではありません——**サイドバーに完全統合**されています：

- **ステージ、コミット、差分確認、プッシュ、プル**——すべて GUI で完結
- **AI によるコミットメッセージ生成**——変更内容に基づいて自動作成
- **サイドバイサイド差分ビューア**——コミット前に AI の編集内容をチェック
- **ワンクリック GitHub 公開**——ターミナル不要でリポジトリ作成からプッシュまで
- **GitHub CLI 統合**——認証もシームレスに

Overleaf の Git 同期機能に月額 $21 を支払う必要はもうありません。ここではバージョン管理は無料かつ標準機能です。

<div align="center">
<img src="imgs/git-support.png" alt="Git 統合——サイドバーからステージ、コミット、差分表示、プッシュ" width="720">
</div>

## 完全オープンソース

MIT ライセンスで提供。すべてのコードは GitHub 上で公開されています。ベンダーロックイン、テレメトリ、隠れたコストは一切ありません。

- ファイルは**あなたのデバイスから流出しません**
- AI ツールは**あなた自身の API キー**を使用
- すべての機能が**オフラインで動作**（編集、コンパイル、Git 操作）
- フォーク、改変、セルフホスト——すべて自由です

## クロスプラットフォーム対応

**macOS**（Apple Silicon & Intel）および **Windows**（64 ビット）でネイティブ動作。[Tauri](https://tauri.app/) ベースで構築されており、Electron 製アプリのような重さはなく、軽快な動作を実現しています。

<div align="center">
<table>
<tr>
<td align="center"><strong>ライトモード</strong></td>
<td align="center"><strong>ダークモード</strong></td>
</tr>
<tr>
<td><img src="imgs/light.png" alt="ライトモード"></td>
<td><img src="imgs/dark.png" alt="ダークモード"></td>
</tr>
</table>
</div>

```bash
# macOS (Homebrew)
brew tap EvolvingLMMs-Lab/tap && brew install --cask lmms-lab-writer
```

または公式サイトから [macOS / Windows 版をダウンロード](https://writer.lmms-lab.com/download)してください。

---

## Overleaf vs. LMMs-Lab Writer

| | Overleaf | LMMs-Lab Writer |
|---|---|---|
| **ファイル保存** | クラウドのみ | ローカル（あなたのマシン） |
| **AI 編集** | 基本的な文法チェックのみ | OpenCode + 任意の AI エージェント |
| **多言語対応** | 限定的な CJK サポート | 完全な Unicode、XeLaTeX、システムフォント |
| **LaTeX 環境** | 事前設定済み | ワンクリックインストール、自動管理 |
| **Git 連携** | 有料プランのみ | 無料、標準搭載 |
| **オフライン** | 不可 | 完全対応 |
| **コンパイル** | クラウド上のキュー待ち | ローカルで即時実行 |
| **オープンソース** | いいえ | MIT ライセンス |
| **価格** | $21-42/月 | 無料 |

## クイックスタート

**1. ダウンロード＆インストール**

[writer.lmms-lab.com/download](https://writer.lmms-lab.com/download) からダウンロードするか、macOS の場合は Homebrew でインストールします。

**2. プロジェクトを開く**

アプリを起動し、「**フォルダを開く**」をクリックして LaTeX プロジェクトを選択します。メインファイルは自動的に検出されます。

**3. AI と執筆**

内蔵の OpenCode パネルを使うか、ターミナルでお好みの AI ツールを実行します：

```bash
claude "この論文の3つの主要な貢献を要約したアブストラクトを書いて"
```

**4. コンパイル＆公開**

コンパイルボタンをクリックして PDF を確認。サイドバーから変更をステージ、コミット、GitHub へプッシュ——これらすべてがスムーズに行えます。

## よくある質問

**LaTeX を別途インストールする必要がありますか？**
基本的には不要です。アプリが最小限の LaTeX 環境を自動検出し、セットアップします。不足しているパッケージがあれば、コンパイル時に自動インストールされます。

**日本語などのドキュメントに対応していますか？**
はい、完全対応しています。XeLaTeX と LuaLaTeX により Unicode をフルサポートしており、日本語、中国語、韓国語、アラビア語なども設定なしですぐに執筆できます。

**データは安全ですか？**
はい。すべてのファイルはあなたのローカルマシン上にのみ保存されます。AI ツールもローカルで動作するか、あなた自身の API キーを通じて利用されるため、データが勝手に送信されることはありません。

**Overleaf のプロジェクトは使えますか？**
はい。Overleaf の Git リポジトリをローカルにクローンし、それを Writer で開くだけで、そのまま作業を継続できます。

**オフラインでも使えますか？**
はい。編集、コンパイル、Git 操作など、すべての機能がインターネット接続なしで利用可能です。

## 開発に参加する

```bash
git clone https://github.com/EvolvingLMMs-Lab/lmms-lab-writer.git
cd lmms-lab-writer
pnpm install
pnpm tauri:dev
```

完全なアーキテクチャ、技術スタック、Rust コマンド、デバッグ方法、コントリビューション規約については **[開発者ガイド](docs/dev.md)** をご覧ください。

## ライセンス

MIT

---

<div align="center">

**[LMMs-Lab](https://lmms-lab.com) によって開発されました**

すべての偉大な論文には始まりがあります。あなたの研究は、ここから始まります。

</div>