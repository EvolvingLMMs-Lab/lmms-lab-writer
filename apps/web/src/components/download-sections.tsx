"use client";

import Link from "next/link";
import {
  Download,
  Apple,
  Monitor,
  ChevronDown,
  ShieldCheck,
  Eye,
  Scaling,
  TerminalSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, FadeIn } from "@/components/motion";
import { GITHUB_CONFIG } from "@/lib/github/config";
import { DEFAULT_LOCALE, interpolate, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/messages";

const GPU_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.5,
} as const;

const BLOB_URL = "https://uv96nthsmy3qxwco.public.blob.vercel-storage.com";
export const RELEASE_VERSION = "0.1.0";

const macPkgFile = `LMMs-Lab_Writer_${RELEASE_VERSION}_aarch64.pkg`;
const macDmgFile = `LMMs-Lab Writer_${RELEASE_VERSION}_aarch64.dmg`;
const windowsExeFile = `LMMs-Lab Writer_${RELEASE_VERSION}_x64-setup.exe`;
const windowsMsiFile = `LMMs-Lab Writer_${RELEASE_VERSION}_x64_en-US.msi`;
const npmTarballFile = `lmms-lab-writer-shared-${RELEASE_VERSION}.tgz`;

function blobUrl(filename: string): string {
  return `${BLOB_URL}/${encodeURIComponent(filename)}`;
}

type Platform = "macOS" | "Windows" | "Linux" | "unknown";

const platforms = {
  macOS: {
    name: "macOS",
    icon: Apple,
    variants: [
      {
        label: "DMG Bundle",
        sublabel: "Apple Silicon (M1/M2/M3/M4)",
        file: macDmgFile,
        url: blobUrl(macDmgFile),
      },
      {
        label: "PKG Installer",
        sublabel: "Apple Silicon (M1/M2/M3/M4)",
        file: macPkgFile,
        url: blobUrl(macPkgFile),
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
        file: windowsExeFile,
        url: blobUrl(windowsExeFile),
      },
      {
        label: "Windows MSI",
        sublabel: "64-bit (msi)",
        file: windowsMsiFile,
        url: blobUrl(windowsMsiFile),
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

export function InstallationPolicySection({
  locale = DEFAULT_LOCALE,
}: {
  locale?: Locale;
}) {
  const messages = getMessages(locale).download;

  return (
    <FadeIn className="max-w-2xl mb-10">
      <div className="border-2 border-black bg-white shadow-[6px_6px_0_0_#000]">
        <div className="px-4 py-2 border-b-2 border-black bg-black text-white text-xs font-mono uppercase tracking-wider">
          {messages.installNoticeBadge}
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-medium leading-tight">
            {messages.installNoticeTitle}
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            {messages.installNoticeIntro}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-black bg-neutral-50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <TerminalSquare className="w-4 h-4" />
                <h3 className="text-xs font-medium uppercase tracking-wide">
                  {messages.installNoticeSudoTitle}
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {messages.installNoticeSudoBody}
              </p>
            </div>

            <div className="border border-black bg-neutral-50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Eye className="w-4 h-4" />
                <h3 className="text-xs font-medium uppercase tracking-wide">
                  {messages.installNoticeOpenSourceTitle}
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {messages.installNoticeOpenSourceBody}
              </p>
            </div>

            <div className="border border-black bg-neutral-50 p-3 sm:col-span-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Scaling className="w-4 h-4" />
                <h3 className="text-xs font-medium uppercase tracking-wide">
                  {messages.installNoticeIndependenceTitle}
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {messages.installNoticeIndependenceBody}
              </p>
            </div>
          </div>

          <div className="border border-[#ff5500] bg-[#fff4ec] p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-[#ff5500]" />
              <h3 className="text-xs font-medium uppercase tracking-wide">
                {messages.installOrderLabel}
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-foreground">
              <span className="font-medium">{messages.installOrderPrimary}</span>
              {"  >  "}
              <span>{messages.installOrderSecondary}</span>
              {"  >  "}
              <span>{messages.installOrderTertiary}</span>
            </p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

export function DownloadSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale).download;
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>("unknown");
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  const recommendedPlatform =
    detectedPlatform === "macOS" || detectedPlatform === "Windows"
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
              ? messages.recommendedForSystem
              : messages.genericDownload}
          </h2>
          {detectedPlatform !== "unknown" && detectedPlatform !== "Linux" && (
            <span className="text-xs px-2 py-0.5 bg-black text-white">
              {interpolate(messages.platformDetected, { platform: detectedPlatform })}
            </span>
          )}
        </div>

        <div className="space-y-4">
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
      </div>

      {/* Other Platforms */}
      <div>
        <button
          onClick={() => setShowAllPlatforms(!showAllPlatforms)}
          className="flex items-center gap-2 text-sm text-muted hover:text-black transition-colors mb-4"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showAllPlatforms ? "rotate-180" : ""}`}
          />
          {messages.otherPlatforms}
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

export function HomebrewSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale).download;
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
        {messages.installViaHomebrew}{" "}
        <span className="text-xs font-normal text-muted">({messages.recommendedTag})</span>
      </h2>
      <pre className="text-sm text-muted bg-neutral-50 p-4 overflow-x-auto border border-border">
        {`brew tap EvolvingLMMs-Lab/tap
brew install --cask lmms-lab-writer`}
      </pre>
      <p className="text-xs text-muted mt-2">
        {messages.homebrewNote}
      </p>
    </FadeIn>
  );
}

export function NpmPackageSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale).download;
  const packageUrl = blobUrl(npmTarballFile);

  return (
    <FadeIn className="mt-10 pt-8 border-t border-border max-w-2xl">
      <h2 className="text-sm font-medium mb-3">{messages.npmPackage}</h2>
      <div className="text-sm text-muted space-y-4">
        <p>
          {messages.latestTarball} <code className="bg-neutral-100 px-1">@lmms-lab/writer-shared</code>:
        </p>
        <Link
          href={packageUrl}
          className="flex items-center justify-between gap-3 p-3 border border-border hover:border-black transition-colors"
        >
          <span className="text-sm font-medium text-foreground">{npmTarballFile}</span>
          <Download className="w-4 h-4 text-muted" />
        </Link>
        <pre className="text-xs text-muted bg-neutral-50 p-3 overflow-x-auto border border-border">
          {`npm install ${packageUrl}`}
        </pre>
      </div>
    </FadeIn>
  );
}

export function InstallationSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale).download;
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  if (detectedPlatform === "Windows") {
    return (
      <FadeIn className="mt-10 pt-8 border-t border-border max-w-2xl">
        <h2 className="text-sm font-medium mb-3">{messages.installation}</h2>
        <div className="text-sm text-muted space-y-4">
          <div className="bg-neutral-50 border border-border p-4 space-y-3">
            <p className="font-medium text-foreground">{messages.windowsInstallIntro}</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>{messages.windowsStep1}</li>
              <li>{messages.windowsStep2}</li>
              <li>{messages.windowsStep3}</li>
            </ol>
          </div>
          <p className="text-xs">{messages.windowsWarning}</p>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="mt-10 pt-8 border-t border-border max-w-2xl">
      <h2 className="text-sm font-medium mb-3">{messages.manualInstallation}</h2>
      <div className="text-sm text-muted space-y-4">
        <p>{messages.notNotarized}</p>
        <div className="bg-neutral-50 border border-border p-4 space-y-3">
          <p className="font-medium text-foreground">{messages.installFromDmg}</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>{messages.dmgStep1}</li>
            <li>{messages.dmgStep2}</li>
          </ol>
          <pre className="bg-white p-3 overflow-x-auto border border-border text-xs">
            {`xattr -cr ~/Downloads/LMMs-Lab\\ Writer_*.dmg
hdiutil attach ~/Downloads/LMMs-Lab\\ Writer_*.dmg
cp -R "/Volumes/LMMs-Lab Writer/LMMs-Lab Writer.app" /Applications/
xattr -cr "/Applications/LMMs-Lab Writer.app"
hdiutil detach "/Volumes/LMMs-Lab Writer"`}
          </pre>
        </div>
        <div className="bg-neutral-50 border border-border p-4 space-y-3">
          <p className="font-medium text-foreground">{messages.installFromPkg}</p>
          <pre className="bg-white p-3 overflow-x-auto border border-border text-xs">
            {`xattr -cr ~/Downloads/LMMs-Lab_Writer_*.pkg
sudo installer -pkg ~/Downloads/LMMs-Lab_Writer_*.pkg -target / -allowUntrusted`}
          </pre>
          <p className="text-xs">
            <code className="bg-neutral-100 px-1">-allowUntrusted</code> {messages.pkgUntrustedNote}
          </p>
        </div>
        <details className="cursor-pointer">
          <summary className="font-medium text-foreground hover:underline">
            {messages.alternativeMethod}
          </summary>
          <ol className="mt-2 list-decimal list-inside space-y-2 text-sm">
            <li>
              <span className="font-medium">{messages.altStep1Prefix}</span>{" "}
              {messages.altStep1Action} <span className="font-medium">{messages.altStep1Open}</span>
            </li>
            <li>{messages.altStep2}</li>
            <li>{messages.altStep3}</li>
          </ol>
        </details>
      </div>
    </FadeIn>
  );
}

export function RequirementsSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale).download;
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  return (
    <FadeIn className="mt-10 pt-8 border-t border-border max-w-2xl">
      <h2 className="text-sm font-medium mb-3">{messages.requirements}</h2>
      <ul className="text-sm text-muted space-y-1">
        <li>
          {messages.latexDistribution} (
          {detectedPlatform === "Windows" ? (
            <>
              <Link
                href="https://yihui.org/tinytex/"
                className="underline hover:text-foreground transition-colors"
                target="_blank"
              >
                TinyTeX
              </Link>
              ,{" "}
              <Link
                href="https://miktex.org/"
                className="underline hover:text-foreground transition-colors"
                target="_blank"
              >
                MiKTeX
              </Link>
              , or{" "}
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
                href="https://yihui.org/tinytex/"
                className="underline hover:text-foreground transition-colors"
                target="_blank"
              >
                TinyTeX
              </Link>
              ,{" "}
              <Link
                href="https://www.tug.org/mactex/"
                className="underline hover:text-foreground transition-colors"
                target="_blank"
              >
                MacTeX
              </Link>
              , or{" "}
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
        <li>{messages.gitOptional}</li>
      </ul>
    </FadeIn>
  );
}

export function BuildSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale).download;

  return (
    <FadeIn className="mt-10 pt-8 border-t border-border max-w-2xl">
      <h2 className="text-sm font-medium mb-3">{messages.buildFromSource}</h2>
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
  locale = DEFAULT_LOCALE,
}: {
  inks: number;
  requiredInks: number;
  isLoggedIn: boolean;
  locale?: Locale;
}) {
  const messages = getMessages(locale).download;
  const progressPercent = Math.min((inks / requiredInks) * 100, 100);

  return (
    <FadeIn className="max-w-2xl">
      <div className="border-2 border-dashed border-neutral-300 p-8">
        <h2 className="text-xl font-medium mb-2">
          {interpolate(messages.inksGateTitle, { requiredInks })}
        </h2>
        <p className="text-sm text-muted mb-6">
          {interpolate(messages.inksGateDescription, {
            maxRepos: GITHUB_CONFIG.MAX_ELIGIBLE_REPOS,
            inksPerStar: GITHUB_CONFIG.INKS_PER_STAR,
          })}
        </p>

        {isLoggedIn && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted">{messages.yourInks}</span>
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
          <p className="text-sm font-medium mb-1">{messages.betaUsersTitle}</p>
          <p className="text-xs text-muted">{messages.betaUsersDescription}</p>
        </div>

        {isLoggedIn ? (
          <Link
            href="/profile#earn-inks"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black text-sm font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors"
          >
            {messages.goToProfile}
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black text-sm font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors"
          >
            {messages.signInToGetStarted}
          </Link>
        )}

        <p className="text-xs text-muted mt-4">
          {interpolate(messages.starEnoughInks, {
            repoCount: Math.ceil(requiredInks / GITHUB_CONFIG.INKS_PER_STAR),
          })}
        </p>
      </div>
    </FadeIn>
  );
}
