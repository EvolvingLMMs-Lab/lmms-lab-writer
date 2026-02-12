"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PanInfo } from "framer-motion";
import { throttle } from "./file-utils";
import {
  MIN_PANEL_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_TERMINAL_HEIGHT,
  MAX_TERMINAL_HEIGHT_RATIO,
} from "./constants";

type ResizeTarget = "sidebar" | "right" | "bottom";

export function usePanelResize(options?: { onCompactResize?: () => void }) {
  const onCompactResizeRef = useRef(options?.onCompactResize);
  onCompactResizeRef.current = options?.onCompactResize;

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarWidth");
      return saved ? parseInt(saved, 10) : 280;
    }
    return 280;
  });
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rightPanelWidth");
      return saved ? parseInt(saved, 10) : 280;
    }
    return 280;
  });
  const [terminalHeight, setTerminalHeight] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("terminalHeight");
      return saved ? parseInt(saved, 10) : 224;
    }
    return 224;
  });
  const [resizing, setResizing] = useState<ResizeTarget | null>(null);

  const sidebarWidthRef = useRef(sidebarWidth);
  const rightPanelWidthRef = useRef(rightPanelWidth);
  const terminalHeightRef = useRef(terminalHeight);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem("rightPanelWidth", String(rightPanelWidth));
  }, [rightPanelWidth]);

  useEffect(() => {
    localStorage.setItem("terminalHeight", String(terminalHeight));
  }, [terminalHeight]);

  useEffect(() => {
    const COMPACT_THRESHOLD = 1100;

    const handleResize = throttle(() => {
      if (window.innerWidth < COMPACT_THRESHOLD) {
        onCompactResizeRef.current?.();
      }
    }, 100);

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startResize = useCallback(
    (panel: ResizeTarget) => {
      setResizing(panel);
      sidebarWidthRef.current = sidebarWidth;
      rightPanelWidthRef.current = rightPanelWidth;
      terminalHeightRef.current = terminalHeight;
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${sidebarWidth}px`,
      );
      document.documentElement.style.setProperty(
        "--right-panel-width",
        `${rightPanelWidth}px`,
      );
      document.documentElement.style.setProperty(
        "--terminal-height",
        `${terminalHeight}px`,
      );
    },
    [sidebarWidth, rightPanelWidth, terminalHeight],
  );

  const handleResizeDrag = useCallback(
    (panel: ResizeTarget, info: PanInfo) => {
      if (rafIdRef.current !== null) return;

      rafIdRef.current = requestAnimationFrame(() => {
        if (panel === "sidebar") {
          const newWidth = Math.min(
            Math.max(info.point.x, MIN_PANEL_WIDTH),
            MAX_SIDEBAR_WIDTH,
          );
          sidebarWidthRef.current = newWidth;
          document.documentElement.style.setProperty(
            "--sidebar-width",
            `${newWidth}px`,
          );
        } else if (panel === "right") {
          const maxRightWidth = Math.floor(window.innerWidth / 2);
          const newWidth = Math.min(
            Math.max(window.innerWidth - info.point.x, MIN_PANEL_WIDTH),
            maxRightWidth,
          );
          rightPanelWidthRef.current = newWidth;
          document.documentElement.style.setProperty(
            "--right-panel-width",
            `${newWidth}px`,
          );
        } else if (panel === "bottom") {
          const maxHeight = Math.floor(
            window.innerHeight * MAX_TERMINAL_HEIGHT_RATIO,
          );
          const newHeight = Math.min(
            Math.max(window.innerHeight - info.point.y, MIN_TERMINAL_HEIGHT),
            maxHeight,
          );
          terminalHeightRef.current = newHeight;
          document.documentElement.style.setProperty(
            "--terminal-height",
            `${newHeight}px`,
          );
        }
        rafIdRef.current = null;
      });
    },
    [],
  );

  const endResize = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setSidebarWidth(sidebarWidthRef.current);
    setRightPanelWidth(rightPanelWidthRef.current);
    setTerminalHeight(terminalHeightRef.current);
    document.documentElement.style.removeProperty("--sidebar-width");
    document.documentElement.style.removeProperty("--right-panel-width");
    document.documentElement.style.removeProperty("--terminal-height");
    setResizing(null);
  }, []);

  return {
    sidebarWidth,
    rightPanelWidth,
    terminalHeight,
    resizing,
    startResize,
    handleResizeDrag,
    endResize,
  };
}
