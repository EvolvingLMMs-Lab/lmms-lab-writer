import type { Locale } from "@/lib/i18n";

export interface HomeFeatureCopy {
  title: string;
  description: string;
}

export interface HomeComparisonCopy {
  feature: string;
  overleaf: string;
  writer: string;
}

export interface DocsItemCopy {
  title: string;
  href: string;
  description: string;
}

export interface DocsSectionCopy {
  title: string;
  items: DocsItemCopy[];
}

interface HeaderCopy {
  loading: string;
  getStarted: string;
  feedback: string;
  language: string;
}

interface HomeCopy {
  heroDescription: string;
  heroImageAlt: string;
  downloadCta: string;
  documentationCta: string;
  featuresTitle: string;
  featuresSubtitle: string;
  tapToZoom: string;
  features: HomeFeatureCopy[];
  demoTitle: string;
  demoSubtitle: string;
  comparisonTitle: string;
  comparisonColumns: {
    feature: string;
    overleaf: string;
    writer: string;
  };
  comparisons: HomeComparisonCopy[];
}

interface FooterCopy {
  builtBy: string;
  allRightsReserved: string;
  editOnGitHub: string;
}

interface DocsCopy {
  title: string;
  subtitle: string;
  sections: DocsSectionCopy[];
  backToDocs: string;
  notFound: string;
}

interface DownloadCopy {
  pageTitle: string;
  versionLabel: string;
  installNoticeBadge: string;
  installNoticeTitle: string;
  installNoticeIntro: string;
  installNoticeSudoTitle: string;
  installNoticeSudoBody: string;
  installNoticeOpenSourceTitle: string;
  installNoticeOpenSourceBody: string;
  installNoticeIndependenceTitle: string;
  installNoticeIndependenceBody: string;
  installOrderLabel: string;
  installOrderPrimary: string;
  installOrderSecondary: string;
  installOrderTertiary: string;
  readyBannerTitle: string;
  readyBannerNote: string;
  recommendedForSystem: string;
  genericDownload: string;
  platformDetected: string;
  otherPlatforms: string;
  installViaHomebrew: string;
  recommendedTag: string;
  homebrewNote: string;
  npmPackage: string;
  latestTarball: string;
  installation: string;
  manualInstallation: string;
  windowsInstallIntro: string;
  windowsStep1: string;
  windowsStep2: string;
  windowsStep3: string;
  windowsWarning: string;
  notNotarized: string;
  installFromDmg: string;
  dmgStep1: string;
  dmgStep2: string;
  installFromPkg: string;
  pkgUntrustedNote: string;
  alternativeMethod: string;
  altStep1Prefix: string;
  altStep1Action: string;
  altStep1Open: string;
  altStep2: string;
  altStep3: string;
  requirements: string;
  latexDistribution: string;
  gitOptional: string;
  buildFromSource: string;
  inksGateTitle: string;
  inksGateDescription: string;
  yourInks: string;
  betaUsersTitle: string;
  betaUsersDescription: string;
  goToProfile: string;
  signInToGetStarted: string;
  starEnoughInks: string;
}

interface WebMessages {
  header: HeaderCopy;
  home: HomeCopy;
  footer: FooterCopy;
  docs: DocsCopy;
  download: DownloadCopy;
}

const MESSAGES: Record<Locale, WebMessages> = {
  en: {
    header: {
      loading: "Loading",
      getStarted: "Get Started",
      feedback: "Feedback",
      language: "Language",
    },
    home: {
      heroDescription:
        "The AI-native LaTeX editor. One-click setup, every language, Git built-in, fully open source.",
      heroImageAlt: "LMMs-Lab Writer - AI-native LaTeX editor",
      downloadCta: "Download",
      documentationCta: "Documentation",
      featuresTitle: "Everything you need. Nothing you don't.",
      featuresSubtitle:
        "Built for researchers who'd rather focus on ideas than LaTeX boilerplate.",
      tapToZoom: "Tap to zoom",
      features: [
        {
          title: "OpenCode AI Integration",
          description:
            "Built-in AI panel that reads your entire project. Chat, attach files, switch models. Also works with Claude Code, Cursor, and Codex.",
        },
        {
          title: "One-Click LaTeX Setup",
          description:
            "Auto-detects and installs a minimal LaTeX distribution. Missing packages install automatically during compilation. Zero configuration.",
        },
        {
          title: "Built for Every Language",
          description:
            "Full Unicode support via XeLaTeX and LuaLaTeX. CJK, Arabic, Cyrillic - all work out of the box with system fonts.",
        },
        {
          title: "Git-Native Collaboration",
          description:
            "Stage, commit, diff, push, pull - all from the sidebar. AI-generated commit messages. One-click GitHub publishing.",
        },
        {
          title: "Fully Open Source",
          description:
            "MIT licensed. Your files never leave your machine. No telemetry, no vendor lock-in. Fork it, modify it - it's yours.",
        },
        {
          title: "Cross-Platform",
          description:
            "Runs natively on macOS and Windows. Built with Tauri for native performance - not an Electron wrapper.",
        },
      ],
      demoTitle: "See it in action.",
      demoSubtitle:
        "Every legendary paper started somewhere. Yours starts here.",
      comparisonTitle: "There's a reason you're still frustrated.",
      comparisonColumns: {
        feature: "Feature",
        overleaf: "Overleaf",
        writer: "LMMs-Lab Writer",
      },
      comparisons: [
        {
          feature: "File storage",
          overleaf: "Cloud only",
          writer: "Local (your machine)",
        },
        {
          feature: "AI editing",
          overleaf: "Basic grammar",
          writer: "OpenCode + any AI agent",
        },
        {
          feature: "Non-English",
          overleaf: "Limited CJK support",
          writer: "Full Unicode, XeLaTeX, system fonts",
        },
        {
          feature: "LaTeX setup",
          overleaf: "Pre-configured",
          writer: "One-click install, agent-managed",
        },
        {
          feature: "Git integration",
          overleaf: "Paid plans only",
          writer: "Free, built into sidebar",
        },
        {
          feature: "Offline work",
          overleaf: "Not available",
          writer: "Full support",
        },
        {
          feature: "Compilation",
          overleaf: "Cloud queue",
          writer: "Local, instant",
        },
        {
          feature: "Open source",
          overleaf: "No",
          writer: "MIT license",
        },
        { feature: "Price", overleaf: "$21-42/month", writer: "Free" },
      ],
    },
    footer: {
      builtBy: "Built by",
      allRightsReserved: "All rights reserved.",
      editOnGitHub: "Edit on GitHub",
    },
    docs: {
      title: "Documentation",
      subtitle: "Everything you need to get started with LMMs-Lab Writer.",
      sections: [
        {
          title: "Getting Started",
          items: [
            {
              title: "Installation",
              href: "/docs/installation",
              description:
                "How to install LMMs-Lab Writer on macOS and Windows.",
            },
            {
              title: "Quick Start",
              href: "/docs/quick-start",
              description:
                "Get up and running with LMMs-Lab Writer in 5 minutes.",
            },
          ],
        },
        {
          title: "AI Integration",
          items: [
            {
              title: "OpenCode",
              href: "/docs/opencode",
              description:
                "Using the built-in OpenCode AI panel for AI-assisted LaTeX writing.",
            },
            {
              title: "AI Agents",
              href: "/docs/ai-agents",
              description:
                "Using Claude Code, Cursor, Codex CLI, and other AI tools.",
            },
          ],
        },
        {
          title: "Features",
          items: [
            {
              title: "LaTeX Compilation",
              href: "/docs/compilation",
              description:
                "Compiling documents with pdfLaTeX, XeLaTeX, LuaLaTeX, and Latexmk.",
            },
            {
              title: "Terminal",
              href: "/docs/terminal",
              description:
                "Using the built-in terminal for shell access and CLI tools.",
            },
            {
              title: "Git Integration",
              href: "/docs/git",
              description:
                "Version control, diffing, and GitHub publishing built into the editor.",
            },
          ],
        },
      ],
      backToDocs: "Back to docs",
      notFound: "Not Found",
    },
    download: {
      pageTitle: "Download",
      versionLabel: "Version",
      installNoticeBadge: "Install & Distribution Notes",
      installNoticeTitle:
        "Homebrew is recommended. DMG/PKG are fallback options.",
      installNoticeIntro:
        "Some macOS install paths require administrator permission. We request sudo only when needed for system-level install steps.",
      installNoticeSudoTitle: "Why sudo appears",
      installNoticeSudoBody:
        "sudo is used to place the app in protected system locations (for example /Applications) with correct ownership and permissions.",
      installNoticeOpenSourceTitle: "Open source, fully auditable",
      installNoticeOpenSourceBody:
        "All app and installer logic is open source, so anyone can inspect exactly what runs before granting privileges.",
      installNoticeIndependenceTitle: "Independent distribution",
      installNoticeIndependenceBody:
        "We intentionally ship outside Apple-controlled distribution channels to keep installation policy transparent and under user control.",
      installOrderLabel: "Recommended install order",
      installOrderPrimary: "1) Homebrew (best)",
      installOrderSecondary: "2) DMG",
      installOrderTertiary: "3) PKG / manual",
      readyBannerTitle: "You have {inks} inks - ready to download",
      readyBannerNote:
        "Beta period: No inks deducted when you download or use the app",
      recommendedForSystem: "Recommended for your system",
      genericDownload: "Download",
      platformDetected: "{platform} detected",
      otherPlatforms: "Other platforms",
      installViaHomebrew: "Install via Homebrew",
      recommendedTag: "Recommended",
      homebrewNote:
        "No security warnings. Auto-updates with brew upgrade.",
      npmPackage: "NPM package",
      latestTarball:
        "Latest tarball of @lmms-lab/writer-shared:",
      installation: "Installation",
      manualInstallation: "Manual Installation",
      windowsInstallIntro: "To install:",
      windowsStep1: "Download the .msi file",
      windowsStep2: "Double-click to run the installer",
      windowsStep3: "Follow the installation wizard",
      windowsWarning:
        "Windows may show a SmartScreen warning. Click \"More info\" then \"Run anyway\" to proceed.",
      notNotarized:
        "This build is not notarized yet. If macOS blocks the installer, use the terminal commands below.",
      installFromDmg: "Install from DMG (recommended):",
      dmgStep1: "Download the .dmg file",
      dmgStep2: "Run in Terminal:",
      installFromPkg: "Install from PKG (CLI):",
      pkgUntrustedNote:
        "-allowUntrusted is required because PKG is not Developer ID signed yet.",
      alternativeMethod: "Alternative: Right-click method",
      altStep1Prefix: "Right-click",
      altStep1Action: "the downloaded file and select",
      altStep1Open: "Open",
      altStep2: "Click Open in the dialog",
      altStep3: "Finish installation (or drag app to Applications for DMG)",
      requirements: "Requirements",
      latexDistribution: "LaTeX distribution",
      gitOptional: "Git (optional, for version control)",
      buildFromSource: "Build from source",
      inksGateTitle: "{requiredInks} inks required to download",
      inksGateDescription:
        "Star top {maxRepos} repos to earn inks. 1 repo = {inksPerStar} inks.",
      yourInks: "Your inks",
      betaUsersTitle: "Beta users: Permanent inks",
      betaUsersDescription:
        "Inks earned during beta never expire. After public launch, the app will be free to download, but premium AI features will consume inks daily. Lock in your inks now.",
      goToProfile: "Go to Profile to Earn Inks",
      signInToGetStarted: "Sign in to Get Started",
      starEnoughInks:
        "Star {repoCount} repos to earn enough inks",
    },
  },
  zh: {
    header: {
      loading: "加载中",
      getStarted: "开始使用",
      feedback: "反馈",
      language: "语言",
    },
    home: {
      heroDescription:
        "AI 原生 LaTeX 编辑器。一键配置，支持多语言，内置 Git，完全开源。",
      heroImageAlt: "LMMs-Lab Writer - AI 原生 LaTeX 编辑器",
      downloadCta: "下载",
      documentationCta: "文档",
      featuresTitle: "你需要的一切，仅此而已。",
      featuresSubtitle:
        "为专注于研究想法、而非 LaTeX 样板配置的研究者而生。",
      tapToZoom: "点击查看大图",
      features: [
        {
          title: "OpenCode AI 集成",
          description:
            "内置 AI 面板可读取整个项目上下文。支持对话、附加文件、切换模型，也兼容 Claude Code、Cursor 与 Codex。",
        },
        {
          title: "一键 LaTeX 配置",
          description:
            "自动检测并安装最小化 LaTeX 发行版。编译缺失包会自动安装，零手动配置。",
        },
        {
          title: "面向所有语言",
          description:
            "基于 XeLaTeX 与 LuaLaTeX 的完整 Unicode 支持。中日韩、阿拉伯语、西里尔语等开箱即用。",
        },
        {
          title: "Git 原生协作",
          description:
            "在侧栏即可完成暂存、提交、差异查看、推送与拉取。支持 AI 生成提交信息，一键发布到 GitHub。",
        },
        {
          title: "完全开源",
          description:
            "MIT 许可。文件始终保留在本机，无遥测、无厂商锁定。你可以自由 Fork 与修改。",
        },
        {
          title: "跨平台",
          description:
            "原生支持 macOS 与 Windows。基于 Tauri，提供原生性能，而非 Electron 壳层。",
        },
      ],
      demoTitle: "实际演示",
      demoSubtitle:
        "每一篇经典论文都始于某处，你的也从这里开始。",
      comparisonTitle: "你仍然感到挫败，是有原因的。",
      comparisonColumns: {
        feature: "功能",
        overleaf: "Overleaf",
        writer: "LMMs-Lab Writer",
      },
      comparisons: [
        {
          feature: "文件存储",
          overleaf: "仅云端",
          writer: "本地（你的电脑）",
        },
        {
          feature: "AI 编辑",
          overleaf: "基础语法",
          writer: "OpenCode + 任意 AI Agent",
        },
        {
          feature: "非英文支持",
          overleaf: "CJK 支持有限",
          writer: "完整 Unicode、XeLaTeX、系统字体",
        },
        {
          feature: "LaTeX 配置",
          overleaf: "预配置",
          writer: "一键安装，Agent 可管理",
        },
        {
          feature: "Git 集成",
          overleaf: "仅付费计划",
          writer: "免费，侧栏内置",
        },
        {
          feature: "离线工作",
          overleaf: "不支持",
          writer: "完整支持",
        },
        {
          feature: "编译方式",
          overleaf: "云端队列",
          writer: "本地即时",
        },
        {
          feature: "开源",
          overleaf: "否",
          writer: "MIT 许可",
        },
        { feature: "价格", overleaf: "$21-42/月", writer: "免费" },
      ],
    },
    footer: {
      builtBy: "由",
      allRightsReserved: "保留所有权利。",
      editOnGitHub: "在 GitHub 上编辑",
    },
    docs: {
      title: "文档",
      subtitle: "开始使用 LMMs-Lab Writer 所需的一切。",
      sections: [
        {
          title: "快速开始",
          items: [
            {
              title: "安装",
              href: "/docs/installation",
              description: "在 macOS 和 Windows 上安装 LMMs-Lab Writer。",
            },
            {
              title: "快速上手",
              href: "/docs/quick-start",
              description: "5 分钟内完成 LMMs-Lab Writer 的基础配置。",
            },
          ],
        },
        {
          title: "AI 集成",
          items: [
            {
              title: "OpenCode",
              href: "/docs/opencode",
              description: "使用内置 OpenCode AI 面板进行 LaTeX 辅助写作。",
            },
            {
              title: "AI Agents",
              href: "/docs/ai-agents",
              description: "使用 Claude Code、Cursor、Codex CLI 等 AI 工具。",
            },
          ],
        },
        {
          title: "功能",
          items: [
            {
              title: "LaTeX 编译",
              href: "/docs/compilation",
              description:
                "使用 pdfLaTeX、XeLaTeX、LuaLaTeX 与 Latexmk 编译文档。",
            },
            {
              title: "终端",
              href: "/docs/terminal",
              description: "使用内置终端执行 Shell 命令与 CLI 工具。",
            },
            {
              title: "Git 集成",
              href: "/docs/git",
              description: "在编辑器中直接完成版本控制、Diff 与 GitHub 发布。",
            },
          ],
        },
      ],
      backToDocs: "返回文档",
      notFound: "未找到",
    },
    download: {
      pageTitle: "下载",
      versionLabel: "版本",
      installNoticeBadge: "安装与分发说明",
      installNoticeTitle: "最推荐使用 Homebrew，DMG/PKG 作为备选方案。",
      installNoticeIntro:
        "macOS 部分安装路径需要管理员权限。只有在系统级安装步骤中才会请求 sudo。",
      installNoticeSudoTitle: "为什么会出现 sudo",
      installNoticeSudoBody:
        "sudo 用于把应用写入受保护目录（如 /Applications），并设置正确的文件归属与权限。",
      installNoticeOpenSourceTitle: "开源且可审查",
      installNoticeOpenSourceBody:
        "应用与安装脚本全部开源，授予权限前可以完整审查执行逻辑。",
      installNoticeIndependenceTitle: "独立分发策略",
      installNoticeIndependenceBody:
        "我们有意不依赖 Apple 控制的分发通道，以保持安装策略透明，并把控制权交给用户。",
      installOrderLabel: "推荐安装顺序",
      installOrderPrimary: "1) Homebrew（首选）",
      installOrderSecondary: "2) DMG",
      installOrderTertiary: "3) PKG / 手动",
      readyBannerTitle: "你已有 {inks} inks - 可立即下载",
      readyBannerNote: "Beta 期间：下载和使用应用都不会扣除 inks",
      recommendedForSystem: "为你的系统推荐",
      genericDownload: "下载",
      platformDetected: "已检测到 {platform}",
      otherPlatforms: "其他平台",
      installViaHomebrew: "通过 Homebrew 安装",
      recommendedTag: "推荐",
      homebrewNote: "无安全警告，可通过 brew upgrade 自动更新。",
      npmPackage: "NPM 包",
      latestTarball: "@lmms-lab/writer-shared 的最新 tarball：",
      installation: "安装",
      manualInstallation: "手动安装",
      windowsInstallIntro: "安装步骤：",
      windowsStep1: "下载 .msi 文件",
      windowsStep2: "双击运行安装程序",
      windowsStep3: "按向导完成安装",
      windowsWarning:
        "Windows 可能显示 SmartScreen 警告。点击“更多信息”，再点击“仍要运行”。",
      notNotarized:
        "当前构建尚未完成 notarization。若 macOS 阻止安装，请使用下方终端命令。",
      installFromDmg: "通过 DMG 安装（推荐）：",
      dmgStep1: "下载 .dmg 文件",
      dmgStep2: "在终端执行：",
      installFromPkg: "通过 PKG 安装（CLI）：",
      pkgUntrustedNote:
        "由于 PKG 尚未完成 Developer ID 签名，需要使用 -allowUntrusted。",
      alternativeMethod: "备选方式：右键打开",
      altStep1Prefix: "右键点击",
      altStep1Action: "已下载文件并选择",
      altStep1Open: "打开",
      altStep2: "在弹窗中点击“打开”",
      altStep3: "完成安装（DMG 可将应用拖入 Applications）",
      requirements: "依赖要求",
      latexDistribution: "LaTeX 发行版",
      gitOptional: "Git（可选，用于版本控制）",
      buildFromSource: "从源码构建",
      inksGateTitle: "需要 {requiredInks} inks 才可下载",
      inksGateDescription:
        "给前 {maxRepos} 个仓库点 Star 可获取 inks。1 个仓库 = {inksPerStar} inks。",
      yourInks: "你的 inks",
      betaUsersTitle: "Beta 用户：inks 永久有效",
      betaUsersDescription:
        "Beta 期间获得的 inks 永不过期。正式公测后，应用可免费下载，但高级 AI 功能会按天消耗 inks。现在就把 inks 锁定下来。",
      goToProfile: "前往个人页获取 inks",
      signInToGetStarted: "登录并开始",
      starEnoughInks: "给 {repoCount} 个仓库点 Star 即可获得足够 inks",
    },
  },
  ja: {
    header: {
      loading: "読み込み中",
      getStarted: "はじめる",
      feedback: "フィードバック",
      language: "言語",
    },
    home: {
      heroDescription:
        "AI ネイティブな LaTeX エディタ。ワンクリック設定、多言語対応、Git 内蔵、完全オープンソース。",
      heroImageAlt: "LMMs-Lab Writer - AI ネイティブ LaTeX エディタ",
      downloadCta: "ダウンロード",
      documentationCta: "ドキュメント",
      featuresTitle: "必要なものだけ、すべてここに。",
      featuresSubtitle:
        "LaTeX の定型作業ではなく、研究のアイデアに集中したい人のために設計しました。",
      tapToZoom: "タップして拡大",
      features: [
        {
          title: "OpenCode AI 連携",
          description:
            "プロジェクト全体を読み取る AI パネルを内蔵。チャット、ファイル添付、モデル切替に対応し、Claude Code・Cursor・Codex も利用できます。",
        },
        {
          title: "LaTeX ワンクリック設定",
          description:
            "最小構成の LaTeX ディストリビューションを自動検出してインストール。コンパイル時の不足パッケージも自動導入され、手動設定は不要です。",
        },
        {
          title: "多言語対応",
          description:
            "XeLaTeX / LuaLaTeX による Unicode 完全対応。CJK・アラビア語・キリル文字などをシステムフォントでそのまま扱えます。",
        },
        {
          title: "Git ネイティブ共同作業",
          description:
            "ステージ、コミット、差分確認、push/pull をサイドバーから実行。AI によるコミットメッセージ生成と GitHub へのワンクリック公開にも対応。",
        },
        {
          title: "完全オープンソース",
          description:
            "MIT ライセンス。ファイルは常にローカルに保持され、テレメトリやベンダーロックインはありません。自由に Fork・改変できます。",
        },
        {
          title: "クロスプラットフォーム",
          description:
            "macOS と Windows でネイティブ動作。Electron ラッパーではなく、Tauri による高性能な実装です。",
        },
      ],
      demoTitle: "動作デモ",
      demoSubtitle: "名作論文も最初の一行から始まります。次はあなたの番です。",
      comparisonTitle: "まだ不便さを感じるのには理由があります。",
      comparisonColumns: {
        feature: "項目",
        overleaf: "Overleaf",
        writer: "LMMs-Lab Writer",
      },
      comparisons: [
        {
          feature: "ファイル保存",
          overleaf: "クラウドのみ",
          writer: "ローカル（あなたの端末）",
        },
        {
          feature: "AI 編集",
          overleaf: "基本的な文法補助",
          writer: "OpenCode + 任意の AI Agent",
        },
        {
          feature: "英語以外",
          overleaf: "CJK 対応に制限あり",
          writer: "Unicode 完全対応、XeLaTeX、システムフォント",
        },
        {
          feature: "LaTeX セットアップ",
          overleaf: "事前構成済み",
          writer: "ワンクリック導入、Agent 管理対応",
        },
        {
          feature: "Git 連携",
          overleaf: "有料プランのみ",
          writer: "無料、サイドバー内蔵",
        },
        {
          feature: "オフライン作業",
          overleaf: "非対応",
          writer: "完全対応",
        },
        {
          feature: "コンパイル",
          overleaf: "クラウド待ち行列",
          writer: "ローカル即時",
        },
        {
          feature: "オープンソース",
          overleaf: "いいえ",
          writer: "MIT ライセンス",
        },
        { feature: "価格", overleaf: "$21-42/月", writer: "無料" },
      ],
    },
    footer: {
      builtBy: "開発",
      allRightsReserved: "All rights reserved.",
      editOnGitHub: "GitHub で編集",
    },
    docs: {
      title: "ドキュメント",
      subtitle: "LMMs-Lab Writer の利用開始に必要な情報をまとめています。",
      sections: [
        {
          title: "はじめに",
          items: [
            {
              title: "インストール",
              href: "/docs/installation",
              description:
                "macOS と Windows への LMMs-Lab Writer の導入手順。",
            },
            {
              title: "クイックスタート",
              href: "/docs/quick-start",
              description: "5 分で LMMs-Lab Writer を使い始める手順。",
            },
          ],
        },
        {
          title: "AI 連携",
          items: [
            {
              title: "OpenCode",
              href: "/docs/opencode",
              description:
                "内蔵 OpenCode AI パネルによる LaTeX 執筆支援の使い方。",
            },
            {
              title: "AI Agents",
              href: "/docs/ai-agents",
              description:
                "Claude Code、Cursor、Codex CLI などの AI ツール連携。",
            },
          ],
        },
        {
          title: "機能",
          items: [
            {
              title: "LaTeX コンパイル",
              href: "/docs/compilation",
              description:
                "pdfLaTeX、XeLaTeX、LuaLaTeX、Latexmk によるコンパイル方法。",
            },
            {
              title: "ターミナル",
              href: "/docs/terminal",
              description:
                "内蔵ターミナルでのシェル操作と CLI ツール利用。",
            },
            {
              title: "Git 連携",
              href: "/docs/git",
              description:
                "エディタ内でのバージョン管理、差分確認、GitHub 公開。",
            },
          ],
        },
      ],
      backToDocs: "ドキュメントに戻る",
      notFound: "見つかりません",
    },
    download: {
      pageTitle: "ダウンロード",
      versionLabel: "バージョン",
      installNoticeBadge: "インストールと配布に関する案内",
      installNoticeTitle:
        "Homebrew を最優先で推奨します。DMG/PKG は代替手段です。",
      installNoticeIntro:
        "macOS の一部インストール先では管理者権限が必要です。sudo はシステムレベルの処理時にのみ要求します。",
      installNoticeSudoTitle: "sudo が必要な理由",
      installNoticeSudoBody:
        "sudo は /Applications などの保護された場所へ配置し、所有者と権限を正しく設定するために使われます。",
      installNoticeOpenSourceTitle: "オープンソースで監査可能",
      installNoticeOpenSourceBody:
        "アプリ本体とインストーラのロジックはすべて公開されており、権限付与前に実行内容を確認できます。",
      installNoticeIndependenceTitle: "独立した配布方針",
      installNoticeIndependenceBody:
        "Apple 主導の配布チャネルに依存せず、インストール方針の透明性とユーザー主導の運用を重視しています。",
      installOrderLabel: "推奨インストール順",
      installOrderPrimary: "1) Homebrew（推奨）",
      installOrderSecondary: "2) DMG",
      installOrderTertiary: "3) PKG / 手動",
      readyBannerTitle: "{inks} inks を保有しています - ダウンロード可能です",
      readyBannerNote:
        "ベータ期間中: ダウンロードや利用で inks は消費されません",
      recommendedForSystem: "この環境への推奨",
      genericDownload: "ダウンロード",
      platformDetected: "{platform} を検出",
      otherPlatforms: "その他のプラットフォーム",
      installViaHomebrew: "Homebrew でインストール",
      recommendedTag: "推奨",
      homebrewNote:
        "セキュリティ警告なし。brew upgrade で自動更新できます。",
      npmPackage: "NPM パッケージ",
      latestTarball:
        "@lmms-lab/writer-shared の最新 tarball:",
      installation: "インストール",
      manualInstallation: "手動インストール",
      windowsInstallIntro: "インストール手順:",
      windowsStep1: ".msi ファイルをダウンロード",
      windowsStep2: "ダブルクリックしてインストーラーを実行",
      windowsStep3: "ウィザードに沿ってインストール",
      windowsWarning:
        "Windows で SmartScreen 警告が表示される場合があります。\"More info\" を押し、\"Run anyway\" を選択してください。",
      notNotarized:
        "このビルドは未 notarized です。macOS でブロックされる場合は、以下のターミナル手順を使用してください。",
      installFromDmg: "DMG からインストール（推奨）:",
      dmgStep1: ".dmg ファイルをダウンロード",
      dmgStep2: "ターミナルで実行:",
      installFromPkg: "PKG からインストール（CLI）:",
      pkgUntrustedNote:
        "PKG はまだ Developer ID 署名されていないため、-allowUntrusted が必要です。",
      alternativeMethod: "代替方法: 右クリックで開く",
      altStep1Prefix: "ダウンロードしたファイルを",
      altStep1Action: "右クリックして",
      altStep1Open: "開く",
      altStep2: "ダイアログで「開く」をクリック",
      altStep3: "インストール完了（DMG は Applications へドラッグ）",
      requirements: "要件",
      latexDistribution: "LaTeX ディストリビューション",
      gitOptional: "Git（任意、バージョン管理用）",
      buildFromSource: "ソースからビルド",
      inksGateTitle: "ダウンロードには {requiredInks} inks が必要です",
      inksGateDescription:
        "上位 {maxRepos} リポジトリに Star すると inks を獲得できます。1 リポジトリ = {inksPerStar} inks。",
      yourInks: "現在の inks",
      betaUsersTitle: "ベータユーザー: inks は永続",
      betaUsersDescription:
        "ベータ期間に獲得した inks は失効しません。正式公開後、アプリ自体は無料ですが、高度な AI 機能は daily で inks を消費します。今のうちに確保してください。",
      goToProfile: "プロフィールで inks を獲得",
      signInToGetStarted: "サインインして開始",
      starEnoughInks:
        "{repoCount} リポジトリに Star すると必要な inks を満たせます",
    },
  },
};

export function getMessages(locale: Locale): WebMessages {
  return MESSAGES[locale];
}
