"use client";

import { useEffect } from "react";

interface UseKeyboardShortcutsOptions {
  handleOpenFolder: () => void;
  selectedFile: string | undefined;
  handleCloseTab: (path: string) => void;
  projectPath: string | null;
  handleCompileWithDetection: () => void;
}

export function useKeyboardShortcuts({
  handleOpenFolder,
  selectedFile,
  handleCloseTab,
  projectPath,
  handleCompileWithDetection,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (isMod && key === "o" && !e.shiftKey) {
        e.preventDefault();
        handleOpenFolder();
        return;
      }

      if (isMod && key === "w" && !e.shiftKey) {
        e.preventDefault();
        if (selectedFile) {
          handleCloseTab(selectedFile);
        }
        return;
      }

      // Compile with AI: Cmd/Ctrl+Shift+B
      if (isMod && e.shiftKey && key === "b") {
        e.preventDefault();
        if (projectPath) {
          handleCompileWithDetection();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [
    handleOpenFolder,
    selectedFile,
    handleCloseTab,
    projectPath,
    handleCompileWithDetection,
  ]);
}
