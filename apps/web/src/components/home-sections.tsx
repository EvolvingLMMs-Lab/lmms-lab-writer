"use client";

import { useState } from "react";
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
  },
  {
    icon: Globe,
    title: "Built for Every Language",
    description:
      "Full Unicode support via XeLaTeX and LuaLaTeX. CJK, Arabic, Cyrillic — all work out of the box with system fonts.",
  },
  {
    icon: GitBranch,
    title: "Git-Native Collaboration",
    description:
      "Stage, commit, diff, push, pull — all from the sidebar. AI-generated commit messages. One-click GitHub publishing.",
  },
  {
    icon: Lock,
    title: "Fully Open Source",
    description:
      "MIT licensed. Your files never leave your machine. No telemetry, no vendor lock-in. Fork it, modify it — it's yours.",
  },
  {
    icon: Monitor,
    title: "Cross-Platform",
    description:
      "Runs natively on macOS and Windows. Built with Tauri for native performance — not an Electron wrapper.",
  },
] as const;

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
          <img
            src="/logo-light.svg"
            alt="LMMs-Lab Writer — Think Deep, Write Easy."
            className="h-16 md:h-24 w-auto"
          />
        </motion.div>
        <motion.p
          className="text-base md:text-lg text-muted mb-3 leading-relaxed max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          Think Deep, Write Easy.
        </motion.p>
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
      </motion.div>
    </section>
  );
}

export function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFeature = features[activeIndex];

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

        {/* Mobile: horizontal scrollable tabs */}
        <div className="md:hidden mb-4 -mx-6 px-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {features.map((feature, i) => (
              <button
                key={feature.title}
                onClick={() => setActiveIndex(i)}
                className={`flex items-center gap-2 px-3 py-2 text-sm border whitespace-nowrap transition-colors ${
                  i === activeIndex
                    ? "border-foreground bg-neutral-50 font-medium"
                    : "border-border text-muted hover:border-foreground"
                }`}
              >
                <feature.icon className="w-3.5 h-3.5" />
                {feature.title}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: detail content */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {"image" in activeFeature && activeFeature.image && (
                <div className="mb-4 border border-border overflow-hidden rounded-sm">
                  <img
                    src={activeFeature.image}
                    alt={activeFeature.title}
                    className="w-full h-auto"
                  />
                </div>
              )}
              <p className="text-sm text-muted leading-relaxed">
                {"detail" in activeFeature && activeFeature.detail
                  ? activeFeature.detail
                  : activeFeature.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop: split layout */}
        <FadeIn>
          <div className="hidden md:flex border border-foreground">
            {/* Left: feature list */}
            <div className="w-2/5 border-r border-foreground shrink-0">
              {features.map((feature, i) => (
                <button
                  key={feature.title}
                  onClick={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-left text-sm transition-colors ${
                    i !== features.length - 1
                      ? "border-b border-foreground"
                      : ""
                  } ${
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
              ))}
            </div>

            {/* Right: detail panel */}
            <div className="w-3/5 p-6 flex flex-col justify-center min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {"image" in activeFeature && activeFeature.image && (
                    <div className="mb-5 border border-border overflow-hidden rounded-sm">
                      <img
                        src={activeFeature.image}
                        alt={activeFeature.title}
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  <p className="text-sm text-muted leading-relaxed">
                    {"detail" in activeFeature && activeFeature.detail
                      ? activeFeature.detail
                      : activeFeature.description}
                  </p>
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
