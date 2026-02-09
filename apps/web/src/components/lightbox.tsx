"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";

const SPRING = { type: "spring", stiffness: 300, damping: 28, mass: 0.8 } as const;

interface LightboxImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}

export function LightboxImage({
  src,
  alt,
  className,
  width = 1600,
  height = 900,
  sizes = "(max-width: 768px) 100vw, 60vw",
  priority = false,
}: LightboxImageProps) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  return (
    <>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={`${className ?? ""} cursor-zoom-in`}
        onClick={() => setOpen(true)}
      />
      <AnimatePresence>
        {open && (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-zoom-out"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={close}
          >
            <m.img
              src={src}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-md shadow-2xl"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              transition={prefersReducedMotion ? { duration: 0 } : SPRING}
              onClick={(e) => e.stopPropagation()}
            />
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
