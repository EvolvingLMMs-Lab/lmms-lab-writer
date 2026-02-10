"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { DEFAULT_LOCALE, withLocalePrefix, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/messages";

const GPU_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.5,
} as const;

const FEATURE_VISUALS = [
  {
    icon: Sparkles,
    image: "/features/interaction.png",
  },
  {
    icon: Zap,
    image: "/features/latex.png",
  },
  {
    icon: Globe,
    image: "/features/compile-cn.png",
  },
  {
    icon: GitBranch,
    image: "/features/git-support.png",
  },
  {
    icon: Lock,
    image: "/features/github.png",
  },
  {
    icon: Monitor,
    image: "/features/cross-platform.png",
  },
];

export function HeroSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale);

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
            alt={messages.home.heroImageAlt}
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
          {messages.home.heroDescription}
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
              href={withLocalePrefix("/download", locale)}
              prefetch={true}
              className="btn btn-primary w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              {messages.home.downloadCta}
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
              href={withLocalePrefix("/docs", locale)}
              prefetch={true}
              className="btn btn-secondary w-full sm:w-auto"
            >
              <FileText className="w-4 h-4" />
              {messages.home.documentationCta}
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
            alt={messages.home.heroImageAlt}
            className="w-full h-auto"
            priority
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

const AUTO_PLAY_MS = 5000; // cycle every 5s

export function FeaturesSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale);
  const features = useMemo(
    () =>
      messages.home.features.map((feature, index) => {
        const visual = FEATURE_VISUALS[index] ?? FEATURE_VISUALS[0]!;
        return {
          ...feature,
          icon: visual.icon,
          image: visual.image,
        };
      }),
    [messages.home.features],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFeature = features[activeIndex] ?? features[0]!;
  const pausedUntil = useRef(0);

  // Auto-cycle through features when not paused
  useEffect(() => {
    if (features.length === 0) return;

    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setActiveIndex((prev: number) =>
        prev < 0 ? prev : (prev + 1) % features.length,
      );
    }, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [features.length]);

  const handleSelect = useCallback((i: number) => {
    // Pause auto-play for 12s after user interaction
    pausedUntil.current = Date.now() + 12000;
    setActiveIndex(i);
  }, []);

  return (
    <section className="py-12 md:py-20 px-6 border-t border-border">
      <div className="max-w-[clamp(64rem,65vw,85rem)] mx-auto">
        <FadeIn>
          <h2 className="text-2xl font-medium mb-2 text-center">
            {messages.home.featuresTitle}
          </h2>
          <p className="text-sm text-muted mb-8 md:mb-12 text-center max-w-xl mx-auto">
            {messages.home.featuresSubtitle}
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
                          {messages.home.tapToZoom}
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
            <div className="w-[38%] border-r border-foreground shrink-0 flex flex-col">
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
            <div className="w-[62%] bg-neutral-50 flex items-stretch justify-center p-3 min-h-[max(400px,35vh)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center w-full h-full"
                >
                  {"image" in activeFeature && activeFeature.image ? (
                    <LightboxImage
                      src={activeFeature.image}
                      alt={activeFeature.title}
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="w-full h-full object-contain rounded-sm border border-border shadow-sm"
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

export function VideoSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale);

  return (
    <section className="py-12 md:py-20 px-6 border-t border-border">
      <FadeIn className="max-w-5xl mx-auto">
        <h2 className="text-xl md:text-2xl font-medium mb-4 text-center">
          {messages.home.videoTitle}
        </h2>
        <p className="text-base md:text-lg text-muted mb-8 md:mb-10 text-center">
          {messages.home.videoSubtitle}
        </p>
        <div className="relative w-full overflow-hidden rounded-sm border border-border shadow-lg" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/KIj7kfkVvSs?si=br2z2qsQ2p7JlIj9"
            title="LMMs-Lab Writer Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </FadeIn>
    </section>
  );
}

export function DemoSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale);

  return (
    <section className="py-12 md:py-20 px-6 border-t border-border">
      <FadeIn className="max-w-5xl mx-auto">
        <h2 className="text-xl md:text-2xl font-medium mb-4 text-center">
          {messages.home.demoTitle}
        </h2>
        <p className="text-base md:text-lg text-muted mb-8 md:mb-10 text-center">
          {messages.home.demoSubtitle}
        </p>
        <PaperDemo />
      </FadeIn>
    </section>
  );
}

export function ComparisonSection({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const messages = getMessages(locale);
  const comparisonColumns = messages.home.comparisonColumns;

  return (
    <section className="py-12 md:py-20 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <h2 className="text-2xl font-medium mb-8 md:mb-10 text-center">
            {messages.home.comparisonTitle}
          </h2>
        </FadeIn>

        <FadeIn className="hidden md:block border border-foreground">
          <div className="grid grid-cols-3 border-b border-foreground font-mono text-muted text-xs">
            <div className="p-4 border-r border-foreground uppercase tracking-wider">
              {comparisonColumns.feature}
            </div>
            <div className="p-4 border-r border-foreground uppercase tracking-wider">
              {comparisonColumns.overleaf}
            </div>
            <div className="p-4 bg-neutral-50 text-foreground tracking-tight font-medium text-sm">
              {comparisonColumns.writer}
            </div>
          </div>
          {messages.home.comparisons.map((row, i) => (
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
                i !== messages.home.comparisons.length - 1
                  ? "border-b border-foreground"
                  : ""
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
          {messages.home.comparisons.map((row) => (
            <FadeInStaggerItem key={row.feature}>
              <MotionCard className="border border-foreground">
                <div className="px-4 py-3 border-b border-foreground bg-neutral-50 font-medium text-sm">
                  {row.feature}
                </div>
                <div className="grid grid-cols-2 text-sm">
                  <div className="p-4 border-r border-foreground">
                    <div className="text-xs text-muted uppercase tracking-wider mb-1">
                      {comparisonColumns.overleaf}
                    </div>
                    <div className="text-muted">{row.overleaf}</div>
                  </div>
                  <div className="p-4 bg-neutral-50">
                    <div className="text-xs text-muted uppercase tracking-wider mb-1">
                      {comparisonColumns.writer}
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
