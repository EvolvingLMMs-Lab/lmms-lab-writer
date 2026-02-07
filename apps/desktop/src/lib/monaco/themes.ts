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

// Supplementary editor chrome colors - also overrides overly bright base theme values
const githubDarkEditorColors: Record<string, string> = {
  "editor.foreground": "#c9d1d9",
  "editorLineNumber.foreground": "#636e7b",
  "editorLineNumber.activeForeground": "#d1d5da",
  "editorCursor.background": "#24292e",
  "editor.selectionHighlightBackground": "#3b404866",
  "editor.lineHighlightBorder": "#00000000",
  "editorBracketMatch.background": "#3b404866",
  "editorBracketMatch.border": "#58a6ff",
  "editorGutter.background": "#24292e",
  "editorGutter.modifiedBackground": "#d29922",
  "editorGutter.addedBackground": "#56d364",
  "editorGutter.deletedBackground": "#f85149",
  "scrollbar.shadow": "#01040900",
  "scrollbarSlider.background": "#636e7b33",
  "scrollbarSlider.hoverBackground": "#636e7b55",
  "scrollbarSlider.activeBackground": "#636e7b77",
  "editorWidget.background": "#1b1f23",
  "editorWidget.border": "#3b4048",
  "editorWidget.foreground": "#c9d1d9",
  "editorSuggestWidget.background": "#1b1f23",
  "editorSuggestWidget.border": "#3b4048",
  "editorSuggestWidget.foreground": "#c9d1d9",
  "editorSuggestWidget.selectedBackground": "#3b4048",
  "editorSuggestWidget.highlightForeground": "#58a6ff",
  "editorHoverWidget.background": "#1b1f23",
  "editorHoverWidget.border": "#3b4048",
  "editorHoverWidget.foreground": "#c9d1d9",
  "editor.findMatchBackground": "#9e6a03aa",
  "editor.findMatchHighlightBackground": "#9e6a0355",
  "editor.findMatchBorder": "#d29922",
  "editor.wordHighlightBackground": "#3b404866",
  "editor.wordHighlightStrongBackground": "#3b404899",
  "minimap.background": "#24292e",
  "minimap.selectionHighlight": "#3b404899",
  "minimapSlider.background": "#636e7b20",
  "minimapSlider.hoverBackground": "#636e7b40",
  "minimapSlider.activeBackground": "#636e7b60",
  "editorOverviewRuler.border": "#3b4048",
  "editorOverviewRuler.findMatchForeground": "#d29922",
  "editorOverviewRuler.selectionHighlightForeground": "#a371f7",
  "editorError.foreground": "#f85149",
  "editorWarning.foreground": "#d29922",
  "editorInfo.foreground": "#58a6ff",
  "editorBracketHighlight.foreground1": "#58a6ff",
  "editorBracketHighlight.foreground2": "#a371f7",
  "editorBracketHighlight.foreground3": "#56d364",
  "editorBracketHighlight.unexpectedBracket.foreground": "#f85149",
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
