import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import {
  CompilationResult,
  CompilationStatus,
  CompileOutputEvent,
  LaTeXCompilersStatus,
  LaTeXSettings,
} from "./types";

export interface CompilationOutput {
  line: string;
  isError: boolean;
  isWarning: boolean;
  timestamp: number;
}

export interface UseLatexCompilerOptions {
  settings: LaTeXSettings;
  projectPath: string | null;
  onCompileSuccess?: (result: CompilationResult) => void;
  onCompileError?: (error: string) => void;
}

export function useLatexCompiler({
  settings,
  projectPath,
  onCompileSuccess,
  onCompileError,
}: UseLatexCompilerOptions) {
  const [compilersStatus, setCompilersStatus] =
    useState<LaTeXCompilersStatus | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [status, setStatus] = useState<CompilationStatus>("idle");
  const [output, setOutput] = useState<CompilationOutput[]>([]);
  const [lastResult, setLastResult] = useState<CompilationResult | null>(null);

  const unlistenRef = useRef<UnlistenFn | null>(null);

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

  // Set up event listener for compile output
  useEffect(() => {
    let mounted = true;

    const setupListener = async () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }

      unlistenRef.current = await listen<CompileOutputEvent>(
        "latex-compile-output",
        (event) => {
          if (!mounted) return;
          const { line, is_error, is_warning } = event.payload;
          setOutput((prev) => [
            ...prev,
            {
              line,
              isError: is_error,
              isWarning: is_warning,
              timestamp: Date.now(),
            },
          ]);
        }
      );
    };

    setupListener();

    return () => {
      mounted = false;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);

  // Compile function
  const compile = useCallback(
    async (mainFileOverride?: string) => {
      if (!projectPath) {
        onCompileError?.("No project open");
        return null;
      }

      const mainFile = mainFileOverride || settings.mainFile;
      if (!mainFile) {
        onCompileError?.("No main file selected");
        return null;
      }

      // Clear previous output
      setOutput([]);
      setStatus("compiling");
      setLastResult(null);

      try {
        // Build arguments
        const args: string[] = [...settings.arguments];

        if (settings.synctex) {
          args.push("-synctex=1");
        }

        // For latexmk, add appropriate flags
        if (settings.compiler === "latexmk") {
          args.push("-pdf");
          if (settings.synctex) {
            // latexmk handles synctex differently
            args.push("-synctex=1");
          }
        }

        const result = await invoke<CompilationResult>("latex_compile", {
          directory: projectPath,
          compiler: settings.compiler,
          mainFile,
          args,
          customPath: settings.customPath,
        });

        setLastResult(result);

        if (result.success) {
          setStatus("success");
          onCompileSuccess?.(result);

          // Clean aux files if enabled
          if (settings.cleanAuxFiles) {
            try {
              await invoke("latex_clean_aux_files", {
                directory: projectPath,
                mainFile,
              });
            } catch (cleanError) {
              console.error("Failed to clean aux files:", cleanError);
            }
          }
        } else {
          setStatus("error");
          onCompileError?.(result.error || "Compilation failed");
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setStatus("error");
        setLastResult({
          success: false,
          exit_code: null,
          pdf_path: null,
          error: errorMessage,
        });
        onCompileError?.(errorMessage);
        return null;
      }
    },
    [projectPath, settings, onCompileSuccess, onCompileError]
  );

  // Stop compilation
  const stopCompilation = useCallback(async () => {
    try {
      await invoke("latex_stop_compilation");
      setStatus("idle");
    } catch (error) {
      console.error("Failed to stop compilation:", error);
    }
  }, []);

  // Clear output
  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  // Reset status
  const resetStatus = useCallback(() => {
    setStatus("idle");
    setLastResult(null);
  }, []);

  return {
    // Compiler detection
    compilersStatus,
    isDetecting,
    detectCompilers,

    // Compilation
    status,
    output,
    lastResult,
    compile,
    stopCompilation,
    clearOutput,
    resetStatus,

    // Computed
    isCompiling: status === "compiling",
    hasError: status === "error",
    hasSuccess: status === "success",
    errorCount: output.filter((o) => o.isError).length,
    warningCount: output.filter((o) => o.isWarning).length,
  };
}
