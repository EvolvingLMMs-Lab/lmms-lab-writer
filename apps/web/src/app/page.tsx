import Link from "next/link";
import { Github, Download, FileText, CheckCircle2 } from "lucide-react";

const comparisons = [
  { feature: "File location", overleaf: "Cloud only", writer: "Your machine" },
  { feature: "AI access", overleaf: "None", writer: "Direct file editing" },
  {
    feature: "Compilation",
    overleaf: "Their servers",
    writer: "Local (faster)",
  },
  { feature: "Git integration", overleaf: "Limited", writer: "First-class" },
  { feature: "Price", overleaf: "$15/month", writer: "Free" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="logo-bar">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="font-mono text-lg tracking-tight font-medium">
              LMMs-Lab Writer
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/docs"
              className="text-muted hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/download"
              className="text-muted hover:text-foreground transition-colors"
            >
              Download
            </Link>
            <Link
              href="https://github.com/Luodian/latex-writer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-6">
              AI-native LaTeX editor
            </h1>
            <p className="text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
              Local-first. Works with Claude, Cursor, Codex, or any tool that
              edits files. Your research stays on your machine.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/download" className="btn btn-primary">
                <Download className="w-4 h-4" />
                Download
              </Link>
              <Link href="/docs" className="btn btn-secondary">
                <FileText className="w-4 h-4" />
                Documentation
              </Link>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-medium mb-10 text-center">
              Why not Overleaf?
            </h2>
            <div className="border border-border max-w-3xl mx-auto">
              <div className="grid grid-cols-3 border-b border-border text-xs font-mono uppercase tracking-wider text-muted">
                <div className="p-4 border-r border-border">Feature</div>
                <div className="p-4 border-r border-border">Overleaf</div>
                <div className="p-4 bg-neutral-50 font-semibold text-foreground">
                  LMMs-Lab Writer
                </div>
              </div>
              {comparisons.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 text-sm ${
                    i !== comparisons.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="p-4 border-r border-border font-medium text-muted">
                    {row.feature}
                  </div>
                  <div className="p-4 border-r border-border text-muted">
                    {row.overleaf}
                  </div>
                  <div className="p-4 flex items-center gap-2 bg-neutral-50 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-foreground" />
                    {row.writer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Tools */}
        <section className="py-20 px-6 border-t border-border">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-xl font-medium mb-6">
              Works with your favorite AI tools
            </h2>
            <div className="flex flex-wrap justify-center gap-3 text-sm font-mono">
              {[
                "Claude Code",
                "Cursor",
                "Codex CLI",
                "OpenCode",
                "Windsurf",
              ].map((tool) => (
                <span
                  key={tool}
                  className="px-4 py-2 border border-border bg-white"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 text-sm text-muted">
          Built by{" "}
          <Link
            href="https://www.lmms-lab.com/"
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            LMMs-Lab
          </Link>
        </div>
      </footer>
    </div>
  );
}
