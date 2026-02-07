"use client";

import type { Monaco } from "@monaco-editor/react";
import type { MonacoTheme } from "monaco-themes";
// Source: monaco-themes/themes/ (v0.4.8)
import githubLightTheme from "./github-light.json";
import githubDarkTheme from "./github-dark.json";

// Supplementary editor chrome colors not included in the base GitHub Light theme
const githubLightEditorColors: Record<string, string> = {
  "editorLineNumber.activeForeground": "#24292e",
  "editorCursor.background": "#ffffff",
  "editor.selectionHighlightBackground": "#c8c8fa88",
  "editor.lineHighlightBorder": "#00000000",
  "editorBracketMatch.background": "#c8c8fa66",
  "editorBracketMatch.border": "#586069",
  "editorGutter.background": "#ffffff",
  "editorGutter.modifiedBackground": "#e36209",
  "editorGutter.addedBackground": "#22863a",
  "editorGutter.deletedBackground": "#b31d28",
  "scrollbar.shadow": "#00000000",
  "scrollbarSlider.background": "#d4d4d4",
  "scrollbarSlider.hoverBackground": "#a3a3a3",
  "scrollbarSlider.activeBackground": "#737373",
  "editorWidget.background": "#fafbfc",
  "editorWidget.border": "#e1e4e8",
  "editorWidget.foreground": "#24292e",
  "editorSuggestWidget.background": "#fafbfc",
  "editorSuggestWidget.border": "#e1e4e8",
  "editorSuggestWidget.foreground": "#24292e",
  "editorSuggestWidget.selectedBackground": "#e1e4e8",
  "editorSuggestWidget.highlightForeground": "#005cc5",
  "editorHoverWidget.background": "#fafbfc",
  "editorHoverWidget.border": "#e1e4e8",
  "editorHoverWidget.foreground": "#24292e",
  "editor.findMatchBackground": "#ffdf5d66",
  "editor.findMatchHighlightBackground": "#ffdf5d33",
  "editor.findMatchBorder": "#e36209",
  "editor.wordHighlightBackground": "#c8c8fa44",
  "editor.wordHighlightStrongBackground": "#c8c8fa66",
  "minimap.background": "#fafbfc",
  "minimap.selectionHighlight": "#c8c8fa",
  "minimapSlider.background": "#d4d4d420",
  "minimapSlider.hoverBackground": "#d4d4d440",
  "minimapSlider.activeBackground": "#d4d4d460",
  "editorOverviewRuler.border": "#e1e4e8",
  "editorOverviewRuler.findMatchForeground": "#e36209",
  "editorOverviewRuler.selectionHighlightForeground": "#005cc5",
  "editorError.foreground": "#b31d28",
  "editorWarning.foreground": "#e36209",
  "editorInfo.foreground": "#005cc5",
  "editorBracketHighlight.foreground1": "#005cc5",
  "editorBracketHighlight.foreground2": "#6f42c1",
  "editorBracketHighlight.foreground3": "#22863a",
  "editorBracketHighlight.unexpectedBracket.foreground": "#b31d28",
};

// Supplementary editor chrome colors not included in the base GitHub Dark theme
const githubDarkEditorColors: Record<string, string> = {
  "editorLineNumber.foreground": "#6a737d",
  "editorLineNumber.activeForeground": "#f6f8fa",
  "editorCursor.background": "#24292e",
  "editor.selectionHighlightBackground": "#4c288966",
  "editor.lineHighlightBorder": "#00000000",
  "editorBracketMatch.background": "#4c288966",
  "editorBracketMatch.border": "#79b8ff",
  "editorGutter.background": "#24292e",
  "editorGutter.modifiedBackground": "#fb8532",
  "editorGutter.addedBackground": "#7bcc72",
  "editorGutter.deletedBackground": "#ea4a5a",
  "scrollbar.shadow": "#00000000",
  "scrollbarSlider.background": "#6a737d33",
  "scrollbarSlider.hoverBackground": "#6a737d55",
  "scrollbarSlider.activeBackground": "#6a737d77",
  "editorWidget.background": "#1f2428",
  "editorWidget.border": "#444d56",
  "editorWidget.foreground": "#f6f8fa",
  "editorSuggestWidget.background": "#1f2428",
  "editorSuggestWidget.border": "#444d56",
  "editorSuggestWidget.foreground": "#f6f8fa",
  "editorSuggestWidget.selectedBackground": "#444d56",
  "editorSuggestWidget.highlightForeground": "#79b8ff",
  "editorHoverWidget.background": "#1f2428",
  "editorHoverWidget.border": "#444d56",
  "editorHoverWidget.foreground": "#f6f8fa",
  "editor.findMatchBackground": "#4c288999",
  "editor.findMatchHighlightBackground": "#4c288944",
  "editor.findMatchBorder": "#79b8ff",
  "editor.wordHighlightBackground": "#444d5666",
  "editor.wordHighlightStrongBackground": "#444d5699",
  "minimap.background": "#24292e",
  "minimap.selectionHighlight": "#4c288999",
  "minimapSlider.background": "#6a737d20",
  "minimapSlider.hoverBackground": "#6a737d40",
  "minimapSlider.activeBackground": "#6a737d60",
  "editorOverviewRuler.border": "#444d56",
  "editorOverviewRuler.findMatchForeground": "#79b8ff",
  "editorOverviewRuler.selectionHighlightForeground": "#b392f0",
  "editorError.foreground": "#ea4a5a",
  "editorWarning.foreground": "#fb8532",
  "editorInfo.foreground": "#79b8ff",
  "editorBracketHighlight.foreground1": "#79b8ff",
  "editorBracketHighlight.foreground2": "#b392f0",
  "editorBracketHighlight.foreground3": "#7bcc72",
  "editorBracketHighlight.unexpectedBracket.foreground": "#ea4a5a",
};

export const defineEditorThemes = (monaco: Monaco) => {
  // GitHub Light theme - imported from monaco-themes package
  const lightTheme = githubLightTheme as MonacoTheme;
  monaco.editor.defineTheme("one-light", {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      ...githubLightEditorColors,
    },
  });

  // GitHub Dark theme - imported from monaco-themes package
  const darkTheme = githubDarkTheme as MonacoTheme;
  monaco.editor.defineTheme("one-dark", {
    ...darkTheme,
    colors: {
      ...darkTheme.colors,
      ...githubDarkEditorColors,
    },
  });
};
