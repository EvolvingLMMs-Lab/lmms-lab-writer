"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { ChevronIcon, ImageIcon, SendIcon, StopIcon } from "./icons";
import type { AttachedFile } from "./types";

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

  const selectedAgentName = useMemo(() => {
    return agents.find((a) => a.id === selectedAgent)?.name || "Agent";
  }, [selectedAgent, agents]);

  const selectedModelInfo = useMemo(() => {
    if (!selectedModel) return { name: "Model", provider: "", isMax: false };
    for (const provider of providers) {
      const model = provider.models?.find(
        (m) => m.id === selectedModel.modelId,
      );
      if (model) {
        return {
          name: model.name,
          provider: provider.name,
          isMax: model.options?.max ?? false,
        };
      }
    }
    return { name: "Model", provider: "", isMax: false };
  }, [selectedModel, providers]);

  return (
    <div className="flex-shrink-0 bg-white p-4">
      <div className="border border-neutral-200 rounded-xl bg-neutral-50 focus-within:border-neutral-400 focus-within:bg-white transition-all">
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
                    className="h-16 w-16 object-cover rounded border border-neutral-200 cursor-zoom-in hover:border-neutral-400 transition-colors"
                  />
                </button>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute -top-1.5 -right-1.5 size-5 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
          className={`w-full min-h-[44px] max-h-[200px] px-4 py-3 resize-none focus:outline-none text-sm bg-transparent placeholder:text-neutral-400 ${attachedFiles.length > 0 ? 'pt-2' : ''}`}
          rows={1}
        />
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="relative">
            <select
              value={selectedAgent || ""}
              onChange={(e) => onSelectAgent(e.target.value || null)}
              className="text-xs bg-transparent pr-5 py-1 focus:outline-none appearance-none cursor-pointer text-neutral-600 hover:text-black font-medium"
            >
              {agents
                .filter((a) => a?.id)
                .map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
            </select>
            <ChevronIcon className="size-3 text-neutral-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="relative min-w-0 flex-1 max-w-[200px]">
              <select
                value={
                  selectedModel
                    ? `${selectedModel.providerId}:${selectedModel.modelId}`
                    : ""
                }
                onChange={(e) => {
                  const [providerId, modelId] = e.target.value.split(":");
                  if (providerId && modelId) {
                    onSelectModel({ providerId, modelId });
                  } else {
                    onSelectModel(null);
                  }
                }}
                className="text-xs bg-transparent w-full pr-5 py-1 focus:outline-none appearance-none cursor-pointer text-neutral-600 hover:text-black font-medium truncate"
              >
                {providers
                  .filter((p) => p?.id)
                  .flatMap((provider) =>
                    (provider.models || [])
                      .filter((m) => m?.id)
                      .map((model) => (
                        <option
                          key={`${provider.id}:${model.id}`}
                          value={`${provider.id}:${model.id}`}
                        >
                          {model.name} ({provider.name})
                        </option>
                      )),
                  )}
              </select>
              <ChevronIcon className="size-3 text-neutral-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {selectedModelInfo.isMax && (
              <span className="text-xs text-neutral-500 font-medium flex-shrink-0">
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
              : "text-neutral-400 hover:text-neutral-600"
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
              className="p-1.5 text-neutral-500 hover:text-black transition-colors"
              title="Stop"
            >
              <StopIcon className="size-5" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!input.trim() && attachedFiles.length === 0}
              className="p-1.5 bg-neutral-200 hover:bg-neutral-300 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-neutral-200"
              title="Send"
            >
              <SendIcon className="size-4 text-neutral-600" />
            </button>
          )}
        </div>

        {/* Image preview modal */}
        {previewIndex !== null && attachedFiles[previewIndex] && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
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
                className="absolute top-2 right-2 size-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                title="Close"
              >
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Navigation arrows */}
              {attachedFiles.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex((previewIndex - 1 + attachedFiles.length) % attachedFiles.length);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 size-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                    title="Previous"
                  >
                    <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex((previewIndex + 1) % attachedFiles.length);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                    title="Next"
                  >
                    <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
