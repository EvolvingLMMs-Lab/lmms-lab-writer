"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

type Props = {
  projectPath?: string;
  className?: string;
};

export function Terminal({ projectPath, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const ptyIdRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || !projectPath) return;

    const term = new XTerm({
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      theme: {
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
      },
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    let unlistenOutput: UnlistenFn | null = null;
    let unlistenExit: UnlistenFn | null = null;

    const setup = async () => {
      try {
        const ptyId = await invoke<string>("spawn_pty", {
          cwd: projectPath,
          shell: null,
          args: [],
          cols: term.cols,
          rows: term.rows,
        });
        ptyIdRef.current = ptyId;

        unlistenOutput = await listen<{ id: string; data: string }>(
          "pty-output",
          (event) => {
            if (event.payload.id === ptyId) {
              term.write(event.payload.data);
            }
          },
        );

        unlistenExit = await listen<{ id: string; code: number }>(
          "pty-exit",
          (event) => {
            if (event.payload.id === ptyId) {
              term.write(
                `\r\n[Process exited with code ${event.payload.code}]\r\n`,
              );
              ptyIdRef.current = null;
            }
          },
        );

        term.onData((data) => {
          if (ptyIdRef.current) {
            invoke("write_pty", { id: ptyIdRef.current, data }).catch(
              console.error,
            );
          }
        });

        term.onResize(({ cols, rows }) => {
          if (ptyIdRef.current) {
            invoke("resize_pty", { id: ptyIdRef.current, cols, rows }).catch(
              console.error,
            );
          }
        });
      } catch (err) {
        console.error("Failed to spawn PTY:", err);
        term.write(`\r\nFailed to start terminal: ${err}\r\n`);
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
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      unlistenOutput?.();
      unlistenExit?.();
      if (ptyIdRef.current) {
        invoke("kill_pty", { id: ptyIdRef.current }).catch(console.error);
      }
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
      ptyIdRef.current = null;
    };
  }, [mounted, projectPath]);

  if (!mounted) {
    return (
      <div className={`bg-white ${className}`}>
        <div className="p-4 text-sm text-muted">Loading terminal...</div>
      </div>
    );
  }

  if (!projectPath) {
    return (
      <div className={`bg-white flex items-center justify-center ${className}`}>
        <span className="text-sm text-muted">
          Open a project to use terminal
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white ${className}`}>
      <div ref={containerRef} className="w-full h-full p-2" />
    </div>
  );
}
