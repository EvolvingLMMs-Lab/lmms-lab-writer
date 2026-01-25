"use client";

import Link from "next/link";
import {
  Download,
  Github,
  FileText,
  Terminal,
  Cpu,
  FolderOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: FolderOpen,
    title: "Local-First",
    description: "Your files stay on your machine. No cloud lock-in.",
  },
  {
    icon: Cpu,
    title: "AI-Native",
    description: "Designed for Claude, Cursor, Codex, and any AI editor.",
  },
  {
    icon: FileText,
    title: "Real-time Preview",
    description: "See LaTeX changes as AI writes them.",
  },
  {
    icon: Terminal,
    title: "Built-in Terminal",
    description: "Git, compile, and run commands without leaving.",
  },
];

const steps = [
  {
    number: "01",
    title: "Download",
    description: "Get the app for macOS, Windows, or Linux.",
  },
  {
    number: "02",
    title: "Open Project",
    description: "Point to any folder with .tex files.",
  },
  {
    number: "03",
    title: "Write with AI",
    description: "Let Claude or Cursor edit your LaTeX directly.",
  },
];

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
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-tight"
          >
            LMMs-Lab Writer
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/download"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Download
            </Link>
            <Link
              href="https://github.com/LMMs-Lab/lmms-lab-writer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn btn-sm btn-primary">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in-up">
              <span className="badge mb-6">Now in Beta</span>
            </div>
            <h1 className="animate-fade-in-up delay-100 text-4xl md:text-6xl font-semibold tracking-tight mb-6">
              Stop writing LaTeX.
              <br />
              Start thinking.
            </h1>
            <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10">
              Let Claude, Cursor, and Codex write your papers while you focus on
              what matters - your research.
            </p>
            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/download" className="btn btn-primary">
                <Download className="w-4 h-4" />
                Download for macOS
              </Link>
              <Link href="/docs" className="btn btn-secondary">
                <FileText className="w-4 h-4" />
                Documentation
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="feature-card p-6 border border-border bg-white"
                >
                  <feature.icon className="w-6 h-6 mb-4" strokeWidth={1.5} />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-surface text-surface-text">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold mb-12 text-center">
              Why not Overleaf?
            </h2>
            <div className="border border-border-dark">
              <div className="grid grid-cols-3 border-b border-border-dark text-sm font-mono uppercase tracking-wider">
                <div className="p-4 border-r border-border-dark">Feature</div>
                <div className="p-4 border-r border-border-dark text-muted-foreground">
                  Overleaf
                </div>
                <div className="p-4">Writer</div>
              </div>
              {comparisons.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 text-sm ${
                    i !== comparisons.length - 1
                      ? "border-b border-border-dark"
                      : ""
                  }`}
                >
                  <div className="p-4 border-r border-border-dark font-medium">
                    {row.feature}
                  </div>
                  <div className="p-4 border-r border-border-dark text-muted-foreground">
                    {row.overleaf}
                  </div>
                  <div className="p-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-surface-text" />
                    {row.writer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold mb-12 text-center">
              Get started in 3 steps
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step) => (
                <div key={step.number} className="step-card">
                  <div className="step-number w-12 h-12 border border-foreground flex items-center justify-center font-mono text-lg mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/download" className="btn btn-primary inline-flex">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 border-t border-border bg-neutral-50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Works with your favorite AI tools
            </h2>
            <p className="text-muted mb-8">
              Any tool that can edit files works with LMMs-Lab Writer.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-mono">
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

      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-mono text-sm">
            Built by{" "}
            <Link
              href="https://github.com/LMMs-Lab"
              className="underline underline-offset-2 hover:text-muted"
              target="_blank"
              rel="noopener noreferrer"
            >
              LMMs-Lab
            </Link>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted">
            <Link
              href="/docs"
              className="hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://github.com/LMMs-Lab/lmms-lab-writer"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
