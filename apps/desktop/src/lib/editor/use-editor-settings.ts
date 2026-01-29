import { useCallback, useEffect, useState } from "react";
import { DEFAULT_EDITOR_SETTINGS, DEFAULT_MINIMAP_SETTINGS, EditorSettings } from "./types";

const STORAGE_KEY = "editor-settings";

// Migration helper for backward compatibility
function migrateSettings(parsed: Record<string, unknown>): EditorSettings {
  const settings = { ...DEFAULT_EDITOR_SETTINGS, ...parsed };

  // Migrate old boolean minimap format to new object format
  if (typeof parsed.minimap === "boolean") {
    settings.minimap = {
      ...DEFAULT_MINIMAP_SETTINGS,
      enabled: parsed.minimap,
    };
  } else if (parsed.minimap && typeof parsed.minimap === "object") {
    settings.minimap = { ...DEFAULT_MINIMAP_SETTINGS, ...parsed.minimap };
  }

  return settings as EditorSettings;
}

export function useEditorSettings() {
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
    updateSettings,
    resetSettings,
  };
}
