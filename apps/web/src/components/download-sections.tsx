"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import {
  motion,
  FadeIn,
  FadeInStagger,
  FadeInStaggerItem,
} from "@/components/motion";

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
      { label: "Intel", file: "LMMs-Lab_Writer_0.1.0_x64.dmg" },
    ],
  },
  {
    name: "Windows",
    variants: [
      { label: "64-bit", file: "LMMs-Lab_Writer_0.1.0_x64-setup.exe" },
    ],
  },
  {
    name: "Linux",
    variants: [
      { label: "AppImage", file: "LMMs-Lab_Writer_0.1.0_amd64.AppImage" },
      { label: "Debian", file: "lmms-lab-writer_0.1.0_amd64.deb" },
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
