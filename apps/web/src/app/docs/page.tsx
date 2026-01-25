import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      { title: "Claude Code", href: "/docs/ai-tools/claude-code" },
      { title: "Cursor", href: "/docs/ai-tools/cursor" },
      { title: "OpenCode", href: "/docs/ai-tools/opencode" },
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
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="logo-bar">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="font-mono text-sm tracking-tight">
              LMMs-Lab Writer
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="text-2xl font-medium tracking-tight mb-10">
            Documentation
          </h1>

          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-sm font-medium mb-3">{section.title}</h2>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted hover:text-foreground transition-colors"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 text-sm text-muted">
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
