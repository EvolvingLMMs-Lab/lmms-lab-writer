import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { DEFAULT_LATEX_SETTINGS, LaTeXSettings, MainFileDetectionResult } from "./types";

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

  const [detectionResult, setDetectionResult] = useState<MainFileDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

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

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_LATEX_SETTINGS);
  }, []);

  // Detect main file in the project directory
  const detectMainFile = useCallback(async (projectPath: string): Promise<MainFileDetectionResult | null> => {
    if (!projectPath) return null;

    setIsDetecting(true);
    try {
      const result = await invoke<MainFileDetectionResult>("latex_detect_main_file", {
        directory: projectPath,
        configuredMainFile: settings.mainFile,
      });

      setDetectionResult(result);

      // Auto-set main file if detection succeeded without user input
      if (result.main_file && !result.needs_user_input) {
        setMainFile(result.main_file);
      }

      return result;
    } catch (error) {
      console.error("Failed to detect main file:", error);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, [settings.mainFile, setMainFile]);

  // Get the effective main file for compilation
  const getEffectiveMainFile = useCallback(async (projectPath: string): Promise<string | null> => {
    // If we already have a valid main file configured, check if it exists
    if (settings.mainFile) {
      const result = await detectMainFile(projectPath);
      if (result?.main_file) {
        return result.main_file;
      }
    }

    // Otherwise, try to detect
    const result = await detectMainFile(projectPath);
    return result?.main_file || null;
  }, [settings.mainFile, detectMainFile]);

  return {
    settings,
    updateSettings,
    setMainFile,
    resetSettings,
    // Main file detection
    detectMainFile,
    getEffectiveMainFile,
    detectionResult,
    isDetecting,
  };
}
