import Link from "next/link";
import { Github } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
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

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-6">
            AI-native LaTeX editor
          </h1>
          <p className="text-muted mb-10 leading-relaxed">
            Local-first. Works with Claude, Cursor, Codex, or any tool that
            edits files. Your research stays on your machine.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/download"
              className="px-5 py-2.5 text-sm border border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Download
            </Link>
            <Link
              href="/docs"
              className="px-5 py-2.5 text-sm text-muted hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted">
          <span>
            <Link
              href="https://lmms-lab.github.io"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              LMMs-Lab
            </Link>
          </span>
          <span>Free and open source</span>
        </div>
      </footer>
    </div>
  );
}
