"use client";

import Link from "next/link";
import { Download, FileText, CheckCircle2 } from "lucide-react";
import {
  motion,
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
    overleaf: "Built-in grammar help",
    writer: "OpenCode & More AI Agents",
  },
  {
    feature: "Compilation",
    overleaf: "Their servers",
    writer: "Local (faster, offline)",
  },
  {
    feature: "Git integration",
    overleaf: "Paid plans only",
    writer: "First-class",
  },
  {
    feature: "Offline work",
    overleaf: "Not available",
    writer: "Full support",
  },
  { feature: "Price", overleaf: "$21-42/month", writer: "Free & Very Cheap" },
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
          <img
            src="/logo-light.svg"
            alt="LMMs-Lab Writer — Think Deep, Write Easy."
            className="h-16 md:h-24 w-auto"
          />
        </motion.div>
        <motion.p
          className="text-base md:text-lg text-muted mb-8 md:mb-10 leading-relaxed max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          Stop manually writing LaTeX. Let agents handle the syntax while you
          focus on outlier science.
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
            There's a reason you're still frustrated.
          </h2>
        </FadeIn>

        <FadeIn className="hidden md:block border border-border">
          <div className="grid grid-cols-3 border-b border-border font-mono text-muted text-xs">
            <div className="p-4 border-r border-border uppercase tracking-wider">
              Feature
            </div>
            <div className="p-4 border-r border-border uppercase tracking-wider">
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
                i !== comparisons.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="p-4 border-r border-border font-medium text-muted">
                {row.feature}
              </div>
              <div className="p-4 border-r border-border text-muted">
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
              <MotionCard className="border border-border">
                <div className="px-4 py-3 border-b border-border bg-neutral-50 font-medium text-sm">
                  {row.feature}
                </div>
                <div className="grid grid-cols-2 text-sm">
                  <div className="p-4 border-r border-border">
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
