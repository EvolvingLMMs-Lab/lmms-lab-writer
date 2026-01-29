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

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "compiling":
        return "bg-yellow-500";
      default:
        return "bg-neutral-300";
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`btn btn-sm border-2 border-black transition-all flex items-center gap-2 bg-white text-black ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
        }`}
        title={isCompiling ? "Stop compilation (Esc)" : "Compile (Ctrl+Shift+B)"}
      >
        <span className={`size-2 rounded-full ${getStatusColor()}`} />
        {isCompiling ? (
          <>
            <Spinner className="size-3" />
            <span>Compiling...</span>
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Compile</span>
          </>
        )}
      </button>

      <button
        onClick={onSettingsClick}
        className="btn btn-sm border-2 border-black bg-white text-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-2"
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
