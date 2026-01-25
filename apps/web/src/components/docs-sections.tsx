"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const INSTANT_TRANSITION = { duration: 0 } as const;

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

function useStaggerVariants() {
  const prefersReducedMotion = useReducedMotion();

  return {
    container: {
      hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0 },
      visible: {
        opacity: 1,
        transition: prefersReducedMotion
          ? INSTANT_TRANSITION
          : { staggerChildren: 0.08, delayChildren: 0.1 },
      },
    },
    item: {
      hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: prefersReducedMotion
          ? INSTANT_TRANSITION
          : {
              duration: 0.3,
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

type Section = {
  title: string;
  items: { title: string; href: string }[];
};

export function DocsContent({ sections }: { sections: Section[] }) {
  const prefersReducedMotion = useReducedMotion();
  const fadeIn = useFadeInVariants();
  const stagger = useStaggerVariants();

  return (
    <main className="flex-1 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          className="text-2xl font-medium tracking-tight mb-10"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeIn}
        >
          Documentation
        </motion.h1>

        <motion.div
          className="space-y-10 max-w-2xl"
          initial="hidden"
          animate="visible"
          variants={stagger.container}
        >
          {sections.map((section) => (
            <motion.div key={section.title} variants={stagger.item}>
              <h2 className="text-sm font-medium mb-3">{section.title}</h2>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <motion.li
                    key={item.href}
                    whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                    transition={
                      prefersReducedMotion
                        ? INSTANT_TRANSITION
                        : { type: "spring", stiffness: 400, damping: 25 }
                    }
                  >
                    <Link
                      href={item.href}
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      {item.title}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
