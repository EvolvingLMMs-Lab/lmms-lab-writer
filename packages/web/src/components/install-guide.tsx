"use client";

import { useState, useCallback } from "react";

type Platform = "macos" | "linux" | "windows";

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function LinuxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.002c-.06-.135-.12-.2-.184-.268-.193-.135-.406-.2-.601-.2-.066 0-.4.068-.737.267a3.81 3.81 0 01-.651.267c-.143-.135-.376-.47-.46-.602-.18-.268-.307-.534-.357-.867 0-.2.002-.534.03-.802.03-.266.066-.467.066-.6v-.135a9.89 9.89 0 01-.11-.802c-.06-.603-.187-1.27-.467-1.804-.28-.533-.667-1.003-1.2-1.235a.164.164 0 00-.035-.01 3.606 3.606 0 00-.037-.735h.003zm-2.752 1.067c-.026 0-.05.003-.076.008-.32.054-.696.266-.939.666-.242.398-.354.865-.283 1.404l.001.005c.02.135.066.264.108.4v-.001c.117.467.487.933.896 1.135.409.2.757.135 1.063-.135.306-.267.427-.733.325-1.267-.123-.666-.517-1.467-1.072-2.015a.633.633 0 00-.023-.2zm2.723.333c.003 0 .01.003.013.003.053.028.135.099.248.2.226.2.487.468.69.736v.002l.006.005c.135.202.199.47.2.867 0 .267-.035.533-.11.8a1.9 1.9 0 00-.153-.535c-.178-.333-.454-.6-.777-.867a1.821 1.821 0 00-.317-.066l.003-.268c.06-.135.088-.267.088-.4zm3.86 1.206c.058 0 .14.028.24.135.168.2.168.534.038.934-.13.398-.325.733-.66.933-.39.135-.697.067-.855-.2v-.004h-.003c-.093-.132-.2-.2-.323-.267a.93.93 0 00-.407-.133c.034-.065.07-.131.115-.2.168-.2.384-.466.638-.6.123-.066.247-.132.37-.198.123-.07.252-.135.37-.135h.016-.04z" />
    </svg>
  );
}

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );
}

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

  const [copied, setCopied] = useState(false);

  const installCommands: Record<Platform, string> = {
    macos: `curl -fsSL https://latex-writer.vercel.app/install.sh | bash`,
    linux: `curl -fsSL https://latex-writer.vercel.app/install.sh | bash`,
    windows: `irm https://latex-writer.vercel.app/install.ps1 | iex`,
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(installCommands[platform]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [platform, installCommands]);

  const platformConfig: Record<Platform, { icon: typeof AppleIcon; label: string }> = {
    macos: { icon: AppleIcon, label: "macOS" },
    linux: { icon: LinuxIcon, label: "Linux" },
    windows: { icon: WindowsIcon, label: "Windows" },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-lg w-full text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="logo-bar text-foreground">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="text-lg font-bold tracking-tight uppercase">
              LMMs-Lab Writer
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Install
          </h1>
          <p className="text-muted text-sm">
            One command installs everything you need
          </p>
        </div>

        {/* Platform selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex border border-border">
            {(["macos", "linux", "windows"] as Platform[]).map((p) => {
              const Icon = platformConfig[p].icon;
              const isActive = platform === p;
              return (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-white hover:bg-neutral-50 active:bg-neutral-100"
                  } ${p !== "macos" ? "border-l border-border" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{platformConfig[p].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Install command */}
        <div className="bg-neutral-900 text-white overflow-hidden text-left">
          <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-neutral-600" />
                <span className="w-3 h-3 rounded-full bg-neutral-600" />
                <span className="w-3 h-3 rounded-full bg-neutral-600" />
              </div>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs transition-all rounded ${
                copied
                  ? "bg-green-500/20 text-green-400"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-700 active:bg-neutral-600"
              }`}
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 font-mono text-sm">
            <div className="flex items-start gap-3">
              <span className="text-neutral-500 select-none">
                {platform === "windows" ? ">" : "$"}
              </span>
              <code className="break-all text-green-400">{installCommands[platform]}</code>
            </div>
          </div>
        </div>

        {/* What it does - simplified */}
        <p className="mt-6 text-sm text-muted">
          Installs Node.js, LaTeX, and the CLI automatically
        </p>

        {/* CTA */}
        <div className="mt-8">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white text-sm hover:bg-black/80 active:bg-black/60 active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            I&apos;ve installed it
          </button>
        </div>
      </div>
    </div>
  );
}
