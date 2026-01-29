import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_LATEX_SETTINGS,
  LaTeXSettings,
  LaTeXCompiler,
} from "./types";

const STORAGE_KEY = "latex-settings";

export function useLatexSettings() {
  const [settings, setSettings] = useState<LaTeXSettings>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_LATEX_SETTINGS;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_LATEX_SETTINGS, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_LATEX_SETTINGS;
  });

  // Persist settings to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<LaTeXSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const setCompiler = useCallback((compiler: LaTeXCompiler) => {
    updateSettings({ compiler });
  }, [updateSettings]);

  const setCustomPath = useCallback((customPath: string | null) => {
    updateSettings({ customPath });
  }, [updateSettings]);

  const setArguments = useCallback((args: string[]) => {
    updateSettings({ arguments: args });
  }, [updateSettings]);

  const setMainFile = useCallback((mainFile: string | null) => {
    updateSettings({ mainFile });
  }, [updateSettings]);

  const setSynctex = useCallback((synctex: boolean) => {
    updateSettings({ synctex });
  }, [updateSettings]);

  const setCleanAuxFiles = useCallback((cleanAuxFiles: boolean) => {
    updateSettings({ cleanAuxFiles });
  }, [updateSettings]);

  const setAutoCompileOnSave = useCallback((autoCompileOnSave: boolean) => {
    updateSettings({ autoCompileOnSave });
  }, [updateSettings]);

  const setAutoOpenPdf = useCallback((autoOpenPdf: boolean) => {
    updateSettings({ autoOpenPdf });
  }, [updateSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_LATEX_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    setCompiler,
    setCustomPath,
    setArguments,
    setMainFile,
    setSynctex,
    setCleanAuxFiles,
    setAutoCompileOnSave,
    setAutoOpenPdf,
    resetSettings,
  };
}
