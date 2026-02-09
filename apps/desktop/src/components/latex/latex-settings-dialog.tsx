"use client";

import { useCallback, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowCounterClockwiseIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import {
  LaTeXSettings,
  DEFAULT_LATEX_SETTINGS,
} from "@/lib/latex/types";
import { EditorSettings, MinimapSettings, DEFAULT_EDITOR_SETTINGS } from "@/lib/editor/types";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface LaTeXSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: LaTeXSettings;
  onUpdateSettings: (updates: Partial<LaTeXSettings>) => void;
  editorSettings: EditorSettings;
  onUpdateEditorSettings: (updates: Partial<EditorSettings>) => void;
  texFiles: string[];
}

// Section header component for visual grouping - editorial style
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-6 pb-2 border-t border-border mt-4 first:mt-0 first:border-t-0 first:pt-2">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
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
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <div className="flex-1">
        <span className="text-sm font-medium text-foreground-secondary group-hover:text-foreground transition-colors">
          {label}
        </span>
        <p className="text-xs text-muted mt-0.5">{description}</p>
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
        <label className="text-sm font-medium text-foreground-secondary block">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Select value={String(value)} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AppearanceToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="py-2">
      <label className="text-sm font-medium block mb-2 text-foreground-secondary">
        Color Mode
      </label>
      <div className="flex">
        {([
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ] as const).map((mode, index) => (
          <button
            key={mode.value}
            onClick={() => setTheme(mode.value)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium border transition-all ${
              theme === mode.value
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted border-border hover:border-border-dark"
            } ${index === 0 ? "" : "-ml-px"}`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted mt-1.5">
        Controls the app and editor theme
      </p>
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
  const [activeTab, setActiveTab] = useState<string>("build");

  const handleResetLatexSettings = useCallback(() => {
    onUpdateSettings(DEFAULT_LATEX_SETTINGS);
  }, [onUpdateSettings]);

  const handleResetEditorSettings = useCallback(() => {
    onUpdateEditorSettings(DEFAULT_EDITOR_SETTINGS);
  }, [onUpdateEditorSettings]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-foreground/50 z-[9999]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] bg-background border-2 border-foreground shadow-[4px_4px_0_0_var(--foreground)] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Dialog.Title className="text-lg font-bold tracking-tight">
                Settings
              </Dialog.Title>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Auto-saved
              </span>
            </div>
            <Dialog.Close className="p-1.5 hover:bg-accent-hover transition-colors border border-transparent hover:border-border" aria-label="Close">
              <XIcon className="size-4" />
            </Dialog.Close>
          </div>

          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <Tabs.List className="flex border-b border-border shrink-0">
              <Tabs.Trigger
                value="build"
                className="flex-1 px-4 py-3 text-sm font-medium transition-colors relative text-muted-foreground hover:text-foreground data-[state=active]:text-foreground"
              >
                Build
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground transition-opacity opacity-0 data-[state=active]:opacity-100" />
              </Tabs.Trigger>
              <Tabs.Trigger
                value="editor"
                className="flex-1 px-4 py-3 text-sm font-medium transition-colors relative text-muted-foreground hover:text-foreground data-[state=active]:text-foreground"
              >
                Editor
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground transition-opacity opacity-0 data-[state=active]:opacity-100" />
              </Tabs.Trigger>
            </Tabs.List>

            {/* ===== EDITOR TAB ===== */}
            <Tabs.Content value="editor" className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              <SectionHeader>Appearance</SectionHeader>

              {/* Light/Dark Mode Toggle */}
              <AppearanceToggle />

              <SectionHeader>Keybindings</SectionHeader>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 border flex items-center justify-center font-mono text-xs font-bold tracking-tight transition-colors ${
                    editorSettings.vimMode
                      ? "bg-foreground border-foreground text-background"
                      : "bg-accent-hover border-border text-muted-foreground"
                  }`}>
                    Vi
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground-secondary">
                        Vim Mode
                      </span>
                      {editorSettings.vimMode && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-foreground text-background font-mono font-bold tracking-wider">
                          NORMAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
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
                <label className="text-sm font-medium text-foreground-secondary">
                  Font Size
                </label>
                <div className="flex items-center border border-border hover:border-border-dark transition-colors">
                  <button
                    onClick={() =>
                      onUpdateEditorSettings({
                        fontSize: Math.max(
                          8,
                          editorSettings.fontSize - 1,
                        ),
                      })
                    }
                    className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground hover:bg-accent-hover transition-colors border-r border-border"
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
                    className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground hover:bg-accent-hover transition-colors border-l border-border"
                    aria-label="Increase font size"
                  >
                    <PlusIcon className="size-3" />
                  </button>
                  <span className="text-xs text-muted-foreground px-2 border-l border-border">
                    px
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-foreground-secondary">
                  Line Height
                </label>
                <div className="flex items-center border border-border hover:border-border-dark transition-colors">
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
                    className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground hover:bg-accent-hover transition-colors border-r border-border"
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
                    className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground hover:bg-accent-hover transition-colors border-l border-border"
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
                    <span className="text-sm font-medium text-foreground-secondary">
                      Enable Minimap
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 border border-border text-muted font-medium uppercase tracking-wider">
                      Preview
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
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
                <div className="space-y-1 pl-4 border-l-2 border-border ml-1">
                  <div className="flex items-center justify-between py-2">
                    <label className="text-sm font-medium text-foreground-secondary">
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
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background text-muted border-border hover:border-border-dark"
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
                <div className="pl-4 border-l-2 border-border ml-1 py-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground-secondary">
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
                      className="w-20 px-3 py-2 text-sm text-center border border-border hover:border-border-dark focus:outline-none focus:border-foreground font-mono"
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

              <SectionHeader>Terminal</SectionHeader>

              <SelectField
                label="Shell Selection"
                value={editorSettings.terminalShellMode}
                onChange={(v) =>
                  onUpdateEditorSettings({
                    terminalShellMode: v as EditorSettings["terminalShellMode"],
                  })
                }
                options={[
                  { value: "auto", label: "Auto Detect" },
                  { value: "custom", label: "Custom" },
                ]}
                description="Auto mode chooses shell per OS fallback rules"
              />

              {editorSettings.terminalShellMode === "custom" && (
                <div className="pl-4 border-l-2 border-border ml-1 py-2">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-sm font-medium text-foreground-secondary shrink-0">
                      Shell Command
                    </label>
                    <input
                      type="text"
                      value={editorSettings.terminalShellPath}
                      onChange={(e) =>
                        onUpdateEditorSettings({
                          terminalShellPath: e.target.value,
                        })
                      }
                      placeholder="powershell.exe / pwsh / /bin/zsh"
                      className="w-full px-3 py-2 text-sm border border-border hover:border-border-dark focus:outline-none focus:border-foreground font-mono bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Leave empty to fall back to auto detection.
                  </p>
                </div>
              )}
            </Tabs.Content>

            {/* ===== BUILD TAB ===== */}
            <Tabs.Content value="build" className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              <SectionHeader>Main File</SectionHeader>

              <div className="py-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground-secondary">
                    Main .tex File
                  </label>
                </div>
                {texFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No .tex files found in project
                  </p>
                ) : (
                  <Select
                    value={settings.mainFile || ""}
                    onValueChange={(v) =>
                      onUpdateSettings({ mainFile: v || null })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select main .tex file..." />
                    </SelectTrigger>
                    <SelectContent>
                      {texFiles.map((file) => (
                        <SelectItem key={file} value={file}>
                          {file}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
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
                  className="w-full px-3 py-2.5 text-sm border border-border hover:border-border-dark focus:outline-none focus:border-foreground resize-none font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  The prompt sent to AI when compiling. Use {"{mainFile}"} as placeholder for the main file path.
                </p>
              </div>

              <SectionHeader>Git</SectionHeader>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 border flex items-center justify-center transition-colors ${
                    editorSettings.gitAutoFetchEnabled
                      ? "bg-foreground border-foreground"
                      : "bg-accent-hover border-border"
                  }`}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={editorSettings.gitAutoFetchEnabled ? "text-background" : "text-muted-foreground"}>
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 2.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM4.5 8a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm7 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" fill="currentColor" fillRule="evenodd"/>
                      <path d="M8 5.75v2.5M6 9l-1-.5M10 9l1-.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground-secondary">
                        Auto Fetch
                      </span>
                      {editorSettings.gitAutoFetchEnabled && (
                        <span className="text-[10px] px-1.5 py-0.5 border border-emerald-300 text-emerald-600 font-medium uppercase tracking-wider bg-emerald-50">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
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
                <div className="pl-4 border-l-2 border-border ml-1">
                  <SelectField
                    label="Interval"
                    value={editorSettings.gitAutoFetchIntervalSeconds}
                    onChange={(v) =>
                      onUpdateEditorSettings({
                        gitAutoFetchIntervalSeconds: Math.min(
                          3600,
                          Math.max(15, parseInt(v, 10) || 120),
                        ),
                      })
                    }
                    options={[
                      { value: 30, label: "30 seconds" },
                      { value: 60, label: "1 minute" },
                      { value: 120, label: "2 minutes" },
                      { value: 300, label: "5 minutes" },
                      { value: 600, label: "10 minutes" },
                    ]}
                  />
                </div>
              )}
            </Tabs.Content>
          </Tabs.Root>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <button
              onClick={
                activeTab === "editor"
                  ? handleResetEditorSettings
                  : handleResetLatexSettings
              }
              className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1.5 group"
            >
              <ArrowCounterClockwiseIcon className="size-3.5 group-hover:rotate-[-45deg] transition-transform" />
              Reset to Defaults
            </button>
            <Dialog.Close className="px-6 py-2 text-sm font-medium bg-background text-foreground border-2 border-foreground shadow-[3px_3px_0_0_var(--foreground)] hover:shadow-[1px_1px_0_0_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              Done
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
