"use client";

import Link from "next/link";
import {
  Download,
  Zap,
  Sparkles,
  Bot,
  FileText,
  Terminal,
  GitBranch,
  type LucideIcon,
} from "lucide-react";
import {
  FadeIn,
  FadeInStagger,
  FadeInStaggerItem,
  MotionCard,
} from "@/components/motion";

type DocItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

type Section = {
  title: string;
  items: DocItem[];
};

const sections: Section[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Installation",
        href: "/docs/installation",
        description:
          "How to install LMMs-Lab Writer on macOS and Windows.",
        icon: Download,
      },
      {
        title: "Quick Start",
        href: "/docs/quick-start",
        description:
          "Get up and running with LMMs-Lab Writer in 5 minutes.",
        icon: Zap,
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
        icon: Sparkles,
      },
      {
        title: "AI Agents",
        href: "/docs/ai-agents",
        description:
          "Using Claude Code, Cursor, Codex CLI, and other AI tools.",
        icon: Bot,
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
        icon: FileText,
      },
      {
        title: "Terminal",
        href: "/docs/terminal",
        description:
          "Using the built-in terminal for shell access and CLI tools.",
        icon: Terminal,
      },
      {
        title: "Git Integration",
        href: "/docs/git",
        description:
          "Version control, diffing, and GitHub publishing built into the editor.",
        icon: GitBranch,
      },
    ],
  },
];

export function DocsContent() {
  return (
    <main className="flex-1 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <h1 className="text-2xl font-medium tracking-tight mb-2">
            Documentation
          </h1>
          <p className="text-sm text-muted mb-12">
            Everything you need to get started with LMMs-Lab Writer.
          </p>
        </FadeIn>

        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <FadeIn>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted mb-4">
                  {section.title}
                </h2>
              </FadeIn>
              <FadeInStagger
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                staggerDelay={0.06}
              >
                {section.items.map((item) => (
                  <FadeInStaggerItem key={item.href}>
                    <Link href={item.href} className="block h-full">
                      <MotionCard className="border border-border p-5 h-full">
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-8 h-8 border border-foreground flex items-center justify-center bg-neutral-50 shrink-0">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-medium">{item.title}</h3>
                        </div>
                        <p className="text-sm text-muted leading-relaxed">
                          {item.description}
                        </p>
                      </MotionCard>
                    </Link>
                  </FadeInStaggerItem>
                ))}
              </FadeInStagger>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
