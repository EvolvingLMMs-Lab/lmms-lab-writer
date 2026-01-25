import Link from "next/link";
import {
  ArrowLeft,
  Book,
  Cpu,
  Terminal,
  GitBranch,
  Settings,
} from "lucide-react";

const sections = [
  {
    title: "Getting Started",
    icon: Book,
    items: [
      { title: "Installation", href: "/docs/installation" },
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "Project Setup", href: "/docs/project-setup" },
    ],
  },
  {
    title: "AI Integration",
    icon: Cpu,
    items: [
      { title: "Claude Code", href: "/docs/ai-tools/claude-code" },
      { title: "Cursor", href: "/docs/ai-tools/cursor" },
      { title: "OpenCode", href: "/docs/ai-tools/opencode" },
      { title: "Other Tools", href: "/docs/ai-tools/other" },
    ],
  },
  {
    title: "Features",
    icon: Terminal,
    items: [
      { title: "LaTeX Compilation", href: "/docs/features/compilation" },
      { title: "Built-in Terminal", href: "/docs/features/terminal" },
      { title: "File Management", href: "/docs/features/files" },
    ],
  },
  {
    title: "Git Integration",
    icon: GitBranch,
    items: [
      { title: "Version Control", href: "/docs/git/version-control" },
      { title: "GitHub Sync", href: "/docs/git/github" },
      { title: "Overleaf Migration", href: "/docs/git/overleaf" },
    ],
  },
  {
    title: "Configuration",
    icon: Settings,
    items: [
      { title: "Settings", href: "/docs/config/settings" },
      { title: "Templates", href: "/docs/config/templates" },
      { title: "Keyboard Shortcuts", href: "/docs/config/shortcuts" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-tight"
          >
            LMMs-Lab Writer
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Documentation
          </h1>
          <p className="text-lg text-muted mb-12">
            Learn how to use LMMs-Lab Writer effectively.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {sections.map((section) => (
              <div key={section.title} className="border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="w-5 h-5" strokeWidth={1.5} />
                  <h2 className="font-semibold">{section.title}</h2>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted hover:text-foreground transition-colors block py-1"
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

      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted">
          <Link
            href="https://github.com/LMMs-Lab/lmms-lab-writer"
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Edit on GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
