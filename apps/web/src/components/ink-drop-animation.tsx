"use client";

import { useEffect, useState, useCallback } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";

const STORAGE_KEY = "hasSeenInkExplanation";

interface InkDropAnimationProps {
  triggerOnInks?: boolean;
  inks: number;
}

export function InkDropAnimation({
  triggerOnInks = true,
  inks,
}: InkDropAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!triggerOnInks || inks <= 0) return;

    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (hasSeen) return;

    setIsVisible(true);

    const timer = setTimeout(() => {
      dismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [triggerOnInks, inks]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={dismiss}
        >
          <m.div
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }
            }
            animate={{ opacity: 1, scale: 1 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 300, damping: 25 }
            }
            className="relative max-w-sm mx-4 p-8 bg-white border-2 border-black text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <m.div
              initial={prefersReducedMotion ? {} : { y: -20 }}
              animate={prefersReducedMotion ? {} : { y: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 200, damping: 15, delay: 0.2 }
              }
              className="mb-6"
            >
              <svg
                className="w-16 h-16 mx-auto"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ imageRendering: "pixelated" }}
              >
                <m.g
                  initial={
                    prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.5, ease: "easeOut", delay: 0.3 }
                  }
                >
                  <rect x="7" y="1" width="2" height="1" fill="black" />
                  <rect x="6" y="2" width="4" height="1" fill="black" />
                  <rect x="5" y="3" width="6" height="1" fill="black" />
                  <rect x="4" y="4" width="8" height="1" fill="black" />
                  <rect x="4" y="5" width="8" height="1" fill="black" />
                  <rect x="3" y="6" width="10" height="1" fill="black" />
                  <rect x="3" y="7" width="10" height="1" fill="black" />
                  <rect x="2" y="8" width="12" height="1" fill="black" />
                  <rect x="2" y="9" width="12" height="1" fill="black" />
                  <rect x="2" y="10" width="12" height="1" fill="black" />
                  <rect x="3" y="11" width="10" height="1" fill="black" />
                  <rect x="3" y="12" width="10" height="1" fill="black" />
                  <rect x="4" y="13" width="8" height="1" fill="black" />
                  <rect x="5" y="14" width="6" height="1" fill="black" />
                </m.g>
                <m.rect
                  x="5"
                  y="7"
                  width="2"
                  height="3"
                  fill="white"
                  fillOpacity="0.4"
                  initial={prefersReducedMotion ? {} : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.4, delay: 0.8 }
                  }
                />
              </svg>
            </m.div>

            {!prefersReducedMotion && (
              <m.div
                className="absolute left-1/2 top-[100px] -translate-x-1/2 w-12 h-3 bg-black/10 rounded-full"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
                transition={{
                  duration: 1,
                  delay: 0.5,
                  repeat: 2,
                  repeatDelay: 0.5,
                }}
              />
            )}

            <m.h2
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.4, delay: 0.6 }
              }
              className="text-xl font-medium mb-2"
            >
              You earned your first ink!
            </m.h2>

            <m.p
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.4, delay: 0.8 }
              }
              className="text-sm text-muted mb-6"
            >
              Ink fuels your writing. Earn more by starring repos, then use inks
              to unlock the editor and AI features.
            </m.p>

            <m.p
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.4, delay: 1 }
              }
              className="text-3xl font-light tabular-nums mb-4"
            >
              {inks}
              <span className="text-sm text-muted font-normal ml-2">inks</span>
            </m.p>

            <m.button
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.4, delay: 1.2 }
              }
              onClick={dismiss}
              className="px-6 py-2 border-2 border-black text-sm font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Got it
            </m.button>

            <m.p
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.4, delay: 1.4 }
              }
              className="text-xs text-muted mt-4"
            >
              Click anywhere to dismiss
            </m.p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function useHasSeenInkExplanation(): boolean {
  const [hasSeen, setHasSeen] = useState(true);

  useEffect(() => {
    setHasSeen(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  return hasSeen;
}

export function resetInkExplanation(): void {
  localStorage.removeItem(STORAGE_KEY);
}
