import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LATEX_SETTINGS, LaTeXSettings } from "./types";

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

  const setMainFile = useCallback((mainFile: string | null) => {
    updateSettings({ mainFile });
  }, [updateSettings]);

  const setCompilePrompt = useCallback((compilePrompt: string) => {
    updateSettings({ compilePrompt });
  }, [updateSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_LATEX_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    setMainFile,
    setCompilePrompt,
    resetSettings,
  };
}
