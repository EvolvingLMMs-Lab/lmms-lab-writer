"use client";

import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { CaretRightIcon } from "@phosphor-icons/react";

const GPU_SPRING = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
} as const;

const PANEL_TRANSITION = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.8,
} as const;

const INSTANT_TRANSITION = { duration: 0 } as const;

type MotionButtonProps = HTMLMotionProps<"button">;

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, disabled, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const noAnimation = disabled || prefersReducedMotion;

    return (
      <motion.button
        ref={ref}
        className={className}
        disabled={disabled}
        whileHover={noAnimation ? undefined : { scale: 1.02 }}
        whileTap={noAnimation ? undefined : { scale: 0.98 }}
        transition={prefersReducedMotion ? INSTANT_TRANSITION : GPU_SPRING}
        style={prefersReducedMotion ? undefined : { willChange: "transform" }}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
MotionButton.displayName = "MotionButton";

type MotionListItemProps = HTMLMotionProps<"button"> & {
  isSelected?: boolean;
};

export const MotionListItem = forwardRef<
  HTMLButtonElement,
  MotionListItemProps
>(({ children, className, isSelected, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      ref={ref}
      className={className}
      initial={false}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              x: 2,
              backgroundColor: isSelected ? undefined : "rgba(0,0,0,0.04)",
            }
      }
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
      transition={prefersReducedMotion ? INSTANT_TRANSITION : GPU_SPRING}
      style={prefersReducedMotion ? undefined : { willChange: "transform" }}
      {...props}
    >
      {children}
    </motion.button>
  );
});
MotionListItem.displayName = "MotionListItem";

type SlidePanelProps = {
  show: boolean;
  direction: "left" | "right";
  width: number;
  children: ReactNode;
  className?: string;
};

export function SlidePanel({
  show,
  direction,
  width,
  children,
  className,
}: SlidePanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const xOffset = direction === "left" ? -width : width;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.aside
          initial={
            prefersReducedMotion ? { opacity: 1 } : { x: xOffset, opacity: 0 }
          }
          animate={{ x: 0, opacity: 1 }}
          exit={
            prefersReducedMotion ? { opacity: 0 } : { x: xOffset, opacity: 0 }
          }
          transition={
            prefersReducedMotion ? INSTANT_TRANSITION : PANEL_TRANSITION
          }
          style={{
            width,
            willChange: prefersReducedMotion ? undefined : "transform, opacity",
          }}
          className={className}
        >
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

type MotionTabProps = Omit<HTMLMotionProps<"button">, "children"> & {
  isActive?: boolean;
  children?: ReactNode;
};

export const MotionTab = forwardRef<HTMLButtonElement, MotionTabProps>(
  ({ children, className, isActive, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <motion.button
        ref={ref}
        className={className}
        whileHover={
          isActive || prefersReducedMotion
            ? undefined
            : { backgroundColor: "rgba(0,0,0,0.04)" }
        }
        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
        transition={prefersReducedMotion ? INSTANT_TRANSITION : GPU_SPRING}
        style={prefersReducedMotion ? undefined : { willChange: "transform" }}
        {...props}
      >
        {children}
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
            transition={prefersReducedMotion ? INSTANT_TRANSITION : GPU_SPRING}
          />
        )}
      </motion.button>
    );
  },
);
MotionTab.displayName = "MotionTab";

export function MotionChevron({ expanded }: { expanded: boolean }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="w-3 h-3 flex-shrink-0"
      initial={false}
      animate={{ rotate: expanded ? 90 : 0 }}
      transition={
        prefersReducedMotion
          ? INSTANT_TRANSITION
          : { duration: 0.15, ease: "easeOut" }
      }
      style={prefersReducedMotion ? undefined : { willChange: "transform" }}
    >
      <CaretRightIcon className="w-3 h-3" weight="fill" />
    </motion.div>
  );
}

export const MotionFadeIn = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          prefersReducedMotion
            ? INSTANT_TRANSITION
            : { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
MotionFadeIn.displayName = "MotionFadeIn";

export { motion, AnimatePresence };
