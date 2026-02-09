"use client";

import {
  m,
  AnimatePresence,
  useReducedMotion,
  type Variants,
  type HTMLMotionProps,
} from "framer-motion";
import Link from "next/link";
import { forwardRef, type ComponentProps } from "react";

const GPU_TRANSITION = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.5,
} as const;

const FADE_TRANSITION = {
  duration: 0.2,
  ease: [0.25, 0.46, 0.45, 0.94],
} as const;

const INSTANT_TRANSITION = { duration: 0 } as const;

export const tapScale = {
  scale: 0.97,
  transition: GPU_TRANSITION,
};

export const hoverScale = {
  scale: 1.02,
  transition: GPU_TRANSITION,
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

type MotionLinkProps = ComponentProps<typeof Link> &
  Omit<HTMLMotionProps<"a">, "href">;

export const MotionLink = forwardRef<HTMLAnchorElement, MotionLinkProps>(
  ({ children, className, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <Link {...props} passHref legacyBehavior>
        <m.a
          ref={ref}
          className={className}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          transition={
            prefersReducedMotion ? INSTANT_TRANSITION : GPU_TRANSITION
          }
          style={prefersReducedMotion ? undefined : { willChange: "transform" }}
        >
          {children}
        </m.a>
      </Link>
    );
  },
);
MotionLink.displayName = "MotionLink";

type MotionButtonProps = HTMLMotionProps<"button">;

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <m.button
        ref={ref}
        className={className}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
        transition={prefersReducedMotion ? INSTANT_TRANSITION : GPU_TRANSITION}
        style={prefersReducedMotion ? undefined : { willChange: "transform" }}
        {...props}
      >
        {children}
      </m.button>
    );
  },
);
MotionButton.displayName = "MotionButton";

type MotionDivProps = HTMLMotionProps<"div">;

export const FadeIn = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <m.div
        ref={ref}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={prefersReducedMotion ? INSTANT_TRANSITION : FADE_TRANSITION}
        {...props}
      >
        {children}
      </m.div>
    );
  },
);
FadeIn.displayName = "FadeIn";

export const FadeInStagger = forwardRef<
  HTMLDivElement,
  MotionDivProps & { staggerDelay?: number }
>(({ children, staggerDelay = 0.1, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      ref={ref}
      initial={prefersReducedMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: prefersReducedMotion
            ? INSTANT_TRANSITION
            : { staggerChildren: staggerDelay },
        },
      }}
      {...props}
    >
      {children}
    </m.div>
  );
});
FadeInStagger.displayName = "FadeInStagger";

export const FadeInStaggerItem = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <m.div
        ref={ref}
        variants={{
          hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
          visible: {
            opacity: 1,
            y: 0,
            transition: prefersReducedMotion
              ? INSTANT_TRANSITION
              : FADE_TRANSITION,
          },
        }}
        {...props}
      >
        {children}
      </m.div>
    );
  },
);
FadeInStaggerItem.displayName = "FadeInStaggerItem";

export const MotionCard = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <m.div
        ref={ref}
        className={className}
        whileHover={
          prefersReducedMotion
            ? undefined
            : { y: -2, transition: GPU_TRANSITION }
        }
        style={prefersReducedMotion ? undefined : { willChange: "transform" }}
        {...props}
      >
        {children}
      </m.div>
    );
  },
);
MotionCard.displayName = "MotionCard";

export { m as motion, AnimatePresence } from "framer-motion";
