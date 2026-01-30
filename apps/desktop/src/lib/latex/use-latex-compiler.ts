import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LaTeXCompilersStatus, LaTeXSettings } from "./types";

export interface UseLatexCompilerOptions {
  settings: LaTeXSettings;
  projectPath: string | null;
}

export function useLatexCompiler({
  settings,
  projectPath,
}: UseLatexCompilerOptions) {
  const [compilersStatus, setCompilersStatus] =
    useState<LaTeXCompilersStatus | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Detect installed compilers
  const detectCompilers = useCallback(async () => {
    setIsDetecting(true);
    try {
      const result = await invoke<LaTeXCompilersStatus>("latex_detect_compilers");
      setCompilersStatus(result);
      return result;
    } catch (error) {
      console.error("Failed to detect compilers:", error);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  // Detect compilers on mount
  useEffect(() => {
    detectCompilers();
  }, [detectCompilers]);

  return {
    // Compiler detection
    compilersStatus,
    isDetecting,
    detectCompilers,
  };
}
