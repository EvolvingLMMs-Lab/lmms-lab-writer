"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompilationOutput } from "@/lib/latex/use-latex-compiler";
import { CompilationStatus } from "@/lib/latex/types";

interface CompilationOutputPanelProps {
  output: CompilationOutput[];
  status: CompilationStatus;
  errorCount: number;
  warningCount: number;
  onClear: () => void;
  onFixWithAI?: (errorMessage: string) => void;
  className?: string;
}

export function CompilationOutputPanel({
  output,
  status,
  errorCount,
  warningCount,
  onClear,
  onFixWithAI,
  className = "",
}: CompilationOutputPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("compilationOutputHeight");
      return saved ? parseInt(saved, 10) : 200;
    }
    return 200;
  });
  const [isResizing, setIsResizing] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef(height);

  // Auto-expand on compilation start

  useEffect(() => {
    if (status === "compiling") {
      setIsExpanded(true);
    }
  }, [status]);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current && isExpanded) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isExpanded]);

  // Save height preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("compilationOutputHeight", String(height));
    }
  }, [height]);

  // Resize handling
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = outputRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newHeight = Math.max(100, Math.min(500, rect.bottom - e.clientY));
      heightRef.current = newHeight;
      document.documentElement.style.setProperty(
        "--output-height",
        `${newHeight}px`,
      );
    };

    const handleMouseUp = () => {
      setHeight(heightRef.current);
      document.documentElement.style.removeProperty("--output-height");
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Extract error/warning lines for AI fix
  const handleFixWithAI = useCallback(() => {
    if (!onFixWithAI) return;

    // Get error and warning lines
    const errorLines = output
      .filter((line) => line.isError || line.isWarning)
      .map((line) => line.line)
      .join("\n");

    // Also get some context lines around errors
    const allOutput = output.map((line) => line.line).join("\n");

    // Generate different prompts based on compilation status
    const isFailed = status === "error";
    const issueType = isFailed
      ? "errors"
      : errorCount > 0 && warningCount > 0
        ? "errors and warnings"
        : errorCount > 0
          ? "errors"
          : "warnings";

    const prompt = isFailed
      ? `LaTeX compilation failed with the following errors:

\`\`\`
${errorLines || allOutput.slice(-2000)}
\`\`\`

Please analyze these LaTeX compilation errors and fix them in the source files.`
      : `LaTeX compilation succeeded but with ${issueType}:

\`\`\`
${errorLines || allOutput.slice(-2000)}
\`\`\`

Please analyze these ${issueType} and suggest how to fix or suppress them. If they are minor issues (like package update reminders), explain what they mean and whether they can be safely ignored.`;

    onFixWithAI(prompt);
  }, [output, onFixWithAI, status, errorCount, warningCount]);

  const getStatusBadge = () => {
    if (status === "compiling") {
      return (
        <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800">
          Compiling...
        </span>
      );
    }
    if (status === "success") {
      return (
        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800">
          Success
        </span>
      );
    }
    if (status === "error") {
      return (
        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800">
          Failed
        </span>
      );
    }
    return null;
  };

  if (!isExpanded && output.length === 0 && status === "idle") {
    return null;
  }

  return (
    <div className={`border-t border-border bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium hover:text-black text-muted transition-colors"
          >
            <svg
              className={`size-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            Compilation Output
          </button>
          {getStatusBadge()}
          {errorCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700">
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700">
              {warningCount} warning{warningCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onFixWithAI &&
            (status === "error" ||
              (status === "success" &&
                (errorCount > 0 || warningCount > 0))) && (
              <button
                onClick={handleFixWithAI}
                className="text-xs px-2 py-0.5 bg-white text-black border border-black hover:bg-neutral-100 transition-colors flex items-center gap-1"
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Fix with AI
              </button>
            )}
          {output.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-muted hover:text-black transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Output content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: isResizing ? "var(--output-height)" : height }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden relative"
          >
            {/* Resize handle */}
            <div
              onMouseDown={() => setIsResizing(true)}
              className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-black/10 z-10"
            />

            <div
              ref={outputRef}
              className="h-full overflow-auto font-mono text-xs p-2 bg-neutral-900 text-neutral-100"
            >
              {output.length === 0 ? (
                <div className="text-neutral-500 italic">
                  No compilation output yet. Press Compile or Ctrl+Shift+B to
                  start.
                </div>
              ) : (
                output.map((line, index) => (
                  <div
                    key={index}
                    className={`whitespace-pre-wrap ${
                      line.isError
                        ? "text-red-400"
                        : line.isWarning
                          ? "text-yellow-400"
                          : "text-neutral-300"
                    }`}
                  >
                    {line.line}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
