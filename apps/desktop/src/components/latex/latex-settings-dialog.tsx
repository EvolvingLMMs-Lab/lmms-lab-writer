"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LaTeXSettings,
  LaTeXCompiler,
  LaTeXCompilersStatus,
  COMPILER_DISPLAY_NAMES,
  COMPILER_DESCRIPTIONS,
} from "@/lib/latex/types";
import { Spinner } from "@/components/ui/spinner";

interface LaTeXSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: LaTeXSettings;
  onUpdateSettings: (updates: Partial<LaTeXSettings>) => void;
  compilersStatus: LaTeXCompilersStatus | null;
  isDetecting: boolean;
  onDetectCompilers: () => void;
  texFiles: string[];
}

const COMPILERS: LaTeXCompiler[] = ["pdflatex", "xelatex", "lualatex", "latexmk"];

export function LaTeXSettingsDialog({
  open,
  onClose,
  settings,
  onUpdateSettings,
  compilersStatus,
  isDetecting,
  onDetectCompilers,
  texFiles,
}: LaTeXSettingsDialogProps) {
  const [customArgsInput, setCustomArgsInput] = useState(
    settings.arguments.join(" ")
  );

  // Sync custom args input with settings
  useEffect(() => {
    setCustomArgsInput(settings.arguments.join(" "));
  }, [settings.arguments]);

  const handleArgsBlur = useCallback(() => {
    const args = customArgsInput
      .split(/\s+/)
      .filter((arg) => arg.trim().length > 0);
    onUpdateSettings({ arguments: args });
  }, [customArgsInput, onUpdateSettings]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
          >
            <div
              className="bg-white border-2 border-black shadow-[4px_4px_0_0_#000] w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-lg font-bold">LaTeX Settings</h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-neutral-100 transition-colors"
                  aria-label="Close"
                >
                  <svg
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Compiler Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Compiler</label>
                    <button
                      onClick={onDetectCompilers}
                      disabled={isDetecting}
                      className="text-xs text-muted hover:text-black flex items-center gap-1"
                    >
                      {isDetecting ? (
                        <>
                          <Spinner className="size-3" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <svg
                            className="size-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Refresh
                        </>
                      )}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {COMPILERS.map((compiler) => {
                      const info = compilersStatus?.[compiler];
                      const isAvailable = info?.available ?? false;
                      const isSelected = settings.compiler === compiler;

                      return (
                        <label
                          key={compiler}
                          className={`flex items-start gap-3 p-2 border cursor-pointer transition-colors ${
                            isSelected
                              ? "border-black bg-neutral-50"
                              : "border-border hover:border-neutral-400"
                          } ${!isAvailable ? "opacity-50" : ""}`}
                        >
                          <input
                            type="radio"
                            name="compiler"
                            value={compiler}
                            checked={isSelected}
                            onChange={() => onUpdateSettings({ compiler })}
                            disabled={!isAvailable}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {COMPILER_DISPLAY_NAMES[compiler]}
                              </span>
                              {isAvailable ? (
                                <span className="text-xs px-1 py-0.5 bg-green-100 text-green-700">
                                  Installed
                                </span>
                              ) : (
                                <span className="text-xs px-1 py-0.5 bg-red-100 text-red-700">
                                  Not found
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted mt-0.5">
                              {COMPILER_DESCRIPTIONS[compiler]}
                            </p>
                            {info?.version && (
                              <p className="text-xs text-muted mt-0.5 truncate">
                                {info.version}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Main File Selection */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Main File
                  </label>
                  {texFiles.length === 0 ? (
                    <p className="text-sm text-muted">
                      No .tex files found in project
                    </p>
                  ) : (
                    <select
                      value={settings.mainFile || ""}
                      onChange={(e) =>
                        onUpdateSettings({
                          mainFile: e.target.value || null,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-black"
                    >
                      <option value="">Select main .tex file...</option>
                      {texFiles.map((file) => (
                        <option key={file} value={file}>
                          {file}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Custom Path */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Custom Compiler Path (optional)
                  </label>
                  <input
                    type="text"
                    value={settings.customPath || ""}
                    onChange={(e) =>
                      onUpdateSettings({
                        customPath: e.target.value || null,
                      })
                    }
                    placeholder="/usr/local/bin/pdflatex"
                    className="w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-black"
                  />
                  <p className="text-xs text-muted mt-1">
                    Override the default compiler path if it's not in your PATH
                  </p>
                </div>

                {/* Additional Arguments */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Additional Arguments
                  </label>
                  <input
                    type="text"
                    value={customArgsInput}
                    onChange={(e) => setCustomArgsInput(e.target.value)}
                    onBlur={handleArgsBlur}
                    placeholder="-shell-escape -output-directory=build"
                    className="w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-black font-mono"
                  />
                  <p className="text-xs text-muted mt-1">
                    Space-separated arguments passed to the compiler
                  </p>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.synctex}
                      onChange={(e) =>
                        onUpdateSettings({ synctex: e.target.checked })
                      }
                      className="size-4"
                    />
                    <div>
                      <span className="text-sm font-medium">Enable SyncTeX</span>
                      <p className="text-xs text-muted">
                        Generate sync data for PDF-source synchronization
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cleanAuxFiles}
                      onChange={(e) =>
                        onUpdateSettings({ cleanAuxFiles: e.target.checked })
                      }
                      className="size-4"
                    />
                    <div>
                      <span className="text-sm font-medium">
                        Clean auxiliary files after compilation
                      </span>
                      <p className="text-xs text-muted">
                        Remove .aux, .log, .toc, and other temporary files
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoCompileOnSave}
                      onChange={(e) =>
                        onUpdateSettings({ autoCompileOnSave: e.target.checked })
                      }
                      className="size-4"
                    />
                    <div>
                      <span className="text-sm font-medium">
                        Auto-compile on save
                      </span>
                      <p className="text-xs text-muted">
                        Automatically compile when saving .tex files
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoOpenPdf}
                      onChange={(e) =>
                        onUpdateSettings({ autoOpenPdf: e.target.checked })
                      }
                      className="size-4"
                    />
                    <div>
                      <span className="text-sm font-medium">
                        Auto-open PDF after compilation
                      </span>
                      <p className="text-xs text-muted">
                        Open the generated PDF in the preview panel
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-border bg-neutral-50">
                <button
                  onClick={onClose}
                  className="btn btn-sm border-2 border-black bg-white text-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
