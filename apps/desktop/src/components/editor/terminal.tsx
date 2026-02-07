"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useTheme } from "next-themes";
import { EDITOR_MONO_FONT_FAMILY } from "@/lib/editor/font-stacks";

const LIGHT_TERMINAL_THEME = {
  background: "#ffffff",
  foreground: "#000000",
  cursor: "#000000",
  cursorAccent: "#ffffff",
  selectionBackground: "#e5e5e5",
  black: "#000000",
  red: "#000000",
  green: "#000000",
  yellow: "#000000",
  blue: "#000000",
  magenta: "#000000",
  cyan: "#000000",
  white: "#ffffff",
  brightBlack: "#666666",
  brightRed: "#333333",
  brightGreen: "#333333",
  brightYellow: "#333333",
  brightBlue: "#333333",
  brightMagenta: "#333333",
  brightCyan: "#333333",
  brightWhite: "#ffffff",
};

const DARK_TERMINAL_THEME = {
  background: "#282c34",
  foreground: "#abb2bf",
  cursor: "#528bff",
  cursorAccent: "#282c34",
  selectionBackground: "#3e4451",
  black: "#282c34",
  red: "#e06c75",
  green: "#98c379",
  yellow: "#e5c07b",
  blue: "#61afef",
  magenta: "#c678dd",
  cyan: "#56b6c2",
  white: "#abb2bf",
  brightBlack: "#5c6370",
  brightRed: "#e06c75",
  brightGreen: "#98c379",
  brightYellow: "#e5c07b",
  brightBlue: "#61afef",
  brightMagenta: "#c678dd",
  brightCyan: "#56b6c2",
  brightWhite: "#ffffff",
};

type Props = {
  projectPath?: string;
  className?: string;
};

export const Terminal = memo(function Terminal({
  projectPath,
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
          shell: null,
          args: [],
          cols: term.cols,
          rows: term.rows,
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
  }, [mounted, projectPath]);

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
