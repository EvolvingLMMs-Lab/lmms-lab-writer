"use client";

import { useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import { CompilationStatus } from "@/lib/latex/types";

interface CompileButtonProps {
  status: CompilationStatus;
  onCompile: () => void;
  onStop: () => void;
  onSettingsClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function CompileButton({
  status,
  onCompile,
  onStop,
  onSettingsClick,
  disabled,
  className = "",
}: CompileButtonProps) {
  const isCompiling = status === "compiling";

  const handleClick = useCallback(() => {
    if (isCompiling) {
      onStop();
    } else {
      onCompile();
    }
  }, [isCompiling, onCompile, onStop]);

  return (
    <div className={`flex items-center gap-2 h-8 ${className}`}>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`h-8 w-8 border border-border transition-colors flex items-center justify-center bg-white text-black ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-neutral-50 hover:border-neutral-400"
        }`}
        title={
          isCompiling ? "Stop compilation (Esc)" : "Compile (Ctrl+Shift+B)"
        }
      >
        {isCompiling ? (
          <Spinner className="size-4" />
        ) : (
          <svg
            className="size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>

      <button
        onClick={onSettingsClick}
        className="h-8 w-8 border border-border bg-white text-black hover:bg-neutral-50 hover:border-neutral-400 transition-colors flex items-center justify-center"
        title="LaTeX Settings"
        aria-label="LaTeX Settings"
      >
        <svg
          className="size-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  );
}
