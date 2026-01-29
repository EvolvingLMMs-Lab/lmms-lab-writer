"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LaTeXSettings,
  LaTeXCompiler,
  LaTeXCompilersStatus,
  COMPILER_DISPLAY_NAMES,
  COMPILER_DESCRIPTIONS,
  DEFAULT_LATEX_SETTINGS,
} from "@/lib/latex/types";
import { EditorSettings, MinimapSettings, DEFAULT_EDITOR_SETTINGS } from "@/lib/editor/types";
import { Spinner } from "@/components/ui/spinner";
import { LaTeXInstallPrompt } from "./latex-install-prompt";

interface LaTeXSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: LaTeXSettings;
  onUpdateSettings: (updates: Partial<LaTeXSettings>) => void;
  editorSettings: EditorSettings;
  onUpdateEditorSettings: (updates: Partial<EditorSettings>) => void;
  compilersStatus: LaTeXCompilersStatus | null;
  isDetecting: boolean;
  onDetectCompilers: () => void;
  texFiles: string[];
}

const COMPILERS: LaTeXCompiler[] = ["pdflatex", "xelatex", "lualatex", "latexmk"];

type SettingsTab = "compiler" | "editor" | "build";

// Section header component for visual grouping
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
        {children}
      </h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// Checkbox item component for consistent styling
function CheckboxItem({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 mt-0.5 accent-black"
      />
      <div className="flex-1">
        <span className="text-sm font-medium group-hover:text-black transition-colors">
          {label}
        </span>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </label>
  );
}

// Select field component for consistent styling
function SelectField({
  label,
  value,
  onChange,
  options,
  description,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  description?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-black bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {description && <p className="text-xs text-muted mt-1">{description}</p>}
    </div>
  );
}

export function LaTeXSettingsDialog({
  open,
  onClose,
  settings,
  onUpdateSettings,
  editorSettings,
  onUpdateEditorSettings,
  compilersStatus,
  isDetecting,
  onDetectCompilers,
  texFiles,
}: LaTeXSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("compiler");
  const [customArgsInput, setCustomArgsInput] = useState(
    settings.arguments.join(" ")
  );

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

  const handleResetLatexSettings = useCallback(() => {
    onUpdateSettings(DEFAULT_LATEX_SETTINGS);
  }, [onUpdateSettings]);

  const handleResetEditorSettings = useCallback(() => {
    onUpdateEditorSettings(DEFAULT_EDITOR_SETTINGS);
  }, [onUpdateEditorSettings]);

  const hasAnyCompiler =
    compilersStatus &&
    (compilersStatus.pdflatex.available ||
      compilersStatus.xelatex.available ||
      compilersStatus.lualatex.available ||
      compilersStatus.latexmk.available);

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
              className="bg-white border-2 border-black shadow-[4px_4px_0_0_#000] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Settings</h2>
                  <span className="text-xs text-muted bg-neutral-100 px-1.5 py-0.5 rounded">
                    Auto-saved
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-neutral-100 transition-colors rounded"
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

              {/* Tabs */}
              <div className="flex border-b border-border">
                {(
                  [
                    { key: "compiler", label: "Compiler" },
                    { key: "editor", label: "Editor" },
                    { key: "build", label: "Build" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                        ? "text-black border-b-2 border-black -mb-px"
                        : "text-muted hover:text-black"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* ===== COMPILER TAB ===== */}
                {activeTab === "compiler" && (
                  <>
                    {/* Install Prompt */}
                    {compilersStatus && !hasAnyCompiler && !isDetecting && (
                      <LaTeXInstallPrompt
                        onRefreshCompilers={onDetectCompilers}
                      />
                    )}

                    {/* Compiler Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Compiler</label>
                        <button
                          onClick={onDetectCompilers}
                          disabled={isDetecting}
                          className="text-xs text-muted hover:text-black flex items-center gap-1 transition-colors"
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
                              className={`flex items-start gap-3 p-2.5 border cursor-pointer transition-all ${isSelected
                                  ? "border-black bg-neutral-50"
                                  : "border-border hover:border-neutral-400"
                                } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <input
                                type="radio"
                                name="compiler"
                                value={compiler}
                                checked={isSelected}
                                onChange={() => onUpdateSettings({ compiler })}
                                disabled={!isAvailable}
                                className="mt-0.5 accent-black"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {COMPILER_DISPLAY_NAMES[compiler]}
                                  </span>
                                  {isAvailable ? (
                                    <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                      Installed
                                    </span>
                                  ) : (
                                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                      Not found
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted mt-0.5">
                                  {COMPILER_DESCRIPTIONS[compiler]}
                                </p>
                                {info?.version && (
                                  <p className="text-xs text-muted/70 mt-0.5 truncate font-mono">
                                    {info.version}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <SectionHeader>Advanced</SectionHeader>

                    {/* Custom Path */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        Custom Compiler Path
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
                        className="w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-black font-mono"
                      />
                      <p className="text-xs text-muted mt-1">
                        Override the default compiler path if needed
                      </p>
                    </div>

                    {/* Additional Arguments */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
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
                  </>
                )}

                {/* ===== EDITOR TAB ===== */}
                {activeTab === "editor" && (
                  <>
                    <SectionHeader>Display</SectionHeader>

                    {/* Font Size */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        Font Size
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onUpdateEditorSettings({
                              fontSize: Math.max(8, editorSettings.fontSize - 1),
                            })
                          }
                          className="size-8 flex items-center justify-center border border-border hover:border-black hover:bg-neutral-50 transition-colors text-lg font-medium"
                          aria-label="Decrease font size"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="8"
                          max="32"
                          value={editorSettings.fontSize}
                          onChange={(e) =>
                            onUpdateEditorSettings({
                              fontSize: Math.min(32, Math.max(8, parseInt(e.target.value) || 14)),
                            })
                          }
                          className="w-16 px-2 py-1.5 text-sm text-center border border-border focus:outline-none focus:border-black font-mono"
                        />
                        <button
                          onClick={() =>
                            onUpdateEditorSettings({
                              fontSize: Math.min(32, editorSettings.fontSize + 1),
                            })
                          }
                          className="size-8 flex items-center justify-center border border-border hover:border-black hover:bg-neutral-50 transition-colors text-lg font-medium"
                          aria-label="Increase font size"
                        >
                          +
                        </button>
                        <span className="text-sm text-muted ml-1">px</span>
                      </div>
                    </div>

                    {/* Line Height */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        Line Height
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onUpdateEditorSettings({
                              lineHeight: Math.max(1.0, Math.round((editorSettings.lineHeight - 0.1) * 10) / 10),
                            })
                          }
                          className="size-8 flex items-center justify-center border border-border hover:border-black hover:bg-neutral-50 transition-colors text-lg font-medium"
                          aria-label="Decrease line height"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1.0"
                          max="3.0"
                          step="0.1"
                          value={editorSettings.lineHeight.toFixed(1)}
                          onChange={(e) =>
                            onUpdateEditorSettings({
                              lineHeight: Math.min(3.0, Math.max(1.0, parseFloat(e.target.value) || 1.6)),
                            })
                          }
                          className="w-16 px-2 py-1.5 text-sm text-center border border-border focus:outline-none focus:border-black font-mono"
                        />
                        <button
                          onClick={() =>
                            onUpdateEditorSettings({
                              lineHeight: Math.min(3.0, Math.round((editorSettings.lineHeight + 0.1) * 10) / 10),
                            })
                          }
                          className="size-8 flex items-center justify-center border border-border hover:border-black hover:bg-neutral-50 transition-colors text-lg font-medium"
                          aria-label="Increase line height"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <SelectField
                      label="Line Numbers"
                      value={editorSettings.lineNumbers}
                      onChange={(v) =>
                        onUpdateEditorSettings({
                          lineNumbers: v as EditorSettings["lineNumbers"],
                        })
                      }
                      options={[
                        { value: "on", label: "On" },
                        { value: "off", label: "Off" },
                        { value: "relative", label: "Relative" },
                        { value: "interval", label: "Interval (every 10)" },
                      ]}
                    />

                    <SelectField
                      label="Render Whitespace"
                      value={editorSettings.renderWhitespace}
                      onChange={(v) =>
                        onUpdateEditorSettings({
                          renderWhitespace: v as EditorSettings["renderWhitespace"],
                        })
                      }
                      options={[
                        { value: "none", label: "None" },
                        { value: "boundary", label: "Boundary" },
                        { value: "selection", label: "Selection" },
                        { value: "trailing", label: "Trailing" },
                        { value: "all", label: "All" },
                      ]}
                    />

                    <div className="space-y-3 pt-1">
                      <CheckboxItem
                        checked={editorSettings.smoothScrolling}
                        onChange={(v) =>
                          onUpdateEditorSettings({ smoothScrolling: v })
                        }
                        label="Smooth Scrolling"
                        description="Enable smooth scroll animation"
                      />
                    </div>

                    <SectionHeader>Minimap</SectionHeader>

                    {/* Minimap Enable Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Enable Minimap</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                            Preview
                          </span>
                        </div>
                        <p className="text-xs text-muted">Code overview panel</p>
                      </div>
                      <button
                        onClick={() =>
                          onUpdateEditorSettings({
                            minimap: {
                              ...editorSettings.minimap,
                              enabled: !editorSettings.minimap.enabled,
                            },
                          })
                        }
                        className={`relative w-11 h-6 rounded-full transition-colors ${editorSettings.minimap.enabled
                            ? "bg-black"
                            : "bg-neutral-300"
                          }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${editorSettings.minimap.enabled
                              ? "translate-x-5"
                              : "translate-x-0"
                            }`}
                        />
                      </button>
                    </div>

                    {/* Minimap Options - only show when enabled */}
                    {editorSettings.minimap.enabled && (
                      <div className="space-y-4 pl-3 border-l-2 border-border">
                        {/* Side Selector */}
                        <div>
                          <label className="text-sm font-medium block mb-1.5">
                            Position
                          </label>
                          <div className="flex gap-2">
                            {(["left", "right"] as const).map((side) => (
                              <button
                                key={side}
                                onClick={() =>
                                  onUpdateEditorSettings({
                                    minimap: { ...editorSettings.minimap, side },
                                  })
                                }
                                className={`flex-1 px-3 py-2 text-sm border transition-all ${editorSettings.minimap.side === side
                                    ? "border-black bg-black text-white"
                                    : "border-border hover:border-neutral-400"
                                  }`}
                              >
                                {side === "left" ? "Left" : "Right"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Size Mode */}
                        <SelectField
                          label="Size Mode"
                          value={editorSettings.minimap.size}
                          onChange={(v) =>
                            onUpdateEditorSettings({
                              minimap: {
                                ...editorSettings.minimap,
                                size: v as MinimapSettings["size"],
                              },
                            })
                          }
                          options={[
                            { value: "proportional", label: "Proportional" },
                            { value: "fill", label: "Fill" },
                            { value: "fit", label: "Fit" },
                          ]}
                          description="How the minimap scales relative to content"
                        />

                        {/* Show Slider */}
                        <SelectField
                          label="Show Slider"
                          value={editorSettings.minimap.showSlider}
                          onChange={(v) =>
                            onUpdateEditorSettings({
                              minimap: {
                                ...editorSettings.minimap,
                                showSlider: v as MinimapSettings["showSlider"],
                              },
                            })
                          }
                          options={[
                            { value: "mouseover", label: "On Hover" },
                            { value: "always", label: "Always" },
                          ]}
                          description="When to show the viewport indicator"
                        />


                        {/* Render Characters */}
                        <div className="pt-2">
                          <CheckboxItem
                            checked={editorSettings.minimap.renderCharacters}
                            onChange={(v) =>
                              onUpdateEditorSettings({
                                minimap: {
                                  ...editorSettings.minimap,
                                  renderCharacters: v,
                                },
                              })
                            }
                            label="Render Characters"
                            description="Show actual characters instead of blocks"
                          />
                        </div>
                      </div>
                    )}

                    <SectionHeader>Cursor</SectionHeader>

                    <SelectField
                      label="Cursor Style"
                      value={editorSettings.cursorStyle}
                      onChange={(v) =>
                        onUpdateEditorSettings({
                          cursorStyle: v as EditorSettings["cursorStyle"],
                        })
                      }
                      options={[
                        { value: "line", label: "Line" },
                        { value: "line-thin", label: "Line (Thin)" },
                        { value: "block", label: "Block" },
                        { value: "block-outline", label: "Block Outline" },
                        { value: "underline", label: "Underline" },
                        { value: "underline-thin", label: "Underline (Thin)" },
                      ]}
                    />

                    <SelectField
                      label="Cursor Blinking"
                      value={editorSettings.cursorBlinking}
                      onChange={(v) =>
                        onUpdateEditorSettings({
                          cursorBlinking: v as EditorSettings["cursorBlinking"],
                        })
                      }
                      options={[
                        { value: "blink", label: "Blink" },
                        { value: "smooth", label: "Smooth" },
                        { value: "phase", label: "Phase" },
                        { value: "expand", label: "Expand" },
                        { value: "solid", label: "Solid" },
                      ]}
                    />

                    <SectionHeader>Editing</SectionHeader>

                    <SelectField
                      label="Tab Size"
                      value={editorSettings.tabSize}
                      onChange={(v) =>
                        onUpdateEditorSettings({ tabSize: parseInt(v) })
                      }
                      options={[
                        { value: 2, label: "2 spaces" },
                        { value: 4, label: "4 spaces" },
                        { value: 8, label: "8 spaces" },
                      ]}
                    />

                    <SelectField
                      label="Word Wrap"
                      value={editorSettings.wordWrap}
                      onChange={(v) =>
                        onUpdateEditorSettings({
                          wordWrap: v as EditorSettings["wordWrap"],
                        })
                      }
                      options={[
                        { value: "off", label: "Off" },
                        { value: "on", label: "On" },
                        { value: "wordWrapColumn", label: "Wrap at Column" },
                        { value: "bounded", label: "Bounded" },
                      ]}
                    />

                    {editorSettings.wordWrap === "wordWrapColumn" && (
                      <div className="ml-4 pl-3 border-l-2 border-border">
                        <label className="text-sm font-medium block mb-1.5">
                          Wrap Column
                        </label>
                        <input
                          type="number"
                          min="40"
                          max="200"
                          value={editorSettings.wordWrapColumn}
                          onChange={(e) =>
                            onUpdateEditorSettings({
                              wordWrapColumn: parseInt(e.target.value) || 80,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-black"
                        />
                      </div>
                    )}

                    <SelectField
                      label="Auto-close Brackets"
                      value={editorSettings.autoClosingBrackets}
                      onChange={(v) =>
                        onUpdateEditorSettings({
                          autoClosingBrackets: v as EditorSettings["autoClosingBrackets"],
                        })
                      }
                      options={[
                        { value: "always", label: "Always" },
                        { value: "languageDefined", label: "Language Defined" },
                        { value: "beforeWhitespace", label: "Before Whitespace" },
                        { value: "never", label: "Never" },
                      ]}
                    />

                    <SelectField
                      label="Auto-close Quotes"
                      value={editorSettings.autoClosingQuotes}
                      onChange={(v) =>
                        onUpdateEditorSettings({
                          autoClosingQuotes: v as EditorSettings["autoClosingQuotes"],
                        })
                      }
                      options={[
                        { value: "always", label: "Always" },
                        { value: "languageDefined", label: "Language Defined" },
                        { value: "beforeWhitespace", label: "Before Whitespace" },
                        { value: "never", label: "Never" },
                      ]}
                    />

                    <div className="space-y-3 pt-1">
                      <CheckboxItem
                        checked={editorSettings.insertSpaces}
                        onChange={(v) =>
                          onUpdateEditorSettings({ insertSpaces: v })
                        }
                        label="Insert Spaces"
                        description="Use spaces instead of tabs for indentation"
                      />
                    </div>

                    <SectionHeader>Formatting</SectionHeader>

                    <div className="space-y-3">
                      <CheckboxItem
                        checked={editorSettings.formatOnSave}
                        onChange={(v) =>
                          onUpdateEditorSettings({ formatOnSave: v })
                        }
                        label="Format on Save"
                        description="Automatically format code when saving"
                      />
                      <CheckboxItem
                        checked={editorSettings.formatOnPaste}
                        onChange={(v) =>
                          onUpdateEditorSettings({ formatOnPaste: v })
                        }
                        label="Format on Paste"
                        description="Automatically format pasted code"
                      />
                    </div>
                  </>
                )}

                {/* ===== BUILD TAB ===== */}
                {activeTab === "build" && (
                  <>
                    <SectionHeader>Main File</SectionHeader>

                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        Main .tex File
                      </label>
                      {texFiles.length === 0 ? (
                        <p className="text-sm text-muted py-2">
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
                          className="w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-black bg-white"
                        >
                          <option value="">Select main .tex file...</option>
                          {texFiles.map((file) => (
                            <option key={file} value={file}>
                              {file}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="text-xs text-muted mt-1">
                        The entry point for LaTeX compilation
                      </p>
                    </div>

                    <SectionHeader>Compilation</SectionHeader>

                    <div className="space-y-3">
                      <CheckboxItem
                        checked={settings.synctex}
                        onChange={(v) => onUpdateSettings({ synctex: v })}
                        label="Enable SyncTeX"
                        description="Generate sync data for PDF-source synchronization"
                      />
                      <CheckboxItem
                        checked={settings.autoCompileOnSave}
                        onChange={(v) =>
                          onUpdateSettings({ autoCompileOnSave: v })
                        }
                        label="Auto-compile on Save"
                        description="Automatically compile when saving .tex files"
                      />
                      <CheckboxItem
                        checked={settings.autoOpenPdf}
                        onChange={(v) => onUpdateSettings({ autoOpenPdf: v })}
                        label="Auto-open PDF"
                        description="Open the generated PDF after compilation"
                      />
                    </div>

                    <SectionHeader>Cleanup</SectionHeader>

                    <div className="space-y-3">
                      <CheckboxItem
                        checked={settings.cleanAuxFiles}
                        onChange={(v) =>
                          onUpdateSettings({ cleanAuxFiles: v })
                        }
                        label="Clean Auxiliary Files"
                        description="Remove .aux, .log, .toc and other temporary files after compilation"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-neutral-50">
                <button
                  onClick={
                    activeTab === "editor"
                      ? handleResetEditorSettings
                      : handleResetLatexSettings
                  }
                  className="text-xs text-muted hover:text-black transition-colors flex items-center gap-1"
                >
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
                  Reset to Defaults
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-sm font-medium border-2 border-black bg-white text-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
