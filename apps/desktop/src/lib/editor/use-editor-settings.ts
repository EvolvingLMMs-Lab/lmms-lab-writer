import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { DEFAULT_EDITOR_SETTINGS, DEFAULT_MINIMAP_SETTINGS, EditorSettings, EditorTheme } from "./types";

const STORAGE_KEY = "editor-settings";

// Migration helper for backward compatibility
function migrateSettings(parsed: Record<string, unknown>): EditorSettings {
  const settings = { ...DEFAULT_EDITOR_SETTINGS, ...parsed };

  // Remove legacy theme field (now auto-follows app mode)
  if ("theme" in settings) {
    delete (settings as Record<string, unknown>).theme;
  }

  // Migrate old boolean minimap format to new object format
  if (typeof parsed.minimap === "boolean") {
    settings.minimap = {
      ...DEFAULT_MINIMAP_SETTINGS,
      enabled: parsed.minimap,
    };
  } else if (parsed.minimap && typeof parsed.minimap === "object") {
    settings.minimap = { ...DEFAULT_MINIMAP_SETTINGS, ...parsed.minimap };
  }

  if (typeof parsed.gitAutoFetchIntervalSeconds === "number") {
    settings.gitAutoFetchIntervalSeconds = Math.min(
      3600,
      Math.max(15, Math.round(parsed.gitAutoFetchIntervalSeconds)),
    );
  }

  if (
    settings.terminalShellMode !== "auto" &&
    settings.terminalShellMode !== "custom"
  ) {
    settings.terminalShellMode = DEFAULT_EDITOR_SETTINGS.terminalShellMode;
  }

  if (typeof settings.terminalShellPath !== "string") {
    settings.terminalShellPath = DEFAULT_EDITOR_SETTINGS.terminalShellPath;
  } else {
    settings.terminalShellPath = settings.terminalShellPath.trim();
  }

  return settings as EditorSettings;
}

export function useEditorSettings() {
  const { resolvedTheme } = useTheme();

  const [settings, setSettings] = useState<EditorSettings>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_EDITOR_SETTINGS;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return migrateSettings(parsed);
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_EDITOR_SETTINGS;
  });

  // Derive editor theme from app theme
  const editorTheme: EditorTheme = resolvedTheme === "dark" ? "one-dark" : "one-light";

  // Persist settings to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<EditorSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_EDITOR_SETTINGS);
  }, []);

  return {
    settings,
    editorTheme,
    updateSettings,
    resetSettings,
  };
}
