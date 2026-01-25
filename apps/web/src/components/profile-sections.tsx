"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

const INSTANT_TRANSITION = { duration: 0 } as const;

const GPU_SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

function useFadeInVariants() {
  const prefersReducedMotion = useReducedMotion();

  return {
    hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? INSTANT_TRANSITION
        : {
            duration: 0.4,
            delay,
            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
          },
    }),
  };
}

export function ProfileCard({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const fadeIn = useFadeInVariants();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      custom={delay}
      variants={fadeIn}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={prefersReducedMotion ? INSTANT_TRANSITION : GPU_SPRING}
      style={prefersReducedMotion ? undefined : { willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}

export function ProfileSection({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const fadeIn = useFadeInVariants();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      custom={delay}
      variants={fadeIn}
    >
      {children}
    </motion.div>
  );
}

export function ProfileTitle({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const fadeIn = useFadeInVariants();

  return (
    <motion.h1
      className="text-2xl font-light tracking-tight mb-8"
      initial="hidden"
      animate="visible"
      custom={delay}
      variants={fadeIn}
    >
      {children}
    </motion.h1>
  );
}

function useStaggerVariants() {
  const prefersReducedMotion = useReducedMotion();

  return {
    container: {
      hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0 },
      visible: {
        opacity: 1,
        transition: prefersReducedMotion
          ? INSTANT_TRANSITION
          : { staggerChildren: 0.05, delayChildren: 0.2 },
      },
    },
    item: {
      hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
      visible: {
        opacity: 1,
        y: 0,
        transition: prefersReducedMotion
          ? INSTANT_TRANSITION
          : {
              duration: 0.25,
              ease: [0.25, 0.46, 0.45, 0.94] as [
                number,
                number,
                number,
                number,
              ],
            },
      },
    },
  };
}

export function RepoList({ children }: { children: ReactNode }) {
  const { container } = useStaggerVariants();

  return (
    <motion.div
      className="space-y-2 mb-8 max-h-[400px] overflow-y-auto pr-2"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      {children}
    </motion.div>
  );
}

export function RepoItem({
  children,
  isStarred,
}: {
  children: ReactNode;
  isStarred: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { item } = useStaggerVariants();

  return (
    <motion.div
      className={`flex items-center justify-between p-4 border transition-colors ${
        isStarred
          ? "border-black bg-neutral-50"
          : "border-neutral-200 hover:border-neutral-400"
      }`}
      variants={item}
      whileHover={
        prefersReducedMotion ? undefined : { x: 2, transition: GPU_SPRING }
      }
      style={prefersReducedMotion ? undefined : { willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}
