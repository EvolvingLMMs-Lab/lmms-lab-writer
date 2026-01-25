import Link from "next/link";
import { Header } from "@/components/header";
import { DocsContent } from "@/components/docs-sections";

const sections = [
  {
    title: "Getting Started",
    items: [
      { title: "Installation", href: "/docs/installation" },
      { title: "Quick Start", href: "/docs/quick-start" },
    ],
  },
  {
    title: "AI Integration",
    items: [
      { title: "OpenCode", href: "/docs/ai-tools/opencode" },
      { title: "Other AI Agents", href: "/docs/ai-tools/agents" },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "LaTeX Compilation", href: "/docs/features/compilation" },
      { title: "Terminal", href: "/docs/features/terminal" },
      { title: "Git Integration", href: "/docs/features/git" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <DocsContent sections={sections} />

      <footer className="border-t border-border px-6">
        <div className="max-w-5xl mx-auto py-6 text-sm text-muted">
          <Link
            href="https://github.com/Luodian/latex-writer"
            className="hover:text-foreground transition-colors"
            target="_blank"
          >
            Edit on GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
