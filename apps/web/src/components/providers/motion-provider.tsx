"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * LazyMotion provider to reduce framer-motion bundle size from ~34kb to ~5kb.
 * Wraps the app to provide animation features on-demand.
 *
 * - domAnimation: includes animations, variants, exit, tap/hover/focus (~15kb)
 * - domMax: adds drag, pan, layout animations (~25kb) - use only if needed
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
