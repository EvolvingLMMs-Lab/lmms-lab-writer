"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  FileText,
  CheckCircle2,
  Zap,
  Globe,
  GitBranch,
  Sparkles,
  Lock,
  Monitor,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  FadeIn,
  FadeInStagger,
  FadeInStaggerItem,
  MotionCard,
} from "@/components/motion";
import { PaperDemo } from "@/components/paper-demo";
import { LightboxImage } from "@/components/lightbox";

const GPU_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.5,
} as const;

const comparisons = [
  {
    feature: "File storage",
    overleaf: "Cloud only",
    writer: "Local (your machine)",
  },
  {
    feature: "AI editing",
    overleaf: "Basic grammar",
    writer: "OpenCode + any AI agent",
  },
  {
    feature: "Non-English",
    overleaf: "Limited CJK support",
    writer: "Full Unicode, XeLaTeX, system fonts",
  },
  {
    feature: "LaTeX setup",
    overleaf: "Pre-configured",
    writer: "One-click install, agent-managed",
  },
  {
    feature: "Git integration",
    overleaf: "Paid plans only",
    writer: "Free, built into sidebar",
  },
  {
    feature: "Offline work",
    overleaf: "Not available",
    writer: "Full support",
  },
  {
    feature: "Compilation",
    overleaf: "Cloud queue",
    writer: "Local, instant",
  },
  {
    feature: "Open source",
    overleaf: "No",
    writer: "MIT license",
  },
  { feature: "Price", overleaf: "$21-42/month", writer: "Free" },
];

const features = [
  {
    icon: Sparkles,
    title: "OpenCode AI Integration",
    description:
      "Built-in AI panel that reads your entire project. Chat, attach files, switch models. Also works with Claude Code, Cursor, and Codex.",
    detail:
      "Chat with AI to create LaTeX documents from scratch. The AI understands your entire project context — attach files, switch between models, and get intelligent suggestions tailored to your writing. From Beamer presentations to research papers, describe what you need and let the AI handle the LaTeX.",
    image: "/features/interaction.png",
  },
  {
    icon: Zap,
    title: "One-Click LaTeX Setup",
    description:
      "Auto-detects and installs a minimal LaTeX distribution. Missing packages install automatically during compilation. Zero configuration.",
    detail:
      "No more hour-long TeX Live installations. LMMs-Lab Writer auto-detects and installs a minimal LaTeX distribution for you — TinyTeX, MiKTeX, or TeX Live. If a package is missing during compilation, it gets installed automatically. Zero manual configuration — just open the app and start writing.",
    image: "/features/latex.png",
  },
  {
    icon: Globe,
    title: "Built for Every Language",
    description:
      "Full Unicode support via XeLaTeX and LuaLaTeX. CJK, Arabic, Cyrillic — all work out of the box with system fonts.",
    detail:
      "Write in any language without extra configuration. XeLaTeX and LuaLaTeX provide full Unicode support out of the box — Chinese, Japanese, Korean, Arabic, Cyrillic, and more. Missing font packages are installed automatically during compilation.",
    image: "/features/compile-cn.png",
  },
  {
    icon: GitBranch,
    title: "Git-Native Collaboration",
    description:
      "Stage, commit, diff, push, pull — all from the sidebar. AI-generated commit messages. One-click GitHub publishing.",
    detail:
      "AI writes your commit messages so you can focus on writing, not documenting changes. Publish your project to GitHub with a single click. A clear diff view lets you see exactly what changed — no terminal needed.",
    image: "/features/git-support.png",
  },
  {
    icon: Lock,
    title: "Fully Open Source",
    description:
      "MIT licensed. Your files never leave your machine. No telemetry, no vendor lock-in. Fork it, modify it — it's yours.",
    detail:
      "Fully MIT licensed and hosted on GitHub. Your files never leave your machine — no telemetry, no vendor lock-in. Fork it, modify it, contribute back — it's yours.",
    image: "/features/github.png",
  },
  {
    icon: Monitor,
    title: "Cross-Platform",
    description:
      "Runs natively on macOS and Windows. Built with Tauri for native performance — not an Electron wrapper.",
    detail:
      "Runs natively on macOS and Windows with Tauri — true native performance, not an Electron wrapper. Same seamless experience on every platform.",
    image: "/features/cross-platform.png",
  },
];

export function HeroSection() {
  return (
    <section className="py-16 md:py-24 px-6 bg-cream">
      <motion.div
        className="max-w-5xl mx-auto text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div
          className="mb-6 flex justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <Image
            src="/logo-light.svg"
            alt="LMMs-Lab Writer — Think Deep, Write Easy."
            width={320}
            height={128}
            priority
            className="h-20 md:h-32 w-auto"
          />
        </motion.div>
        <motion.p
          className="text-sm text-muted mb-8 md:mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.25,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          The AI-native LaTeX editor. One-click setup, every language, Git
          built-in, fully open source.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={GPU_SPRING}
            style={{ willChange: "transform" }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/download"
              prefetch={true}
              className="btn btn-primary w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Download
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={GPU_SPRING}
            style={{ willChange: "transform" }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/docs"
              prefetch={true}
              className="btn btn-secondary w-full sm:w-auto"
            >
              <FileText className="w-4 h-4" />
              Documentation
            </Link>
          </motion.div>
        </motion.div>
        <motion.div
          className="mt-10 md:mt-14 border border-border rounded-sm overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.45,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <LightboxImage
            src="/features/demo.webp"
            alt="LMMs-Lab Writer — AI-native LaTeX editor"
            className="w-full h-auto"
            priority
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

const AUTO_PLAY_MS = 5000; // cycle every 5s

export function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFeature = features[activeIndex] ?? features[0]!;
  const pausedUntil = useRef(0);

  // Auto-cycle through features when not paused
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setActiveIndex((prev: number) => prev < 0 ? prev : (prev + 1) % features.length);
    }, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, []);

  const handleSelect = useCallback((i: number) => {
    // Pause auto-play for 12s after user interaction
    pausedUntil.current = Date.now() + 12000;
    setActiveIndex(i);
  }, []);

  return (
    <section className="py-12 md:py-20 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <h2 className="text-2xl font-medium mb-2 text-center">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-sm text-muted mb-8 md:mb-12 text-center max-w-xl mx-auto">
            Built for researchers who&apos;d rather focus on ideas than LaTeX
            boilerplate.
          </p>
        </FadeIn>

        {/* Mobile: accordion */}
        <div className="md:hidden border border-foreground">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={i !== features.length - 1 ? "border-b border-foreground" : ""}
            >
              <button
                onClick={() => handleSelect(activeIndex === i ? -1 : i)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-neutral-50 font-medium"
                    : "text-muted"
                }`}
              >
                <div
                  className={`w-7 h-7 border flex items-center justify-center shrink-0 ${
                    i === activeIndex
                      ? "border-foreground bg-white"
                      : "border-border"
                  }`}
                >
                  <feature.icon className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1">{feature.title}</span>
                <motion.span
                  animate={{ rotate: i === activeIndex ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted text-xs"
                >
                  &#9660;
                </motion.span>
              </button>
              <AnimatePresence>
                {i === activeIndex && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    {"image" in feature && feature.image && (
                      <div className="bg-neutral-100 border-y border-border">
                        <LightboxImage
                          src={feature.image}
                          alt={feature.title}
                          className="w-full h-auto"
                        />
                        <p className="text-xs text-muted text-center py-1.5">
                          Tap to zoom
                        </p>
                      </div>
                    )}
                    <p className="px-4 py-3 text-xs text-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Desktop: split layout */}
        <FadeIn>
          <div className="hidden md:flex border border-foreground">
            {/* Left: feature list + description */}
            <div className="w-2/5 border-r border-foreground shrink-0 flex flex-col">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`relative ${
                    i !== features.length - 1
                      ? "border-b border-foreground"
                      : ""
                  }`}
                >
                  {/* Progress bar on the left edge */}
                  {i === activeIndex && (
                    <div
                      key={`progress-${activeIndex}`}
                      className="feature-progress absolute left-0 top-0 w-[3px] h-full bg-foreground"
                      style={{ "--progress-duration": `${AUTO_PLAY_MS}ms` } as React.CSSProperties}
                    />
                  )}
                  <button
                    onClick={() => handleSelect(i)}
                    className={`w-full flex items-center gap-3 px-5 py-4 text-left text-sm transition-colors ${
                      i === activeIndex
                        ? "bg-neutral-50 font-medium"
                        : "text-muted hover:bg-neutral-50/50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 border flex items-center justify-center shrink-0 ${
                        i === activeIndex
                          ? "border-foreground bg-white"
                          : "border-border"
                      }`}
                    >
                      <feature.icon className="w-4 h-4" />
                    </div>
                    {feature.title}
                  </button>
                  <AnimatePresence>
                    {i === activeIndex && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-xs text-muted leading-relaxed">
                          {feature.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Right: image / visual panel */}
            <div className="w-3/5 bg-neutral-50 flex items-center justify-center p-6 min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  {"image" in activeFeature && activeFeature.image ? (
                    <LightboxImage
                      src={activeFeature.image}
                      alt={activeFeature.title}
                      className="max-h-[360px] w-auto max-w-full object-contain rounded-sm border border-border shadow-sm"
                    />
                  ) : (
                    <div className="text-center px-8">
                      <activeFeature.icon className="w-10 h-10 mx-auto mb-4 text-muted" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function DemoSection() {
  return (
    <section className="py-12 md:py-20 px-6 border-t border-border">
      <FadeIn className="max-w-5xl mx-auto">
        <h2 className="text-xl md:text-2xl font-medium mb-4 text-center">
          See it in action.
        </h2>
        <p className="text-base md:text-lg text-muted mb-8 md:mb-10 text-center">
          Every legendary paper started somewhere. Yours starts here.
        </p>
        <PaperDemo />
      </FadeIn>
    </section>
  );
}

export function ComparisonSection() {
  return (
    <section className="py-12 md:py-20 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <h2 className="text-2xl font-medium mb-8 md:mb-10 text-center">
            There&apos;s a reason you&apos;re still frustrated.
          </h2>
        </FadeIn>

        <FadeIn className="hidden md:block border border-foreground">
          <div className="grid grid-cols-3 border-b border-foreground font-mono text-muted text-xs">
            <div className="p-4 border-r border-foreground uppercase tracking-wider">
              Feature
            </div>
            <div className="p-4 border-r border-foreground uppercase tracking-wider">
              Overleaf
            </div>
            <div className="p-4 bg-neutral-50 text-foreground tracking-tight font-medium text-sm">
              LMMs-Lab Writer
            </div>
          </div>
          {comparisons.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.3,
                delay: i * 0.05,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className={`grid grid-cols-3 text-sm ${
                i !== comparisons.length - 1 ? "border-b border-foreground" : ""
              }`}
            >
              <div className="p-4 border-r border-foreground font-medium text-muted">
                {row.feature}
              </div>
              <div className="p-4 border-r border-foreground text-muted">
                {row.overleaf}
              </div>
              <div className="p-4 flex items-start gap-2 bg-neutral-50 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-foreground mt-0.5" />
                {row.writer}
              </div>
            </motion.div>
          ))}
        </FadeIn>

        <FadeInStagger className="md:hidden space-y-4" staggerDelay={0.08}>
          {comparisons.map((row) => (
            <FadeInStaggerItem key={row.feature}>
              <MotionCard className="border border-foreground">
                <div className="px-4 py-3 border-b border-foreground bg-neutral-50 font-medium text-sm">
                  {row.feature}
                </div>
                <div className="grid grid-cols-2 text-sm">
                  <div className="p-4 border-r border-foreground">
                    <div className="text-xs text-muted uppercase tracking-wider mb-1">
                      Overleaf
                    </div>
                    <div className="text-muted">{row.overleaf}</div>
                  </div>
                  <div className="p-4 bg-neutral-50">
                    <div className="text-xs text-muted uppercase tracking-wider mb-1">
                      Writer
                    </div>
                    <div className="flex items-start gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-foreground mt-0.5" />
                      {row.writer}
                    </div>
                  </div>
                </div>
              </MotionCard>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}

export function FooterLink() {
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={GPU_SPRING}
      style={{ display: "inline-block", willChange: "transform" }}
    >
      <Link
        href="https://www.lmms-lab.com/"
        className="hover:text-foreground transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        LMMs-Lab
      </Link>
    </motion.span>
  );
}
