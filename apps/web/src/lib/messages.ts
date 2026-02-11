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
  videoTitle: string;
  videoSubtitle: string;
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

interface CommonCopy {
  loading: string;
}

interface AuthCopy {
  backToHome: string;
  signIn: string;
  signInDescription: string;
  createAccount: string;
  createAccountDescription: string;
  checkingLoginStatus: string;
  connecting: string;
  continueWithGitHub: string;
  connectGitHub: string;
  githubAccountRequired: string;
  alreadyHaveAccount: string;
  signInLink: string;
}

interface UserDropdownCopy {
  inks: string;
  download: string;
  earnMore: string;
  signingOut: string;
  signOut: string;
}

interface ProfileCopy {
  title: string;
  joined: string;
  justNow: string;
  hoursAgo: string;
  yesterday: string;
  daysAgo: string;
  connectedAccounts: string;
  accountDetails: string;
  userId: string;
  email: string;
  registered: string;
  lastSignIn: string;
  inksTitle: string;
  betaInksNeverExpire: string;
  readyToDownload: string;
  moreInksToUnlock: string;
  earnInks: string;
  earnInksArrow: string;
  starTopRepos: string;
  earnInksTitle: string;
  refresh: string;
  refreshing: string;
  refreshStarStatus: string;
  connectGitHubTitle: string;
  connectGitHubDescription: string;
  recommended: string;
  starred: string;
  star: string;
  starTopReposFooter: string;
}

interface DesktopSuccessCopy {
  loginFailed: string;
  tryAgain: string;
  loginSuccessful: string;
  loggedIn: string;
  sendingCode: string;
  codeSent: string;
  copyCodePrompt: string;
  copyCode: string;
  copied: string;
  codeManualCopy: string;
  codeExpires: string;
  returnToDesktop: string;
  closeWindow: string;
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
  homebrewArchFallback: string;
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
  common: CommonCopy;
  header: HeaderCopy;
  home: HomeCopy;
  footer: FooterCopy;
  docs: DocsCopy;
  download: DownloadCopy;
  auth: AuthCopy;
  userDropdown: UserDropdownCopy;
  profile: ProfileCopy;
  desktopSuccess: DesktopSuccessCopy;
}

const MESSAGES: Record<Locale, WebMessages> = {
  en: {
    common: {
      loading: "Loading...",
    },
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
      videoTitle: "Demo Video",
      videoSubtitle: "Watch LMMs-Lab Writer in action.",
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
      homebrewArchFallback:
        "If Homebrew shows an architecture mismatch (for example Intel Mac), use the Intel (x64) DMG/PKG downloads below.",
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
    auth: {
      backToHome: "Back to home",
      signIn: "Sign in",
      signInDescription: "Sign in with GitHub to access your account.",
      createAccount: "Create an account",
      createAccountDescription:
        "Create an account with GitHub to get started.",
      checkingLoginStatus: "Checking login status...",
      connecting: "Connecting...",
      continueWithGitHub: "Continue with GitHub",
      connectGitHub: "Connect GitHub",
      githubAccountRequired:
        "GitHub account required to track starred repositories and earn inks.",
      alreadyHaveAccount: "Already have an account?",
      signInLink: "Sign in",
    },
    userDropdown: {
      inks: "inks",
      download: "Download",
      earnMore: "Earn more \u2192",
      signingOut: "Signing out...",
      signOut: "Sign out",
    },
    profile: {
      title: "Profile",
      joined: "Joined {date}",
      justNow: "Just now",
      hoursAgo: "{hours}h ago",
      yesterday: "Yesterday",
      daysAgo: "{days} days ago",
      connectedAccounts: "Connected Accounts",
      accountDetails: "Account Details",
      userId: "User ID",
      email: "Email",
      registered: "Registered",
      lastSignIn: "Last Sign In",
      inksTitle: "Inks",
      betaInksNeverExpire: "Beta - Inks never expire",
      readyToDownload: "Ready to download",
      moreInksToUnlock: "{count} more inks to unlock download",
      earnInks: "Earn inks",
      earnInksArrow: "Earn inks \u2192",
      starTopRepos:
        "Star top {maxRepos} repos to earn inks. Need {requiredInks} inks to download.",
      earnInksTitle: "Earn Inks",
      refresh: "Refresh",
      refreshing: "Refreshing...",
      refreshStarStatus: "Refresh star status",
      connectGitHubTitle: "Connect GitHub",
      connectGitHubDescription:
        "Link your GitHub account to track starred repos and earn inks.",
      recommended: "Recommended",
      starred: "Starred",
      star: "Star",
      starTopReposFooter:
        "Star top {maxRepos} repos to earn inks | 1 repo = {inksPerStar} inks",
    },
    desktopSuccess: {
      loginFailed: "Login Failed",
      tryAgain: "Try Again",
      loginSuccessful: "Login Successful!",
      loggedIn: "Logged In!",
      sendingCode: "Sending login code to desktop app...",
      codeSent:
        "Login code sent to desktop app. You can close this window.",
      copyCodePrompt:
        "Copy the login code below and paste it in the desktop app.",
      copyCode: "Copy Code",
      copied: "Copied!",
      codeManualCopy: "You can also copy the code manually if needed.",
      codeExpires:
        "This code expires when your session expires. Get a new code if login fails.",
      returnToDesktop: "Return to the desktop app to continue.",
      closeWindow:
        "You can close this window after pasting the code in the app.",
    },
  },
  zh: {
    common: {
      loading: "加载中...",
    },
    header: {
      loading: "加载中",
      getStarted: "开始使用",
      feedback: "反馈",
      language: "语言",
    },
    home: {
      heroDescription:
        "AI 原生 LaTeX 编辑器。一键环境配置，全语言支持，内置 Git，完全开源。",
      heroImageAlt: "LMMs-Lab Writer - AI 原生 LaTeX 编辑器",
      downloadCta: "下载客户端",
      documentationCta: "查看文档",
      featuresTitle: "你需要的一切，都在这里。",
      featuresSubtitle:
        "专为研究者打造，让你专注于创意，而非繁琐的 LaTeX 配置。",
      tapToZoom: "点击放大",
      features: [
        {
          title: "OpenCode AI 集成",
          description:
            "内置 AI 面板，深度理解项目上下文。支持对话、文件附件、模型切换，亦可配合 Claude Code、Cursor 及 Codex 使用。",
        },
        {
          title: "一键 LaTeX 配置",
          description:
            "自动检测并安装最小化 LaTeX 发行版。编译时自动补全缺失宏包，零手动配置。",
        },
        {
          title: "全语言支持",
          description:
            "基于 XeLaTeX 与 LuaLaTeX 的完整 Unicode 支持。CJK、阿拉伯语、西里尔语等均可开箱即用。",
        },
        {
          title: "原生 Git 协作",
          description:
            "侧栏内置暂存、提交、Diff 查看、推送与拉取功能。支持 AI 自动生成提交信息，一键发布至 GitHub。",
        },
        {
          title: "完全开源",
          description:
            "MIT 协议。数据完全本地化，无遥测、无厂商锁定。你可以自由 Fork 与修改。",
        },
        {
          title: "跨平台",
          description:
            "原生支持 macOS 与 Windows。基于 Tauri 构建，提供卓越的原生性能，绝非 Electron 套壳。",
        },
      ],
      videoTitle: "演示视频",
      videoSubtitle: "观看 LMMs-Lab Writer 实机演示。",
      demoTitle: "实机演示",
      demoSubtitle:
        "每一篇传奇论文都始于笔下，你的旅程也从这里开始。",
      comparisonTitle: "为何现有的工具仍让你感到受挫？",
      comparisonColumns: {
        feature: "功能特性",
        overleaf: "Overleaf",
        writer: "LMMs-Lab Writer",
      },
      comparisons: [
        {
          feature: "文件存储",
          overleaf: "仅限云端",
          writer: "本地存储（完全掌控）",
        },
        {
          feature: "AI 辅助",
          overleaf: "基础语法检查",
          writer: "OpenCode + 任意 AI Agent",
        },
        {
          feature: "多语言支持",
          overleaf: "CJK 支持有限",
          writer: "完整 Unicode、XeLaTeX、系统字体",
        },
        {
          feature: "LaTeX 环境",
          overleaf: "预设环境",
          writer: "一键安装，Agent 智能管理",
        },
        {
          feature: "Git 集成",
          overleaf: "需付费订阅",
          writer: "免费，侧栏深度集成",
        },
        {
          feature: "离线使用",
          overleaf: "不支持",
          writer: "完整支持",
        },
        {
          feature: "编译速度",
          overleaf: "云端排队",
          writer: "本地即时编译",
        },
        {
          feature: "开源协议",
          overleaf: "否",
          writer: "MIT 协议",
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
      subtitle: "LMMs-Lab Writer 使用指南。",
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
              description: "5 分钟内完成 LMMs-Lab Writer 基础配置。",
            },
          ],
        },
        {
          title: "AI 集成",
          items: [
            {
              title: "OpenCode",
              href: "/docs/opencode",
              description: "使用内置 OpenCode AI 面板辅助 LaTeX 写作。",
            },
            {
              title: "AI Agents",
              href: "/docs/ai-agents",
              description: "配合 Claude Code、Cursor、Codex CLI 等 AI 工具使用。",
            },
          ],
        },
        {
          title: "功能特性",
          items: [
            {
              title: "LaTeX 编译",
              href: "/docs/compilation",
              description:
                "使用 pdfLaTeX、XeLaTeX、LuaLaTeX 及 Latexmk 编译文档。",
            },
            {
              title: "终端",
              href: "/docs/terminal",
              description: "使用内置终端执行 Shell 命令及 CLI 工具。",
            },
            {
              title: "Git 集成",
              href: "/docs/git",
              description: "编辑器内置版本控制、Diff 查看及 GitHub 发布功能。",
            },
          ],
        },
      ],
      backToDocs: "返回文档",
      notFound: "页面未找到",
    },
    download: {
      pageTitle: "下载",
      versionLabel: "版本",
      installNoticeBadge: "安装与分发说明",
      installNoticeTitle: "推荐使用 Homebrew，亦可选择 DMG/PKG。",
      installNoticeIntro:
        "macOS 部分安装路径需要管理员权限。仅在执行系统级安装步骤时会请求 sudo 权限。",
      installNoticeSudoTitle: "关于 sudo 权限",
      installNoticeSudoBody:
        "sudo 用于将应用写入受保护目录（如 /Applications），并设置正确的文件所有权与权限。",
      installNoticeOpenSourceTitle: "开源透明",
      installNoticeOpenSourceBody:
        "应用及安装脚本完全开源，您可以在授权前审查所有执行逻辑。",
      installNoticeIndependenceTitle: "独立分发",
      installNoticeIndependenceBody:
        "我们选择不依赖 Apple 的封闭分发渠道，旨在保持安装策略的透明性，并将控制权交还给用户。",
      installOrderLabel: "推荐安装方式",
      installOrderPrimary: "1) Homebrew（推荐）",
      installOrderSecondary: "2) DMG",
      installOrderTertiary: "3) PKG / 手动",
      readyBannerTitle: "您已拥有 {inks} inks - 可立即下载",
      readyBannerNote: "Beta 期间：下载和使用应用均不消耗 inks",
      recommendedForSystem: "系统推荐",
      genericDownload: "下载",
      platformDetected: "已检测到 {platform}",
      otherPlatforms: "其他平台",
      installViaHomebrew: "使用 Homebrew 安装",
      recommendedTag: "推荐",
      homebrewNote: "无安全警告，支持 brew upgrade 自动更新。",
      homebrewArchFallback:
        "若 Homebrew 提示架构不匹配（如 Intel Mac），请使用下方 Intel (x64) 的 DMG/PKG 安装包。",
      npmPackage: "NPM 包",
      latestTarball: "@lmms-lab/writer-shared 最新 Tarball：",
      installation: "安装指南",
      manualInstallation: "手动安装",
      windowsInstallIntro: "安装步骤：",
      windowsStep1: "下载 .msi 文件",
      windowsStep2: "双击运行安装程序",
      windowsStep3: "按照向导完成安装",
      windowsWarning:
        "Windows 可能显示 SmartScreen 警告。点击“更多信息”，然后选择“仍要运行”即可。",
      notNotarized:
        "当前构建尚未进行公证（Notarization）。若 macOS 拦截安装，请执行下方终端命令。",
      installFromDmg: "通过 DMG 安装（推荐）：",
      dmgStep1: "下载 .dmg 文件",
      dmgStep2: "在终端执行：",
      installFromPkg: "通过 PKG 安装（CLI）：",
      pkgUntrustedNote:
        "由于 PKG 尚未进行 Developer ID 签名，需添加 -allowUntrusted 参数。",
      alternativeMethod: "备选方案：右键打开",
      altStep1Prefix: "右键点击",
      altStep1Action: "下载的文件并选择",
      altStep1Open: "打开",
      altStep2: "在弹窗中点击“打开”",
      altStep3: "完成安装（DMG 需将应用拖入 Applications）",
      requirements: "系统要求",
      latexDistribution: "LaTeX 发行版",
      gitOptional: "Git（可选，用于版本控制）",
      buildFromSource: "从源码构建",
      inksGateTitle: "需 {requiredInks} inks 下载",
      inksGateDescription:
        "为前 {maxRepos} 个仓库加星（Star）即可获取 inks。1 个 Star = {inksPerStar} inks。",
      yourInks: "当前 inks",
      betaUsersTitle: "Beta 用户福利：Inks 永久有效",
      betaUsersDescription:
        "Beta 期间获取的 inks 永不过期。正式发布后，应用可免费下载，但高级 AI 功能将按日消耗 inks。建议立即锁定您的 inks。",
      goToProfile: "前往个人主页获取 inks",
      signInToGetStarted: "登录以开始",
      starEnoughInks: "Star {repoCount} 个仓库即可获取足量 inks",
    },
    auth: {
      backToHome: "返回首页",
      signIn: "登录",
      signInDescription: "使用 GitHub 登录以访问您的账户。",
      createAccount: "创建账户",
      createAccountDescription: "通过 GitHub 创建账户，开启您的体验。",
      checkingLoginStatus: "检查登录状态...",
      connecting: "连接中...",
      continueWithGitHub: "使用 GitHub 继续",
      connectGitHub: "关联 GitHub",
      githubAccountRequired:
        "需要 GitHub 账户以追踪 Star 仓库并获取 inks。",
      alreadyHaveAccount: "已有账户？",
      signInLink: "登录",
    },
    userDropdown: {
      inks: "inks",
      download: "下载应用",
      earnMore: "获取更多 \u2192",
      signingOut: "正在退出...",
      signOut: "退出登录",
    },
    profile: {
      title: "个人资料",
      joined: "加入时间：{date}",
      justNow: "刚刚",
      hoursAgo: "{hours} 小时前",
      yesterday: "昨天",
      daysAgo: "{days} 天前",
      connectedAccounts: "关联账户",
      accountDetails: "账户详情",
      userId: "用户 ID",
      email: "邮箱",
      registered: "注册时间",
      lastSignIn: "上次登录",
      inksTitle: "Inks 余额",
      betaInksNeverExpire: "Beta 特权 - Inks 永不过期",
      readyToDownload: "已获下载资格",
      moreInksToUnlock: "距下载解锁还差 {count} inks",
      earnInks: "赚取 inks",
      earnInksArrow: "赚取 inks \u2192",
      starTopRepos:
        "Star 前 {maxRepos} 个仓库可获 inks。需 {requiredInks} inks 解锁下载。",
      earnInksTitle: "赚取 Inks",
      refresh: "刷新",
      refreshing: "刷新中...",
      refreshStarStatus: "刷新 Star 状态",
      connectGitHubTitle: "关联 GitHub",
      connectGitHubDescription:
        "关联 GitHub 账户以追踪 Star 仓库并赚取 inks。",
      recommended: "推荐仓库",
      starred: "已 Star",
      star: "Star",
      starTopReposFooter:
        "Star 前 {maxRepos} 个仓库获取 inks | 1 Star = {inksPerStar} inks",
    },
    desktopSuccess: {
      loginFailed: "登录失败",
      tryAgain: "重试",
      loginSuccessful: "登录成功！",
      loggedIn: "已登录！",
      sendingCode: "正在发送登录码至桌面应用...",
      codeSent: "登录码已发送，您可以关闭此窗口。",
      copyCodePrompt: "复制下方登录码并粘贴至桌面应用。",
      copyCode: "复制代码",
      copied: "已复制！",
      codeManualCopy: "您也可以手动复制代码。",
      codeExpires:
        "此代码将在会话结束时失效。若登录失败，请重新获取。",
      returnToDesktop: "请返回桌面应用继续。",
      closeWindow: "代码粘贴完成后，即可关闭此窗口。",
    },
  },
  ja: {
    common: {
      loading: "読み込み中...",
    },
    header: {
      loading: "読み込み中",
      getStarted: "はじめる",
      feedback: "フィードバック",
      language: "言語",
    },
    home: {
      heroDescription:
        "AI ネイティブな LaTeX エディタ。ワンクリック設定、全言語対応、Git 内蔵、完全オープンソース。",
      heroImageAlt: "LMMs-Lab Writer - AI ネイティブ LaTeX エディタ",
      downloadCta: "ダウンロード",
      documentationCta: "ドキュメント",
      featuresTitle: "必要な機能は、すべてここに。",
      featuresSubtitle:
        "LaTeX の設定に煩わされることなく、研究のアイデアそのものに集中するために。",
      tapToZoom: "タップして拡大",
      features: [
        {
          title: "OpenCode AI 連携",
          description:
            "プロジェクト全体を理解する AI パネルを内蔵。チャット、ファイル添付、モデル切替に対応し、Claude Code、Cursor、Codex とも連携可能です。",
        },
        {
          title: "LaTeX ワンクリック設定",
          description:
            "最小構成の LaTeX ディストリビューションを自動検出しインストール。不足パッケージはコンパイル時に自動導入されるため、手動設定は不要です。",
        },
        {
          title: "あらゆる言語に対応",
          description:
            "XeLaTeX / LuaLaTeX による完全な Unicode サポート。CJK、アラビア語、キリル文字などもシステムフォントで即座に使用可能です。",
        },
        {
          title: "Git ネイティブ共同作業",
          description:
            "ステージ、コミット、差分確認、プッシュ/プルをサイドバーで完結。AI によるコミットメッセージ生成や、GitHub へのワンクリック公開にも対応。",
        },
        {
          title: "完全オープンソース",
          description:
            "MIT ライセンス。ファイルは常にローカルに保存され、テレメトリやベンダーロックインはありません。自由に Fork や改変が可能です。",
        },
        {
          title: "クロスプラットフォーム",
          description:
            "macOS と Windows でネイティブ動作。Electron ラッパーではなく、Tauri による高性能なネイティブ実装です。",
        },
      ],
      videoTitle: "デモ動画",
      videoSubtitle: "LMMs-Lab Writer の実際の動作をご覧ください。",
      demoTitle: "動作デモ",
      demoSubtitle: "偉大な論文も、最初の一行から始まります。さあ、書き始めましょう。",
      comparisonTitle: "既存のツールに不満を感じるのには、理由があります。",
      comparisonColumns: {
        feature: "機能",
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
          overleaf: "基本的な文法チェック",
          writer: "OpenCode + 任意の AI Agent",
        },
        {
          feature: "多言語対応",
          overleaf: "CJK 対応に制限あり",
          writer: "Unicode 完全対応、XeLaTeX、システムフォント",
        },
        {
          feature: "LaTeX 環境",
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
          writer: "ローカル即時実行",
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
      builtBy: "開発:",
      allRightsReserved: "All rights reserved.",
      editOnGitHub: "GitHub で編集",
    },
    docs: {
      title: "ドキュメント",
      subtitle: "LMMs-Lab Writer を使い始めるために必要なすべて。",
      sections: [
        {
          title: "はじめに",
          items: [
            {
              title: "インストール",
              href: "/docs/installation",
              description:
                "macOS および Windows への LMMs-Lab Writer インストール手順。",
            },
            {
              title: "クイックスタート",
              href: "/docs/quick-start",
              description: "5 分で LMMs-Lab Writer の基本設定を完了する。",
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
                "内蔵 OpenCode AI パネルを使った LaTeX 執筆支援。",
            },
            {
              title: "AI Agents",
              href: "/docs/ai-agents",
              description:
                "Claude Code、Cursor、Codex CLI などの AI ツールとの連携。",
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
                "pdfLaTeX、XeLaTeX、LuaLaTeX、Latexmk を用いたコンパイル。",
            },
            {
              title: "ターミナル",
              href: "/docs/terminal",
              description:
                "内蔵ターミナルでのシェル操作と CLI ツールの利用。",
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
      notFound: "ページが見つかりません",
    },
    download: {
      pageTitle: "ダウンロード",
      versionLabel: "バージョン",
      installNoticeBadge: "インストールと配布について",
      installNoticeTitle:
        "Homebrew でのインストールを推奨します。DMG/PKG は代替手段です。",
      installNoticeIntro:
        "macOS の一部のインストール先では管理者権限が必要です。sudo はシステムレベルのインストール手順においてのみ要求されます。",
      installNoticeSudoTitle: "sudo が必要な理由",
      installNoticeSudoBody:
        "sudo は /Applications などの保護されたディレクトリへの配置と、適切な権限設定のために使用されます。",
      installNoticeOpenSourceTitle: "オープンソースで監査可能",
      installNoticeOpenSourceBody:
        "アプリ本体とインストーラのロジックは全て公開されており、権限を付与する前に処理内容を確認できます。",
      installNoticeIndependenceTitle: "独立した配布方針",
      installNoticeIndependenceBody:
        "Apple の管理する配布チャネルに依存せず、インストールの透明性とユーザーによる制御を重視しています。",
      installOrderLabel: "推奨インストール手順",
      installOrderPrimary: "1) Homebrew（推奨）",
      installOrderSecondary: "2) DMG",
      installOrderTertiary: "3) PKG / 手動",
      readyBannerTitle: "{inks} inks 保有 - ダウンロード可能です",
      readyBannerNote:
        "ベータ期間中: ダウンロードや利用で inks は消費されません",
      recommendedForSystem: "お使いのシステムへの推奨",
      genericDownload: "ダウンロード",
      platformDetected: "{platform} を検出",
      otherPlatforms: "その他のプラットフォーム",
      installViaHomebrew: "Homebrew でインストール",
      recommendedTag: "推奨",
      homebrewNote:
        "セキュリティ警告は出ません。brew upgrade で自動更新可能です。",
      homebrewArchFallback:
        "Homebrew でアーキテクチャの不一致（Intel Mac など）が生じる場合は、下の Intel (x64) DMG/PKG をご利用ください。",
      npmPackage: "NPM パッケージ",
      latestTarball:
        "@lmms-lab/writer-shared の最新 tarball:",
      installation: "インストール",
      manualInstallation: "手動インストール",
      windowsInstallIntro: "インストール手順:",
      windowsStep1: ".msi ファイルをダウンロード",
      windowsStep2: "ダブルクリックしてインストーラーを実行",
      windowsStep3: "ウィザードに従ってインストール",
      windowsWarning:
        "Windows SmartScreen の警告が表示される場合があります。「詳細情報」をクリックし、「実行」を選択してください。",
      notNotarized:
        "このビルドは公証（Notarization）されていません。macOS でブロックされる場合は、以下のターミナルコマンドを使用してください。",
      installFromDmg: "DMG からインストール（推奨）:",
      dmgStep1: ".dmg ファイルをダウンロード",
      dmgStep2: "ターミナルで実行:",
      installFromPkg: "PKG からインストール（CLI）:",
      pkgUntrustedNote:
        "PKG は Developer ID 署名されていないため、-allowUntrusted オプションが必要です。",
      alternativeMethod: "代替方法: 右クリックで開く",
      altStep1Prefix: "ダウンロードしたファイルを",
      altStep1Action: "右クリックして",
      altStep1Open: "「開く」を選択",
      altStep2: "ダイアログで「開く」をクリック",
      altStep3: "インストール完了（DMG は Applications フォルダへドラッグ）",
      requirements: "システム要件",
      latexDistribution: "LaTeX ディストリビューション",
      gitOptional: "Git（任意、バージョン管理用）",
      buildFromSource: "ソースからビルド",
      inksGateTitle: "ダウンロードには {requiredInks} inks が必要です",
      inksGateDescription:
        "上位 {maxRepos} つのリポジトリにスターを付けると inks を獲得できます。1 スター = {inksPerStar} inks。",
      yourInks: "現在の inks",
      betaUsersTitle: "ベータユーザー特典: Inks 無期限有効",
      betaUsersDescription:
        "ベータ期間中に獲得した inks は失効しません。正式リリース後、アプリ本体は無料ですが、高度な AI 機能は日次で inks を消費します。今のうちに確保しておきましょう。",
      goToProfile: "プロフィールで inks を獲得",
      signInToGetStarted: "サインインして開始",
      starEnoughInks:
        "{repoCount} つのリポジトリにスターを付けると必要な inks が貯まります",
    },
    auth: {
      backToHome: "ホームに戻る",
      signIn: "サインイン",
      signInDescription:
        "GitHub でサインインしてアカウントにアクセス。",
      createAccount: "アカウント作成",
      createAccountDescription:
        "GitHub でアカウントを作成して利用開始。",
      checkingLoginStatus: "ログイン状態を確認中...",
      connecting: "接続中...",
      continueWithGitHub: "GitHub で続ける",
      connectGitHub: "GitHub を連携",
      githubAccountRequired:
        "スター付きリポジトリの追跡と inks 獲得には GitHub アカウントが必要です。",
      alreadyHaveAccount: "アカウントをお持ちですか？",
      signInLink: "サインイン",
    },
    userDropdown: {
      inks: "inks",
      download: "ダウンロード",
      earnMore: "もっと獲得 \u2192",
      signingOut: "サインアウト中...",
      signOut: "サインアウト",
    },
    profile: {
      title: "プロフィール",
      joined: "{date} に参加",
      justNow: "たった今",
      hoursAgo: "{hours} 時間前",
      yesterday: "昨日",
      daysAgo: "{days} 日前",
      connectedAccounts: "連携アカウント",
      accountDetails: "アカウント詳細",
      userId: "ユーザー ID",
      email: "メールアドレス",
      registered: "登録日",
      lastSignIn: "最終サインイン",
      inksTitle: "Inks",
      betaInksNeverExpire: "ベータ特典 - Inks は失効しません",
      readyToDownload: "ダウンロード可能",
      moreInksToUnlock:
        "ダウンロード解禁まであと {count} inks",
      earnInks: "Inks を獲得",
      earnInksArrow: "Inks を獲得 \u2192",
      starTopRepos:
        "上位 {maxRepos} リポジトリにスターを付けて inks を獲得。ダウンロードには {requiredInks} inks が必要です。",
      earnInksTitle: "Inks を獲得",
      refresh: "更新",
      refreshing: "更新中...",
      refreshStarStatus: "スター状態を更新",
      connectGitHubTitle: "GitHub を連携",
      connectGitHubDescription:
        "GitHub アカウントを連携してスター付きリポジトリを追跡し、inks を獲得しましょう。",
      recommended: "おすすめ",
      starred: "スター済み",
      star: "スター",
      starTopReposFooter:
        "上位 {maxRepos} リポジトリにスターを付けて inks を獲得 | 1 スター = {inksPerStar} inks",
    },
    desktopSuccess: {
      loginFailed: "ログイン失敗",
      tryAgain: "再試行",
      loginSuccessful: "ログイン成功！",
      loggedIn: "ログインしました！",
      sendingCode: "デスクトップアプリにログインコードを送信中...",
      codeSent:
        "ログインコードを送信しました。このウィンドウは閉じて構いません。",
      copyCodePrompt:
        "以下のコードをコピーして、デスクトップアプリに貼り付けてください。",
      copyCode: "コードをコピー",
      copied: "コピーしました！",
      codeManualCopy: "コードは手動でコピーすることも可能です。",
      codeExpires:
        "このコードはセッション終了時に無効化されます。ログインに失敗した場合は再取得してください。",
      returnToDesktop: "デスクトップアプリに戻って操作を続けてください。",
      closeWindow:
        "アプリにコードを入力したら、このウィンドウを閉じてください。",
    },
  },
};

export function getMessages(locale: Locale): WebMessages {
  return MESSAGES[locale];
}
