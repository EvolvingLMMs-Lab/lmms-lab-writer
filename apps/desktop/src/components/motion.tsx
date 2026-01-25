"use client";

import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

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

type MotionButtonProps = HTMLMotionProps<"button">;

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={className}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={GPU_SPRING}
        style={{ willChange: "transform" }}
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
  return (
    <motion.button
      ref={ref}
      className={className}
      initial={false}
      whileHover={{
        x: 2,
        backgroundColor: isSelected ? undefined : "rgba(0,0,0,0.04)",
      }}
      whileTap={{ scale: 0.99 }}
      transition={GPU_SPRING}
      style={{ willChange: "transform" }}
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
  const xOffset = direction === "left" ? -width : width;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.aside
          initial={{ x: xOffset, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: xOffset, opacity: 0 }}
          transition={PANEL_TRANSITION}
          style={{ width, willChange: "transform, opacity" }}
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
    return (
      <motion.button
        ref={ref}
        className={className}
        whileHover={
          isActive ? undefined : { backgroundColor: "rgba(0,0,0,0.04)" }
        }
        whileTap={{ scale: 0.98 }}
        transition={GPU_SPRING}
        style={{ willChange: "transform" }}
        {...props}
      >
        {children}
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
            transition={GPU_SPRING}
          />
        )}
      </motion.button>
    );
  },
);
MotionTab.displayName = "MotionTab";

export function MotionChevron({ expanded }: { expanded: boolean }) {
  return (
    <motion.div
      className="w-3 h-3 flex-shrink-0"
      initial={false}
      animate={{ rotate: expanded ? 90 : 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ willChange: "transform" }}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </motion.div>
  );
}

export const MotionFadeIn = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
MotionFadeIn.displayName = "MotionFadeIn";

export { motion, AnimatePresence };
