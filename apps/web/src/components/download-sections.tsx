"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import {
  motion,
  FadeIn,
  FadeInStagger,
  FadeInStaggerItem,
} from "@/components/motion";
import { GITHUB_CONFIG } from "@/lib/github/config";

const GPU_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.5,
} as const;

const platforms = [
  {
    name: "macOS",
    variants: [
      { label: "Apple Silicon", file: "LMMs-Lab_Writer_0.1.0_aarch64.dmg" },
    ],
  },
  {
    name: "Windows",
    variants: [
      { label: "64-bit", file: "LMMs-Lab_Writer_0.1.0_x64-setup.exe" },
    ],
  },
];

const releaseUrl =
  "https://github.com/Luodian/latex-writer/releases/latest/download";

export function DownloadSection() {
  return (
    <FadeInStagger className="space-y-8 max-w-2xl" staggerDelay={0.1}>
      {platforms.map((platform) => (
        <FadeInStaggerItem key={platform.name}>
          <h2 className="text-sm font-medium mb-3">{platform.name}</h2>
          <div className="flex flex-wrap gap-3">
            {platform.variants.map((variant) => (
              <motion.div
                key={variant.file}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={GPU_SPRING}
                style={{ willChange: "transform" }}
              >
                <Link
                  href={`${releaseUrl}/${variant.file}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border hover:border-foreground transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {variant.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </FadeInStaggerItem>
      ))}
    </FadeInStagger>
  );
}

export function RequirementsSection() {
  return (
    <FadeIn className="mt-16 pt-8 border-t border-border max-w-2xl">
      <h2 className="text-sm font-medium mb-3">Requirements</h2>
      <ul className="text-sm text-muted space-y-1">
        <li>
          LaTeX distribution (
          <Link
            href="https://www.tug.org/mactex/"
            className="underline hover:text-foreground transition-colors"
            target="_blank"
          >
            MacTeX
          </Link>
          ,{" "}
          <Link
            href="https://www.tug.org/texlive/"
            className="underline hover:text-foreground transition-colors"
            target="_blank"
          >
            TeX Live
          </Link>
          , or{" "}
          <Link
            href="https://miktex.org/"
            className="underline hover:text-foreground transition-colors"
            target="_blank"
          >
            MiKTeX
          </Link>
          )
        </li>
        <li>Git (optional, for version control)</li>
      </ul>
    </FadeIn>
  );
}

export function BuildSection() {
  return (
    <FadeIn className="mt-10 pt-8 border-t border-border max-w-2xl">
      <h2 className="text-sm font-medium mb-3">Build from source</h2>
      <pre className="text-sm text-muted bg-neutral-50 p-4 overflow-x-auto border border-border">
        {`git clone https://github.com/Luodian/latex-writer.git
cd latex-writer
pnpm install
pnpm tauri:build`}
      </pre>
    </FadeIn>
  );
}

export function CreditsGate({
  credits,
  requiredCredits,
  isLoggedIn,
}: {
  credits: number;
  requiredCredits: number;
  isLoggedIn: boolean;
}) {
  const progressPercent = Math.min((credits / requiredCredits) * 100, 100);

  return (
    <FadeIn className="max-w-2xl">
      <div className="border-2 border-dashed border-neutral-300 p-8">
        <h2 className="text-xl font-medium mb-2">
          {requiredCredits} credits required to download
        </h2>
        <p className="text-sm text-muted mb-6">
          Star repositories to earn credits. Each repo ={" "}
          {GITHUB_CONFIG.CREDITS_PER_STAR} credits.
        </p>

        {isLoggedIn && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted">Your credits</span>
              <span className="font-mono">
                {credits}/{requiredCredits}
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-100 border border-neutral-200">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="border border-black bg-neutral-50 p-4 mb-6">
          <p className="text-sm font-medium mb-1">
            Beta users: Permanent credits
          </p>
          <p className="text-xs text-muted">
            Credits earned during beta never expire. After public launch, the
            app will be free to download, but premium AI features will consume
            credits daily. Lock in your credits now.
          </p>
        </div>

        {isLoggedIn ? (
          <Link
            href="/profile#earn-credits"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black text-sm font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors"
          >
            Go to Profile to Earn Credits
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black text-sm font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors"
          >
            Sign in to Get Started
          </Link>
        )}

        <p className="text-xs text-muted mt-4">
          Takes 2-3 minutes to earn enough credits
        </p>
      </div>
    </FadeIn>
  );
}
