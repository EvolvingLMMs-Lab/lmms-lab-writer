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
        <section className="py-24 px-6 bg-cream relative overflow-hidden">
          <div className="absolute top-16 left-8 md:left-20 text-foreground/15 animate-float hidden md:block">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>

          <div className="absolute top-20 right-12 md:right-32 text-foreground/20 animate-float-delayed hidden md:block font-serif text-4xl select-none">
            ∑
          </div>

          <div className="absolute bottom-16 left-16 md:left-32 text-foreground/15 animate-float-delayed hidden md:block">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
            </svg>
          </div>

          <div className="absolute bottom-20 right-8 md:right-24 text-foreground/15 hidden md:block font-mono text-3xl select-none">
            {"{ }"}
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 relative inline-block">
              Stop writing LaTeX.
              <span className="absolute -top-6 -right-8 text-foreground/25 font-serif text-3xl select-none hidden md:block animate-float">
                ∫
              </span>
              <br />
              <span className="relative inline-block">
                Start thinking.
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-foreground/70"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 25 0 50 5 T 100 5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>
            <p className="text-lg text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
              Let Claude Code and Codex write your papers while you focus on
              what matters — your research.
            </p>
            <div className="flex items-center justify-center gap-4 relative">
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
              {["Claude Code", "Codex CLI", "OpenCode"].map((tool) => (
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
