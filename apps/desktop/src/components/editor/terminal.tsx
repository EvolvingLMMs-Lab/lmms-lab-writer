"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useTheme } from "next-themes";
import { EDITOR_MONO_FONT_FAMILY } from "@/lib/editor/font-stacks";

// GitHub Light terminal colors
const LIGHT_TERMINAL_THEME = {
  background: "#ffffff",
  foreground: "#24292e",
  cursor: "#24292e",
  cursorAccent: "#ffffff",
  selectionBackground: "#c8c8fa",
  black: "#24292e",
  red: "#d73a49",
  green: "#22863a",
  yellow: "#e36209",
  blue: "#005cc5",
  magenta: "#6f42c1",
  cyan: "#032f62",
  white: "#fafbfc",
  brightBlack: "#959da5",
  brightRed: "#cb2431",
  brightGreen: "#28a745",
  brightYellow: "#f9826c",
  brightBlue: "#79b8ff",
  brightMagenta: "#b392f0",
  brightCyan: "#0366d6",
  brightWhite: "#ffffff",
};

// GitHub Dark terminal colors (matched to app dark theme)
const DARK_TERMINAL_THEME = {
  background: "#2c323a",
  foreground: "#c9d1d9",
  cursor: "#d1d5da",
  cursorAccent: "#2c323a",
  selectionBackground: "#3b4048",
  black: "#2c323a",
  red: "#f85149",
  green: "#56d364",
  yellow: "#d29922",
  blue: "#58a6ff",
  magenta: "#a371f7",
  cyan: "#76d9e6",
  white: "#c9d1d9",
  brightBlack: "#8b949e",
  brightRed: "#ffa198",
  brightGreen: "#7ee787",
  brightYellow: "#e3b341",
  brightBlue: "#79c0ff",
  brightMagenta: "#bc8cff",
  brightCyan: "#a5d6ff",
  brightWhite: "#e6edf3",
};

type Props = {
  projectPath?: string;
  shellMode?: "auto" | "custom";
  customShell?: string;
  className?: string;
};

export const Terminal = memo(function Terminal({
  projectPath,
  shellMode = "auto",
  customShell = "",
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  // Client-side mount check - intentionally set in effect for hydration safety
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();


  useEffect(() => {
    setMounted(true);
  }, []);

  // Reactively update terminal theme when app mode changes
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme =
        resolvedTheme === "dark" ? DARK_TERMINAL_THEME : LIGHT_TERMINAL_THEME;
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (!mounted || !containerRef.current || !projectPath) return;

    const preferredShell =
      shellMode === "custom" && customShell.trim().length > 0
        ? customShell.trim()
        : null;

    // Track cleanup state to prevent zombie processes
    let isCleanedUp = false;
    let ptyId: string | null = null;
    let unlistenOutput: UnlistenFn | null = null;
    let unlistenExit: UnlistenFn | null = null;

    const term = new XTerm({
      fontFamily: EDITOR_MONO_FONT_FAMILY,
      fontSize: 13,
      lineHeight: 1.4,
      theme: resolvedTheme === "dark" ? DARK_TERMINAL_THEME : LIGHT_TERMINAL_THEME,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 10000,
      screenReaderMode: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const setup = async () => {
      try {
        // Check if already cleaned up before spawning
        if (isCleanedUp) return;

        const spawnedPtyId = await invoke<string>("spawn_pty", {
          cwd: projectPath,
          cols: term.cols,
          rows: term.rows,
          shell: preferredShell,
        });

        // Check again after async operation
        if (isCleanedUp) {
          // Component unmounted during spawn - kill the orphan process
          invoke("kill_pty", { id: spawnedPtyId }).catch(console.error);
          return;
        }

        ptyId = spawnedPtyId;

        unlistenOutput = await listen<{ id: string; data: string }>(
          "pty-output",
          (event) => {
            if (event.payload.id === ptyId && !isCleanedUp) {
              term.write(event.payload.data);
            }
          },
        );

        // Check again after async operation
        if (isCleanedUp) {
          unlistenOutput?.();
          invoke("kill_pty", { id: ptyId }).catch(console.error);
          return;
        }

        unlistenExit = await listen<{ id: string; code: number }>(
          "pty-exit",
          (event) => {
            if (event.payload.id === ptyId && !isCleanedUp) {
              term.write(
                `\r\n[Process exited with code ${event.payload.code}]\r\n`,
              );
              ptyId = null;
            }
          },
        );

        // Check again after async operation
        if (isCleanedUp) {
          unlistenOutput?.();
          unlistenExit?.();
          invoke("kill_pty", { id: ptyId }).catch(console.error);
          return;
        }

        term.onData((data) => {
          if (ptyId && !isCleanedUp) {
            invoke("write_pty", { id: ptyId, data }).catch(console.error);
          }
        });

        term.onResize(({ cols, rows }) => {
          if (ptyId && !isCleanedUp) {
            invoke("resize_pty", { id: ptyId, cols, rows }).catch(
              console.error,
            );
          }
        });
      } catch (err) {
        if (!isCleanedUp) {
          console.error("Failed to spawn PTY:", err);
          term.write(`\r\nFailed to start terminal: ${err}\r\n`);
        }
      }
    };

    setup();

    const handleResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      // Mark as cleaned up FIRST to prevent race conditions
      isCleanedUp = true;

      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();

      // Clean up listeners
      unlistenOutput?.();
      unlistenExit?.();

      // Kill PTY process if it exists
      if (ptyId) {
        invoke("kill_pty", { id: ptyId }).catch(console.error);
      }

      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- resolvedTheme intentionally excluded to avoid recreating PTY on theme change
  }, [mounted, projectPath, shellMode, customShell]);

  if (!mounted) {
    return (
      <div className={`bg-background ${className}`}>
        <div className="p-4 text-sm text-muted">Loading terminal...</div>
      </div>
    );
  }

  if (!projectPath) {
    return (
      <div className={`bg-background flex items-center justify-center ${className}`}>
        <span className="text-sm text-muted">
          Open a project to use terminal
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-background ${className}`}>
      <div ref={containerRef} className="w-full h-full p-2" />
    </div>
  );
});
