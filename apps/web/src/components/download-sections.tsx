"use client";

import Link from "next/link";
import { Download, Apple, Monitor, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  motion,
  FadeIn,
} from "@/components/motion";
import { GITHUB_CONFIG } from "@/lib/github/config";

const GPU_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.5,
} as const;

const BLOB_URL = "https://uv96nthsmy3qxwco.public.blob.vercel-storage.com";

type Platform = "macOS" | "Windows" | "Linux" | "unknown";

const platforms = {
  macOS: {
    name: "macOS",
    icon: Apple,
    variants: [
      {
        label: "Apple Silicon",
        sublabel: "M1/M2/M3/M4",
        file: "LMMs-Lab_Writer_0.1.0_aarch64.pkg",
        url: `${BLOB_URL}/LMMs-Lab_Writer_0.1.0_aarch64.pkg`,
      },
    ],
  },
  Windows: {
    name: "Windows",
    icon: Monitor,
    variants: [
      {
        label: "Windows Installer",
        sublabel: "64-bit (exe)",
        file: "LMMs-Lab Writer_0.1.0_x64-setup.exe",
        url: `${BLOB_URL}/LMMs-Lab%20Writer_0.1.0_x64-setup.exe`,
      },
      {
        label: "Windows MSI",
        sublabel: "64-bit (msi)",
        file: "LMMs-Lab Writer_0.1.0_x64_en-US.msi",
        url: `${BLOB_URL}/LMMs-Lab%20Writer_0.1.0_x64_en-US.msi`,
      },
    ],
  },
};

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";

  if (platform.includes("mac") || ua.includes("mac")) return "macOS";
  if (platform.includes("win") || ua.includes("win")) return "Windows";
  if (platform.includes("linux") || ua.includes("linux")) return "Linux";

  return "unknown";
}

export function DownloadSection() {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>("unknown");
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  const recommendedPlatform = detectedPlatform === "macOS" || detectedPlatform === "Windows"
    ? detectedPlatform
    : "macOS";

  const recommended = platforms[recommendedPlatform];
  const otherPlatformKey = recommendedPlatform === "macOS" ? "Windows" : "macOS";
  const other = platforms[otherPlatformKey];

  return (
    <FadeIn className="max-w-2xl">
      {/* Recommended Download */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-medium">
            {detectedPlatform !== "unknown" && detectedPlatform !== "Linux"
              ? "Recommended for your system"
              : "Download"}
          </h2>
          {detectedPlatform !== "unknown" && detectedPlatform !== "Linux" && (
            <span className="text-xs px-2 py-0.5 bg-black text-white">
              {detectedPlatform} detected
            </span>
          )}
        </div>

        {recommended.variants.map((variant) => (
          <motion.div
            key={variant.file}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={GPU_SPRING}
            style={{ willChange: "transform" }}
          >
            <Link
              href={variant.url}
              className="group flex items-center gap-4 p-5 border-2 border-black bg-white hover:bg-neutral-50 transition-colors shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-black text-white">
                <recommended.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{recommended.name}</span>
                  <span className="text-xs text-muted">{variant.sublabel}</span>
                </div>
                <span className="text-xs text-muted">{variant.file}</span>
              </div>
              <Download className="w-5 h-5 text-muted group-hover:text-black transition-colors" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Other Platforms */}
      <div>
        <button
          onClick={() => setShowAllPlatforms(!showAllPlatforms)}
          className="flex items-center gap-2 text-sm text-muted hover:text-black transition-colors mb-4"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showAllPlatforms ? "rotate-180" : ""}`} />
          Other platforms
        </button>

        {showAllPlatforms && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {other.variants.map((variant) => (
              <motion.div
                key={variant.file}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={GPU_SPRING}
              >
                <Link
                  href={variant.url}
                  className="flex items-center gap-3 p-3 border border-border hover:border-black transition-colors"
                >
                  <other.icon className="w-5 h-5 text-muted" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{other.name}</span>
                    <span className="text-xs text-muted ml-2">{variant.sublabel}</span>
                  </div>
                  <Download className="w-4 h-4 text-muted" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </FadeIn>
  );
}

export function HomebrewSection() {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  // Only show Homebrew section on macOS
  if (detectedPlatform !== "macOS" && detectedPlatform !== "unknown") {
    return null;
  }

  return (
    <FadeIn className="mt-10 pt-8 border-t border-border max-w-2xl">
      <h2 className="text-sm font-medium mb-3">
        Install via Homebrew{" "}
        <span className="text-xs font-normal text-muted">(Recommended)</span>
      </h2>
      <pre className="text-sm text-muted bg-neutral-50 p-4 overflow-x-auto border border-border">
        {`brew tap EvolvingLMMs-Lab/tap
brew install --cask lmms-lab-writer`}
      </pre>
      <p className="text-xs text-muted mt-2">
        No security warnings. Auto-updates with{" "}
        <code className="bg-neutral-100 px-1">brew upgrade</code>.
      </p>
    </FadeIn>
  );
}

export function InstallationSection() {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  if (detectedPlatform === "Windows") {
    return (
      <FadeIn className="mt-10 pt-8 border-t border-border max-w-2xl">
        <h2 className="text-sm font-medium mb-3">Installation</h2>
        <div className="text-sm text-muted space-y-4">
          <div className="bg-neutral-50 border border-border p-4 space-y-3">
            <p className="font-medium text-foreground">To install:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Download the .msi file</li>
              <li>Double-click to run the installer</li>
              <li>Follow the installation wizard</li>
            </ol>
          </div>
          <p className="text-xs">
            Windows may show a SmartScreen warning. Click &quot;More info&quot; then &quot;Run anyway&quot; to proceed.
          </p>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="mt-10 pt-8 border-t border-border max-w-2xl">
      <h2 className="text-sm font-medium mb-3">Manual Installation</h2>
      <div className="text-sm text-muted space-y-4">
        <p>
          If you downloaded the .pkg file directly, macOS will show a security
          warning because the app is not signed.
        </p>
        <div className="bg-neutral-50 border border-border p-4 space-y-3">
          <p className="font-medium text-foreground">To install:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Download the .pkg file</li>
            <li>Run in Terminal:</li>
          </ol>
          <pre className="bg-white p-3 overflow-x-auto border border-border text-xs">
            xattr -cr ~/Downloads/LMMs-Lab_Writer_*.pkg
          </pre>
          <p className="text-xs">Then double-click to install normally.</p>
        </div>
        <details className="cursor-pointer">
          <summary className="font-medium text-foreground hover:underline">
            Alternative: Right-click method
          </summary>
          <ol className="mt-2 list-decimal list-inside space-y-2 text-sm">
            <li>
              <span className="font-medium">Right-click</span> the .pkg file and
              select <span className="font-medium">Open</span>
            </li>
            <li>
              Click <span className="font-medium">Open</span> in the dialog
            </li>
            <li>Follow the installer</li>
          </ol>
        </details>
      </div>
    </FadeIn>
  );
}

export function RequirementsSection() {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  return (
    <FadeIn className="mt-10 pt-8 border-t border-border max-w-2xl">
      <h2 className="text-sm font-medium mb-3">Requirements</h2>
      <ul className="text-sm text-muted space-y-1">
        <li>
          LaTeX distribution (
          {detectedPlatform === "Windows" ? (
            <>
              <Link
                href="https://miktex.org/"
                className="underline hover:text-foreground transition-colors"
                target="_blank"
              >
                MiKTeX
              </Link>
              {" "}or{" "}
              <Link
                href="https://www.tug.org/texlive/"
                className="underline hover:text-foreground transition-colors"
                target="_blank"
              >
                TeX Live
              </Link>
            </>
          ) : (
            <>
              <Link
                href="https://www.tug.org/mactex/"
                className="underline hover:text-foreground transition-colors"
                target="_blank"
              >
                MacTeX
              </Link>
              {" "}or{" "}
              <Link
                href="https://www.tug.org/texlive/"
                className="underline hover:text-foreground transition-colors"
                target="_blank"
              >
                TeX Live
              </Link>
            </>
          )}
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
        {`git clone https://github.com/EvolvingLMMs-Lab/lmms-lab-writer.git
cd lmms-lab-writer
pnpm install
pnpm tauri:build`}
      </pre>
    </FadeIn>
  );
}

export function InksGate({
  inks,
  requiredInks,
  isLoggedIn,
}: {
  inks: number;
  requiredInks: number;
  isLoggedIn: boolean;
}) {
  const progressPercent = Math.min((inks / requiredInks) * 100, 100);

  return (
    <FadeIn className="max-w-2xl">
      <div className="border-2 border-dashed border-neutral-300 p-8">
        <h2 className="text-xl font-medium mb-2">
          {requiredInks} inks required to download
        </h2>
        <p className="text-sm text-muted mb-6">
          Star top {GITHUB_CONFIG.MAX_ELIGIBLE_REPOS} repos to earn inks. 1 repo
          = {GITHUB_CONFIG.INKS_PER_STAR} inks.
        </p>

        {isLoggedIn && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted">Your inks</span>
              <span className="font-mono">{inks} inks</span>
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
          <p className="text-sm font-medium mb-1">Beta users: Permanent inks</p>
          <p className="text-xs text-muted">
            Inks earned during beta never expire. After public launch, the app
            will be free to download, but premium AI features will consume inks
            daily. Lock in your inks now.
          </p>
        </div>

        {isLoggedIn ? (
          <Link
            href="/profile#earn-inks"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black text-sm font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors"
          >
            Go to Profile to Earn Inks
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
          Star {Math.ceil(requiredInks / GITHUB_CONFIG.INKS_PER_STAR)} repos to
          earn enough inks
        </p>
      </div>
    </FadeIn>
  );
}
