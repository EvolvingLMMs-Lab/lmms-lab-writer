"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import { ChevronIcon, ImageIcon, SendIcon, StopIcon } from "./icons";
import type { AttachedFile } from "./types";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

function useDropdownPosition(
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  menuRef: React.RefObject<HTMLDivElement | null>,
) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [positioned, setPositioned] = useState(false);

  const openMenu = useCallback(() => {
    setPositioned(false);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setPositioned(false);
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, menuRef, triggerRef, close]);

  // Calculate position before paint, re-runs when open state changes
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();

    let x = triggerRect.left;
    let y = triggerRect.top - menuRect.height - 4; // above trigger

    // Keep within viewport horizontally
    if (x + menuRect.width > window.innerWidth) {
      x = window.innerWidth - menuRect.width - 8;
    }
    x = Math.max(8, x);

    // If not enough space above, position below
    if (y < 8) {
      y = triggerRect.bottom + 4;
    }

    setPos((prev) => {
      if (prev.x === x && prev.y === y) return prev;
      return { x, y };
    });
    setPositioned(true);
  }, [open, triggerRef, menuRef]);

  return { open, pos, positioned, openMenu, close };
}

function CustomSelect({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { open, pos, positioned, openMenu, close } = useDropdownPosition(
    triggerRef,
    menuRef,
  );

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        className={`flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer ${className || ""}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronIcon className="size-3 text-muted-foreground flex-shrink-0" />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[160px] max-h-[240px] overflow-y-auto border border-border bg-background shadow-lg rounded-lg py-1"
            style={{ left: pos.x, top: pos.y, visibility: positioned ? "visible" : "hidden" }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  close();
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  opt.value === value
                    ? "bg-surface-secondary text-foreground font-medium"
                    : "text-muted hover:bg-accent-hover hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

function GroupedSelect({
  value,
  groups,
  displayLabel,
  onChange,
  className,
}: {
  value: string;
  groups: SelectOptionGroup[];
  displayLabel?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const { open, pos, positioned, openMenu: rawOpen, close: rawClose } = useDropdownPosition(
    triggerRef,
    menuRef,
  );

  const openMenu = useCallback(() => {
    setActiveGroup(null);
    rawOpen();
  }, [rawOpen]);

  const close = useCallback(() => {
    setActiveGroup(null);
    rawClose();
  }, [rawClose]);

  // Find which group currently contains the selected value
  const selectedGroup = useMemo(() => {
    for (const group of groups) {
      if (group.options.some((o) => o.value === value)) return group.label;
    }
    return null;
  }, [value, groups]);

  const selectedLabel = useMemo(() => {
    if (displayLabel) return displayLabel;
    for (const group of groups) {
      const found = group.options.find((o) => o.value === value);
      if (found) return found.label;
    }
    return value;
  }, [value, groups, displayLabel]);

  const currentGroup = activeGroup
    ? groups.find((g) => g.label === activeGroup)
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        className={`flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer ${className || ""}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronIcon className="size-3 text-muted-foreground flex-shrink-0" />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[180px] max-h-[300px] overflow-y-auto border border-border bg-background shadow-lg rounded-lg py-1"
            style={{ left: pos.x, top: pos.y, visibility: positioned ? "visible" : "hidden" }}
          >
            {currentGroup ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveGroup(null)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-muted transition-colors border-b border-surface-secondary mb-1"
                >
                  <CaretLeftIcon className="size-3" />
                  <span className="font-medium">{currentGroup.label}</span>
                </button>
                {currentGroup.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      close();
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      opt.value === value
                        ? "bg-surface-secondary text-foreground font-medium"
                        : "text-muted hover:bg-accent-hover hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </>
            ) : (
              groups.map((group) => (
                <button
                  key={group.label}
                  type="button"
                  onClick={() => setActiveGroup(group.label)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${
                    group.label === selectedGroup
                      ? "bg-surface-secondary text-foreground font-medium"
                      : "text-muted hover:bg-accent-hover hover:text-foreground"
                  }`}
                >
                  <span>{group.label}</span>
                  <CaretRightIcon className="size-3 text-muted-foreground" />
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

export function InputArea({
  input,
  setInput,
  attachedFiles,
  setAttachedFiles,
  onSend,
  onAbort,
  isWorking,
  agents,
  providers,
  selectedAgent,
  selectedModel,
  onSelectAgent,
  onSelectModel,
}: {
  input: string;
  setInput: (v: string) => void;
  attachedFiles: AttachedFile[];
  setAttachedFiles: (files: AttachedFile[]) => void;
  onSend: () => void;
  onAbort: () => void;
  isWorking: boolean;
  agents: { id: string; name: string; description?: string }[];
  providers: {
    id: string;
    name: string;
    models: {
      id: string;
      name: string;
      options?: { max?: boolean; reasoning?: boolean };
    }[];
  }[];
  selectedAgent: string | null;
  selectedModel: { providerId: string; modelId: string } | null;
  onSelectAgent: (agentId: string | null) => void;
  onSelectModel: (m: { providerId: string; modelId: string } | null) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: AttachedFile[] = [];
    for (const file of Array.from(files)) {
      // Only accept images
      if (!file.type.startsWith('image/')) continue;

      // Convert to base64 data URL
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newFiles.push({
        url: dataUrl,
        mime: file.type,
        filename: file.name,
      });
    }

    setAttachedFiles([...attachedFiles, ...newFiles]);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [attachedFiles, setAttachedFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  }, [attachedFiles, setAttachedFiles]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length === 0) return;

    // Prevent default paste behavior for images
    e.preventDefault();

    const newFiles: AttachedFile[] = [];
    for (const file of imageFiles) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newFiles.push({
        url: dataUrl,
        mime: file.type,
        filename: file.name || `pasted-image-${Date.now()}.${file.type.split('/')[1] || 'png'}`,
      });
    }

    setAttachedFiles([...attachedFiles, ...newFiles]);
  }, [attachedFiles, setAttachedFiles]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Handle keyboard navigation for image preview modal
  useEffect(() => {
    if (previewIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewIndex(null);
      } else if (e.key === "ArrowLeft" && attachedFiles.length > 1) {
        setPreviewIndex((prev) => (prev! - 1 + attachedFiles.length) % attachedFiles.length);
      } else if (e.key === "ArrowRight" && attachedFiles.length > 1) {
        setPreviewIndex((prev) => (prev! + 1) % attachedFiles.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, attachedFiles.length]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const _selectedAgentName = useMemo(() => {
    return agents.find((a) => a.id === selectedAgent)?.name || "Agent";
  }, [selectedAgent, agents]);

  let selectedModelInfo = { name: "Model", provider: "", isMax: false };
  if (selectedModel) {
    for (const provider of providers) {
      const model = provider.models?.find(
        (m) => m.id === selectedModel.modelId,
      );
      if (model) {
        selectedModelInfo = {
          name: model.name,
          provider: provider.name,
          isMax: model.options?.max ?? false,
        };
        break;
      }
    }
  }

  return (
    <div className="border border-border rounded-xl bg-accent-hover focus-within:border-border-dark focus-within:bg-background transition-all">
        {/* Attached images preview - above textarea */}
        {attachedFiles.length > 0 && (
          <div className="flex gap-2 px-3 pt-3 pb-1 overflow-x-auto">
            {attachedFiles.map((file, index) => (
              <div key={index} className="relative flex-shrink-0 group">
                <button
                  onClick={() => setPreviewIndex(index)}
                  className="block focus:outline-none focus:ring-2 focus:ring-accent rounded"
                  title="Click to preview"
                >
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="h-16 w-16 object-cover rounded border border-border cursor-zoom-in hover:border-border-dark transition-colors"
                  />
                </button>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute -top-1.5 -right-1.5 size-5 bg-foreground text-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder='Ask anything... "Add unit tests for the user service"'
          disabled={isWorking}
          className={`w-full min-h-[44px] max-h-[200px] px-4 py-3 resize-none focus:outline-none text-sm bg-transparent placeholder:text-muted-foreground ${attachedFiles.length > 0 ? 'pt-2' : ''}`}
          rows={1}
        />
        <div className="flex items-center gap-2 px-3 py-2">
          <CustomSelect
            value={selectedAgent || ""}
            options={agents
              .filter((a) => a?.id)
              .map((a) => ({ value: a.id, label: a.name }))}
            onChange={(v) => onSelectAgent(v || null)}
          />

          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <GroupedSelect
              value={
                selectedModel
                  ? `${selectedModel.providerId}:${selectedModel.modelId}`
                  : ""
              }
              displayLabel={
                selectedModelInfo.name !== "Model"
                  ? `${selectedModelInfo.name} (${selectedModelInfo.provider})`
                  : undefined
              }
              groups={providers
                .filter((p) => p?.id && (p.models || []).length > 0)
                .map((provider) => ({
                  label: provider.name,
                  options: (provider.models || [])
                    .filter((m) => m?.id)
                    .map((model) => ({
                      value: `${provider.id}:${model.id}`,
                      label: model.name,
                    })),
                }))}
              onChange={(v) => {
                const [providerId, modelId] = v.split(":");
                if (providerId && modelId) {
                  onSelectModel({ providerId, modelId });
                } else {
                  onSelectModel(null);
                }
              }}
              className="min-w-0 max-w-[200px]"
            />
            {selectedModelInfo.isMax && (
              <span className="text-xs text-muted font-medium flex-shrink-0">
                Max
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
            className={`p-1.5 transition-colors flex-shrink-0 ${attachedFiles.length > 0
              ? "text-accent"
              : "text-muted-foreground hover:text-muted"
              } ${isWorking ? "opacity-50 cursor-not-allowed" : ""}`}
            title="Attach image"
          >
            <ImageIcon className="size-4" />
            {attachedFiles.length > 0 && (
              <span className="sr-only">{attachedFiles.length} attached</span>
            )}
          </button>

          {isWorking ? (
            <button
              onClick={onAbort}
              className="p-1.5 text-muted hover:text-foreground transition-colors"
              title="Stop"
            >
              <StopIcon className="size-5" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!input.trim() && attachedFiles.length === 0}
              className="p-1.5 bg-surface-tertiary hover:bg-border rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-surface-tertiary"
              title="Send"
            >
              <SendIcon className="size-4 text-muted" />
            </button>
          )}
        </div>

        {/* Image preview modal */}
        {previewIndex !== null && attachedFiles[previewIndex] && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80"
            onClick={() => setPreviewIndex(null)}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <img
                src={attachedFiles[previewIndex].url}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setPreviewIndex(null)}
                className="absolute top-2 right-2 size-8 bg-foreground/50 hover:bg-foreground/70 text-background rounded-full flex items-center justify-center transition-colors"
                title="Close"
              >
                <XIcon className="size-5" />
              </button>
              {/* Navigation arrows */}
              {attachedFiles.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex((previewIndex - 1 + attachedFiles.length) % attachedFiles.length);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 size-10 bg-foreground/50 hover:bg-foreground/70 text-background rounded-full flex items-center justify-center transition-colors"
                    title="Previous"
                  >
                    <CaretLeftIcon className="size-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex((previewIndex + 1) % attachedFiles.length);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-10 bg-foreground/50 hover:bg-foreground/70 text-background rounded-full flex items-center justify-center transition-colors"
                    title="Next"
                  >
                    <CaretRightIcon className="size-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
