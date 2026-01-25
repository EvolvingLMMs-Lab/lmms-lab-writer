"use client";

import Link from "next/link";
import { Download, Apple, Monitor, Github, ArrowLeft } from "lucide-react";

const platforms = [
  {
    name: "macOS",
    icon: Apple,
    variants: [
      {
        label: "Apple Silicon",
        arch: "aarch64",
        filename: "LMMs-Lab Writer_VERSION_aarch64.dmg",
      },
      {
        label: "Intel",
        arch: "x64",
        filename: "LMMs-Lab Writer_VERSION_x64.dmg",
      },
    ],
  },
  {
    name: "Windows",
    icon: Monitor,
    variants: [
      {
        label: "64-bit",
        arch: "x64",
        filename: "LMMs-Lab Writer_VERSION_x64-setup.exe",
      },
    ],
  },
  {
    name: "Linux",
    icon: Monitor,
    variants: [
      {
        label: "AppImage",
        arch: "amd64",
        filename: "LMMs-Lab Writer_VERSION_amd64.AppImage",
      },
      {
        label: "Debian",
        arch: "amd64",
        filename: "lmms-lab-writer_VERSION_amd64.deb",
      },
    ],
  },
];

const requirements = [
  {
    title: "LaTeX Distribution",
    description: "MacTeX, TeX Live, or MiKTeX for compilation",
    link: "https://www.latex-project.org/get/",
  },
  {
    title: "Git",
    description: "For version control features",
    link: "https://git-scm.com/downloads",
  },
  {
    title: "AI Tool (Optional)",
    description: "Claude Code, Cursor, or any file-editing AI",
    link: "/docs/ai-tools",
  },
];

export default function DownloadPage() {
  const version = "0.1.0";
  const releaseUrl =
    "https://github.com/LMMs-Lab/lmms-lab-writer/releases/latest";

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
              href="https://github.com/LMMs-Lab/lmms-lab-writer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
            </Link>
          </nav>
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
            Download LMMs-Lab Writer
          </h1>
          <p className="text-lg text-muted mb-12">
            Version {version} - Free and open source
          </p>

          <div className="space-y-8 mb-16">
            {platforms.map((platform) => (
              <div key={platform.name} className="border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <platform.icon className="w-6 h-6" strokeWidth={1.5} />
                  <h2 className="text-xl font-semibold">{platform.name}</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {platform.variants.map((variant) => (
                    <Link
                      key={variant.arch}
                      href={`${releaseUrl}/download/v${version}/${variant.filename.replace("VERSION", version)}`}
                      className="btn btn-secondary"
                    >
                      <Download className="w-4 h-4" />
                      {variant.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-12">
            <h2 className="text-xl font-semibold mb-6">Requirements</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {requirements.map((req) => (
                <div key={req.title} className="p-4 border border-border">
                  <h3 className="font-semibold mb-2">{req.title}</h3>
                  <p className="text-sm text-muted mb-3">{req.description}</p>
                  <Link
                    href={req.link}
                    className="text-sm underline underline-offset-2 hover:text-muted"
                    target={req.link.startsWith("http") ? "_blank" : undefined}
                    rel={
                      req.link.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    Learn more
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 p-6 bg-neutral-50 border border-border">
            <h3 className="font-semibold mb-2">Build from source</h3>
            <p className="text-sm text-muted mb-4">
              LMMs-Lab Writer is open source. You can build it yourself:
            </p>
            <pre className="bg-surface text-surface-text p-4 text-sm font-mono overflow-x-auto">
              {`git clone https://github.com/LMMs-Lab/lmms-lab-writer.git
cd lmms-lab-writer
pnpm install
pnpm tauri:build`}
            </pre>
          </div>
        </div>
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
          </nav>
        </div>
      </footer>
    </div>
  );
}
