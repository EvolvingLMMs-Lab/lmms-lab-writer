"use client";

import { useState } from "react";

type Platform = "macos" | "linux" | "windows";

export function InstallGuide() {
  const [platform, setPlatform] = useState<Platform>(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("mac")) return "macos";
      if (ua.includes("win")) return "windows";
      return "linux";
    }
    return "macos";
  });

  const installCommands: Record<Platform, string> = {
    macos: `curl -fsSL https://latex-writer.vercel.app/install.sh | bash`,
    linux: `curl -fsSL https://latex-writer.vercel.app/install.sh | bash`,
    windows: `irm https://latex-writer.vercel.app/install.ps1 | iex`,
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="logo-bar text-foreground">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="text-2xl font-bold tracking-tight">
              LMMs-Lab Writer
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            One-Time Setup
          </h1>
          <p className="text-muted text-lg">
            Install the background service to enable local editing and
            compilation
          </p>
        </div>

        {/* Platform selector */}
        <div className="flex justify-center gap-2 mb-8">
          {(["macos", "linux", "windows"] as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-4 py-2 text-sm transition-colors ${
                platform === p
                  ? "bg-black text-white"
                  : "bg-neutral-100 hover:bg-neutral-200"
              }`}
            >
              {p === "macos" ? "macOS" : p === "linux" ? "Linux" : "Windows"}
            </button>
          ))}
        </div>

        {/* Prerequisites */}
        <div className="border border-border p-6 mb-6">
          <h2 className="font-bold uppercase tracking-wide text-sm mb-4">
            Prerequisites
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-muted">1.</span>
              <div>
                <span className="font-medium">Node.js 20+</span>
                <span className="text-muted ml-2">
                  <a
                    href="https://nodejs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-black"
                  >
                    nodejs.org
                  </a>
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-muted">2.</span>
              <div>
                <span className="font-medium">LaTeX Distribution</span>
                <span className="text-muted ml-2">
                  {platform === "macos" && (
                    <code className="bg-neutral-100 px-1">
                      brew install --cask mactex
                    </code>
                  )}
                  {platform === "linux" && (
                    <code className="bg-neutral-100 px-1">
                      apt install texlive-full
                    </code>
                  )}
                  {platform === "windows" && (
                    <a
                      href="https://miktex.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-black"
                    >
                      MiKTeX
                    </a>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Install command */}
        <div className="bg-black text-white p-6 font-mono text-sm relative group">
          <div className="absolute top-2 right-2 text-neutral-500 text-xs uppercase">
            {platform === "windows" ? "PowerShell" : "Terminal"}
          </div>
          <div className="flex items-start gap-3">
            <span className="text-neutral-500 select-none">
              {platform === "windows" ? "PS>" : "$"}
            </span>
            <code className="break-all">{installCommands[platform]}</code>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(installCommands[platform])}
            className="absolute bottom-2 right-2 text-neutral-500 hover:text-white text-xs transition-colors"
          >
            Copy
          </button>
        </div>

        {/* What happens */}
        <div className="mt-8 text-center text-sm text-muted">
          <p className="mb-4">This will:</p>
          <ul className="space-y-1">
            <li>Install the LMMs-Lab Writer CLI</li>
            <li>Set up a background service that starts automatically</li>
            <li>Enable local file editing, Git, and LaTeX compilation</li>
          </ul>
        </div>

        {/* Retry button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-black text-white hover:bg-black/80 transition-colors"
          >
            I&apos;ve installed it - Refresh
          </button>
        </div>

        {/* Manual alternative */}
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted">
          <p>
            Or install manually:{" "}
            <code className="bg-neutral-100 px-1 text-black">
              npm install -g @lmms-lab/writer-cli && llw
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
