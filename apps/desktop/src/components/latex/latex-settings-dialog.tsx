"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  LaTeXSettings,
  DEFAULT_LATEX_SETTINGS,
} from "@/lib/latex/types";
import { EditorSettings, MinimapSettings, DEFAULT_EDITOR_SETTINGS, EDITOR_THEMES } from "@/lib/editor/types";
import { Switch } from "@/components/ui/switch";

interface LaTeXSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: LaTeXSettings;
  onUpdateSettings: (updates: Partial<LaTeXSettings>) => void;
  editorSettings: EditorSettings;
  onUpdateEditorSettings: (updates: Partial<EditorSettings>) => void;
  texFiles: string[];
}

type SettingsTab = "editor" | "build";

// Section header component for visual grouping - editorial style
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-6 pb-2 border-t border-neutral-200 mt-4 first:mt-0 first:border-t-0 first:pt-2">
      <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
        {children}
      </h3>
    </div>
  );
}

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
    <label className="flex items-start gap-3 cursor-pointer group py-2">
      <div
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={`size-4 mt-0.5 border flex items-center justify-center transition-colors cursor-pointer ${
          checked
            ? "bg-black border-black"
            : "border-neutral-300 group-hover:border-black"
        }`}
      >
        {checked && <CheckIcon className="size-3 text-white" weight="bold" />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div className="flex-1">
        <span className="text-sm font-medium text-neutral-700 group-hover:text-black transition-colors">
          {label}
        </span>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
    </label>
  );
}

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
    <div className="flex items-center justify-between py-2 gap-8">
      <div className="shrink-0">
        <label className="text-sm font-medium text-neutral-700 block">
          {label}
        </label>
        {description && (
          <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 text-sm border border-neutral-200 hover:border-neutral-400 focus:outline-none focus:border-black bg-white min-w-[140px] cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
  texFiles,
}: LaTeXSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("build");

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  const handleResetLatexSettings = useCallback(() => {
    onUpdateSettings(DEFAULT_LATEX_SETTINGS);
  }, [onUpdateSettings]);

  const handleResetEditorSettings = useCallback(() => {
    onUpdateEditorSettings(DEFAULT_EDITOR_SETTINGS);
  }, [onUpdateEditorSettings]);

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
            className="fixed inset-0 bg-black/50 z-[9999]"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
          >
            <div
              className="bg-white border-2 border-black shadow-[4px_4px_0_0_#000] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold tracking-tight">Settings</h2>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Auto-saved
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200"
                  aria-label="Close"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-neutral-200">
                {(
                  [
                    { key: "build", label: "Build" },
                    { key: "editor", label: "Editor" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab.key
                        ? "text-black"
                        : "text-neutral-400 hover:text-black"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                {/* ===== EDITOR TAB ===== */}
                {activeTab === "editor" && (
                  <>
                    <SectionHeader>Theme</SectionHeader>

                    {/* Theme Selection */}
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Color Theme
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {EDITOR_THEMES.map((theme) => {
                          const isSelected = editorSettings.theme === theme.value;
                          const isDark = ["one-dark", "dracula", "nord"].includes(theme.value);

                          return (
                            <button
                              key={theme.value}
                              onClick={() =>
                                onUpdateEditorSettings({ theme: theme.value })
                              }
                              className={`flex items-center gap-2 p-2.5 border text-left transition-all ${
                                isSelected
                                  ? "border-black bg-neutral-50"
                                  : "border-border hover:border-neutral-400"
                              }`}
                            >
                              {/* Theme preview swatch */}
                              <div
                                className={`w-6 h-6 rounded border flex-shrink-0 ${
                                  isDark ? "border-neutral-600" : "border-neutral-300"
                                }`}
                                style={{
                                  background: isDark ? "#282c34" : "#ffffff",
                                }}
                              >
                                <div
                                  className="w-full h-1/3"
                                  style={{
                                    background:
                                      theme.value === "monochrome" ? "#0a0a0a" :
                                      theme.value === "github-light" ? "#cf222e" :
                                      theme.value === "solarized-light" ? "#859900" :
                                      theme.value === "one-dark" ? "#c678dd" :
                                      theme.value === "dracula" ? "#ff79c6" :
                                      theme.value === "nord" ? "#81a1c1" : "#0a0a0a",
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-medium block truncate">
                                  {theme.label}
                                </span>
                                <span className="text-xs text-muted truncate block">
                                  {theme.description}
                                </span>
                              </div>
                              {isSelected && (
                                <CheckIcon className="size-4 flex-shrink-0 text-black" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <SectionHeader>Keybindings</SectionHeader>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 border flex items-center justify-center font-mono text-xs font-bold tracking-tight transition-colors ${
                          editorSettings.vimMode
                            ? "bg-black border-black text-white"
                            : "bg-neutral-50 border-neutral-200 text-neutral-400"
                        }`}>
                          Vi
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-700">
                              Vim Mode
                            </span>
                            {editorSettings.vimMode && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-black text-white font-mono font-bold tracking-wider">
                                NORMAL
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Modal Vim-style keybindings in editor
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={editorSettings.vimMode}
                        onCheckedChange={(v) =>
                          onUpdateEditorSettings({ vimMode: v })
                        }
                      />
                    </div>

                    <SectionHeader>Display</SectionHeader>

                    <div className="flex items-center justify-between py-2">
                      <label className="text-sm font-medium text-neutral-700">
                        Font Size
                      </label>
                      <div className="flex items-center border border-neutral-200 hover:border-neutral-400 transition-colors">
                        <button
                          onClick={() =>
                            onUpdateEditorSettings({
                              fontSize: Math.max(
                                8,
                                editorSettings.fontSize - 1,
                              ),
                            })
                          }
                          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors border-r border-neutral-200"
                          aria-label="Decrease font size"
                        >
                          <MinusIcon className="size-3" />
                        </button>
                        <input
                          type="number"
                          min="8"
                          max="32"
                          value={editorSettings.fontSize}
                          onChange={(e) =>
                            onUpdateEditorSettings({
                              fontSize: Math.min(
                                32,
                                Math.max(8, parseInt(e.target.value) || 14),
                              ),
                            })
                          }
                          className="w-12 h-8 text-sm text-center border-0 focus:outline-none focus:ring-0 font-mono bg-transparent"
                        />
                        <button
                          onClick={() =>
                            onUpdateEditorSettings({
                              fontSize: Math.min(
                                32,
                                editorSettings.fontSize + 1,
                              ),
                            })
                          }
                          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors border-l border-neutral-200"
                          aria-label="Increase font size"
                        >
                          <PlusIcon className="size-3" />
                        </button>
                        <span className="text-xs text-neutral-400 px-2 border-l border-neutral-200">
                          px
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <label className="text-sm font-medium text-neutral-700">
                        Line Height
                      </label>
                      <div className="flex items-center border border-neutral-200 hover:border-neutral-400 transition-colors">
                        <button
                          onClick={() =>
                            onUpdateEditorSettings({
                              lineHeight: Math.max(
                                1.0,
                                Math.round(
                                  (editorSettings.lineHeight - 0.1) * 10,
                                ) / 10,
                              ),
                            })
                          }
                          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors border-r border-neutral-200"
                          aria-label="Decrease line height"
                        >
                          <MinusIcon className="size-3" />
                        </button>
                        <input
                          type="number"
                          min="1.0"
                          max="3.0"
                          step="0.1"
                          value={editorSettings.lineHeight.toFixed(1)}
                          onChange={(e) =>
                            onUpdateEditorSettings({
                              lineHeight: Math.min(
                                3.0,
                                Math.max(
                                  1.0,
                                  parseFloat(e.target.value) || 1.6,
                                ),
                              ),
                            })
                          }
                          className="w-12 h-8 text-sm text-center border-0 focus:outline-none focus:ring-0 font-mono bg-transparent"
                        />
                        <button
                          onClick={() =>
                            onUpdateEditorSettings({
                              lineHeight: Math.min(
                                3.0,
                                Math.round(
                                  (editorSettings.lineHeight + 0.1) * 10,
                                ) / 10,
                              ),
                            })
                          }
                          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors border-l border-neutral-200"
                          aria-label="Increase line height"
                        >
                          <PlusIcon className="size-3" />
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
                          renderWhitespace:
                            v as EditorSettings["renderWhitespace"],
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

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-700">
                            Enable Minimap
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 border border-neutral-300 text-neutral-500 font-medium uppercase tracking-wider">
                            Preview
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Code overview panel
                        </p>
                      </div>
                      <Switch
                        checked={editorSettings.minimap.enabled}
                        onCheckedChange={(v) =>
                          onUpdateEditorSettings({
                            minimap: {
                              ...editorSettings.minimap,
                              enabled: v,
                            },
                          })
                        }
                      />
                    </div>

                    {editorSettings.minimap.enabled && (
                      <div className="space-y-1 pl-4 border-l-2 border-neutral-200 ml-1">
                        <div className="flex items-center justify-between py-2">
                          <label className="text-sm font-medium text-neutral-700">
                            Position
                          </label>
                          <div className="flex">
                            {(["left", "right"] as const).map((side, index) => (
                              <button
                                key={side}
                                onClick={() =>
                                  onUpdateEditorSettings({
                                    minimap: {
                                      ...editorSettings.minimap,
                                      side,
                                    },
                                  })
                                }
                                className={`px-4 py-1.5 text-sm border transition-all ${
                                  editorSettings.minimap.side === side
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                                } ${index === 0 ? "" : "-ml-px"}`}
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
                      <div className="pl-4 border-l-2 border-neutral-200 ml-1 py-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-neutral-700">
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
                            className="w-20 px-3 py-2 text-sm text-center border border-neutral-200 hover:border-neutral-400 focus:outline-none focus:border-black font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <SelectField
                      label="Auto-close Brackets"
                      value={editorSettings.autoClosingBrackets}
                      onChange={(v) =>
                        onUpdateEditorSettings({
                          autoClosingBrackets:
                            v as EditorSettings["autoClosingBrackets"],
                        })
                      }
                      options={[
                        { value: "always", label: "Always" },
                        { value: "languageDefined", label: "Language Defined" },
                        {
                          value: "beforeWhitespace",
                          label: "Before Whitespace",
                        },
                        { value: "never", label: "Never" },
                      ]}
                    />

                    <SelectField
                      label="Auto-close Quotes"
                      value={editorSettings.autoClosingQuotes}
                      onChange={(v) =>
                        onUpdateEditorSettings({
                          autoClosingQuotes:
                            v as EditorSettings["autoClosingQuotes"],
                        })
                      }
                      options={[
                        { value: "always", label: "Always" },
                        { value: "languageDefined", label: "Language Defined" },
                        {
                          value: "beforeWhitespace",
                          label: "Before Whitespace",
                        },
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

                    <div className="py-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-neutral-700">
                          Main .tex File
                        </label>
                      </div>
                      {texFiles.length === 0 ? (
                        <p className="text-sm text-neutral-400 py-2">
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
                          className="w-full px-3 py-2.5 text-sm border border-neutral-200 hover:border-neutral-400 focus:outline-none focus:border-black bg-white cursor-pointer"
                        >
                          <option value="">Select main .tex file...</option>
                          {texFiles.map((file) => (
                            <option key={file} value={file}>
                              {file}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="text-xs text-neutral-400 mt-1.5">
                        The entry point for LaTeX compilation
                      </p>
                    </div>

                    <SectionHeader>AI Compile Prompt</SectionHeader>

                    <div className="py-2">
                      <textarea
                        value={settings.compilePrompt}
                        onChange={(e) =>
                          onUpdateSettings({ compilePrompt: e.target.value })
                        }
                        placeholder="Please compile the LaTeX document..."
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm border border-neutral-200 hover:border-neutral-400 focus:outline-none focus:border-black resize-none font-mono"
                      />
                      <p className="text-xs text-neutral-400 mt-1.5">
                        The prompt sent to AI when compiling. Use {"{mainFile}"} as placeholder for the main file path.
                      </p>
                    </div>

                    <SectionHeader>Git</SectionHeader>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 border flex items-center justify-center transition-colors ${
                          editorSettings.gitAutoFetchEnabled
                            ? "bg-black border-black"
                            : "bg-neutral-50 border-neutral-200"
                        }`}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={editorSettings.gitAutoFetchEnabled ? "text-white" : "text-neutral-400"}>
                            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 2.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM4.5 8a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm7 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" fill="currentColor" fillRule="evenodd"/>
                            <path d="M8 5.75v2.5M6 9l-1-.5M10 9l1-.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-700">
                              Auto Fetch
                            </span>
                            {editorSettings.gitAutoFetchEnabled && (
                              <span className="text-[10px] px-1.5 py-0.5 border border-emerald-300 text-emerald-600 font-medium uppercase tracking-wider bg-emerald-50">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Periodically sync remote refs in background
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={editorSettings.gitAutoFetchEnabled}
                        onCheckedChange={(v) =>
                          onUpdateEditorSettings({ gitAutoFetchEnabled: v })
                        }
                      />
                    </div>

                    {editorSettings.gitAutoFetchEnabled && (
                      <div className="pl-4 border-l-2 border-neutral-200 ml-1">
                        <div className="flex items-center justify-between py-2">
                          <label className="text-sm font-medium text-neutral-700">
                            Interval
                          </label>
                          <div className="flex flex-wrap justify-end gap-1">
                            {([
                              { value: 30, label: "30s" },
                              { value: 60, label: "1m" },
                              { value: 120, label: "2m" },
                              { value: 300, label: "5m" },
                              { value: 600, label: "10m" },
                            ] as const).map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() =>
                                  onUpdateEditorSettings({
                                    gitAutoFetchIntervalSeconds: opt.value,
                                  })
                                }
                                className={`px-2.5 py-1 text-xs font-medium border transition-all ${
                                  editorSettings.gitAutoFetchIntervalSeconds === opt.value
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-200">
                <button
                  onClick={
                    activeTab === "editor"
                      ? handleResetEditorSettings
                      : handleResetLatexSettings
                  }
                  className="text-xs text-neutral-500 hover:text-black transition-colors flex items-center gap-1.5 group"
                >
                  <ArrowCounterClockwiseIcon className="size-3.5 group-hover:rotate-[-45deg] transition-transform" />
                  Reset to Defaults
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-sm font-medium bg-white text-black border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
