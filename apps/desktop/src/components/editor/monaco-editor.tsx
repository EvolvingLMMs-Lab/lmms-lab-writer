"use client";

import "@/lib/monaco/config";

import { useRef, memo, useCallback, useEffect } from "react";
import Editor, { Monaco, OnMount, OnChange } from "@monaco-editor/react";
import type { editor, languages } from "monaco-editor";
import type { EditorSettings } from "@/lib/editor/types";

// Define all editor themes
const defineEditorThemes = (monaco: Monaco) => {
  // Monochrome theme - clean black and white
  monaco.editor.defineTheme("monochrome", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "", foreground: "0a0a0a", background: "ffffff" },
      { token: "comment", foreground: "737373", fontStyle: "italic" },
      { token: "comment.line", foreground: "737373", fontStyle: "italic" },
      { token: "comment.block", foreground: "737373", fontStyle: "italic" },
      { token: "keyword", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "keyword.control", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "keyword.operator", foreground: "0a0a0a" },
      { token: "string", foreground: "404040" },
      { token: "string.quoted", foreground: "404040" },
      { token: "string.escape", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "string.math", foreground: "404040" },
      { token: "number", foreground: "404040" },
      { token: "number.float", foreground: "404040" },
      { token: "variable", foreground: "0a0a0a" },
      { token: "variable.parameter", foreground: "404040" },
      { token: "variable.other", foreground: "0a0a0a" },
      { token: "entity.name.function", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "support.function", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "entity.name.type", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "entity.name.class", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "support.type", foreground: "0a0a0a" },
      { token: "support.class", foreground: "0a0a0a" },
      { token: "tag", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "tag.attribute.name", foreground: "404040" },
      { token: "tag.attribute.value", foreground: "404040" },
      { token: "operator", foreground: "0a0a0a" },
      { token: "delimiter", foreground: "404040" },
      { token: "delimiter.bracket", foreground: "404040" },
      { token: "constant", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "constant.language", foreground: "0a0a0a", fontStyle: "bold" },
      // LaTeX specific tokens
      { token: "keyword.latex", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "keyword.control.latex", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "support.function.latex", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "variable.parameter.latex", foreground: "404040" },
      { token: "punctuation.definition.latex", foreground: "0a0a0a" },
      { token: "markup.heading.latex", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "markup.italic.latex", foreground: "0a0a0a", fontStyle: "italic" },
      { token: "markup.bold.latex", foreground: "0a0a0a", fontStyle: "bold" },
      // Markdown
      { token: "markup.heading", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "markup.bold", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "markup.italic", foreground: "0a0a0a", fontStyle: "italic" },
      { token: "markup.underline.link", foreground: "404040" },
      { token: "invalid", foreground: "0a0a0a", fontStyle: "underline" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#0a0a0a",
      "editorLineNumber.foreground": "#a3a3a3",
      "editorLineNumber.activeForeground": "#0a0a0a",
      "editorCursor.foreground": "#0a0a0a",
      "editorCursor.background": "#ffffff",
      "editor.selectionBackground": "#e5e5e5",
      "editor.selectionHighlightBackground": "#e5e5e5",
      "editor.inactiveSelectionBackground": "#f0f0f0",
      "editor.lineHighlightBackground": "#f5f5f5",
      "editor.lineHighlightBorder": "#00000000",
      "editorBracketMatch.background": "#e5e5e5",
      "editorBracketMatch.border": "#a3a3a3",
      "editorIndentGuide.background": "#e5e5e5",
      "editorIndentGuide.activeBackground": "#a3a3a3",
      "editorWhitespace.foreground": "#e5e5e5",
      "editorGutter.background": "#ffffff",
      "editorGutter.modifiedBackground": "#737373",
      "editorGutter.addedBackground": "#404040",
      "editorGutter.deletedBackground": "#0a0a0a",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#d4d4d4",
      "scrollbarSlider.hoverBackground": "#a3a3a3",
      "scrollbarSlider.activeBackground": "#737373",
      "editorWidget.background": "#fafafa",
      "editorWidget.border": "#e5e5e5",
      "editorWidget.foreground": "#0a0a0a",
      "editorSuggestWidget.background": "#fafafa",
      "editorSuggestWidget.border": "#e5e5e5",
      "editorSuggestWidget.foreground": "#0a0a0a",
      "editorSuggestWidget.selectedBackground": "#e5e5e5",
      "editorSuggestWidget.highlightForeground": "#0a0a0a",
      "editorHoverWidget.background": "#fafafa",
      "editorHoverWidget.border": "#e5e5e5",
      "editorHoverWidget.foreground": "#0a0a0a",
      "editor.findMatchBackground": "#e5e5e5",
      "editor.findMatchHighlightBackground": "#f0f0f0",
      "editor.findMatchBorder": "#a3a3a3",
      "editor.wordHighlightBackground": "#f0f0f0",
      "editor.wordHighlightStrongBackground": "#e5e5e5",
      "minimap.background": "#fafafa",
      "minimap.selectionHighlight": "#d4d4d4",
      "minimapSlider.background": "#d4d4d420",
      "minimapSlider.hoverBackground": "#d4d4d440",
      "minimapSlider.activeBackground": "#d4d4d460",
      "editorOverviewRuler.border": "#e5e5e5",
      "editorOverviewRuler.findMatchForeground": "#a3a3a3",
      "editorOverviewRuler.selectionHighlightForeground": "#a3a3a3",
      "editorError.foreground": "#0a0a0a",
      "editorWarning.foreground": "#737373",
      "editorInfo.foreground": "#a3a3a3",
      "editorBracketHighlight.foreground1": "#0a0a0a",
      "editorBracketHighlight.foreground2": "#404040",
      "editorBracketHighlight.foreground3": "#737373",
      "editorBracketHighlight.unexpectedBracket.foreground": "#0a0a0a",
    },
  });

  // GitHub Light theme
  monaco.editor.defineTheme("github-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "", foreground: "24292f", background: "ffffff" },
      { token: "comment", foreground: "6e7781", fontStyle: "italic" },
      { token: "comment.line", foreground: "6e7781", fontStyle: "italic" },
      { token: "comment.block", foreground: "6e7781", fontStyle: "italic" },
      { token: "keyword", foreground: "cf222e" },
      { token: "keyword.control", foreground: "cf222e" },
      { token: "keyword.operator", foreground: "cf222e" },
      { token: "string", foreground: "0a3069" },
      { token: "string.quoted", foreground: "0a3069" },
      { token: "string.escape", foreground: "0550ae" },
      { token: "string.math", foreground: "0a3069" },
      { token: "number", foreground: "0550ae" },
      { token: "number.float", foreground: "0550ae" },
      { token: "variable", foreground: "953800" },
      { token: "variable.parameter", foreground: "24292f" },
      { token: "variable.other", foreground: "953800" },
      { token: "entity.name.function", foreground: "8250df" },
      { token: "support.function", foreground: "8250df" },
      { token: "entity.name.type", foreground: "953800" },
      { token: "entity.name.class", foreground: "953800" },
      { token: "support.type", foreground: "0550ae" },
      { token: "support.class", foreground: "953800" },
      { token: "tag", foreground: "116329" },
      { token: "tag.attribute.name", foreground: "0550ae" },
      { token: "tag.attribute.value", foreground: "0a3069" },
      { token: "operator", foreground: "24292f" },
      { token: "delimiter", foreground: "24292f" },
      { token: "delimiter.bracket", foreground: "24292f" },
      { token: "constant", foreground: "0550ae" },
      { token: "constant.language", foreground: "0550ae" },
      { token: "markup.heading", foreground: "0550ae", fontStyle: "bold" },
      { token: "markup.bold", foreground: "24292f", fontStyle: "bold" },
      { token: "markup.italic", foreground: "24292f", fontStyle: "italic" },
      { token: "markup.underline.link", foreground: "0969da" },
      { token: "invalid", foreground: "cf222e", fontStyle: "underline" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#24292f",
      "editorLineNumber.foreground": "#8c959f",
      "editorLineNumber.activeForeground": "#24292f",
      "editorCursor.foreground": "#044289",
      "editorCursor.background": "#ffffff",
      "editor.selectionBackground": "#0969da33",
      "editor.selectionHighlightBackground": "#0969da22",
      "editor.inactiveSelectionBackground": "#0969da22",
      "editor.lineHighlightBackground": "#eaeef2",
      "editor.lineHighlightBorder": "#00000000",
      "editorBracketMatch.background": "#0969da22",
      "editorBracketMatch.border": "#0969da",
      "editorIndentGuide.background": "#d8dee4",
      "editorIndentGuide.activeBackground": "#8c959f",
      "editorWhitespace.foreground": "#d8dee4",
      "editorGutter.background": "#ffffff",
      "editorGutter.modifiedBackground": "#9a6700",
      "editorGutter.addedBackground": "#1a7f37",
      "editorGutter.deletedBackground": "#cf222e",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#8c959f33",
      "scrollbarSlider.hoverBackground": "#8c959f55",
      "scrollbarSlider.activeBackground": "#8c959f77",
      "editorWidget.background": "#ffffff",
      "editorWidget.border": "#d0d7de",
      "editorWidget.foreground": "#24292f",
      "editorSuggestWidget.background": "#ffffff",
      "editorSuggestWidget.border": "#d0d7de",
      "editorSuggestWidget.foreground": "#24292f",
      "editorSuggestWidget.selectedBackground": "#0969da22",
      "editorSuggestWidget.highlightForeground": "#0969da",
      "editorHoverWidget.background": "#ffffff",
      "editorHoverWidget.border": "#d0d7de",
      "editorHoverWidget.foreground": "#24292f",
      "editor.findMatchBackground": "#bf8700",
      "editor.findMatchHighlightBackground": "#fae17d66",
      "editor.findMatchBorder": "#bf8700",
      "editor.wordHighlightBackground": "#0969da22",
      "editor.wordHighlightStrongBackground": "#0969da33",
      "minimap.background": "#ffffff",
      "minimap.selectionHighlight": "#0969da33",
      "minimapSlider.background": "#8c959f20",
      "minimapSlider.hoverBackground": "#8c959f40",
      "minimapSlider.activeBackground": "#8c959f60",
      "editorOverviewRuler.border": "#d0d7de",
      "editorOverviewRuler.findMatchForeground": "#bf8700",
      "editorOverviewRuler.selectionHighlightForeground": "#0969da",
      "editorError.foreground": "#cf222e",
      "editorWarning.foreground": "#9a6700",
      "editorInfo.foreground": "#0969da",
      "editorBracketHighlight.foreground1": "#0550ae",
      "editorBracketHighlight.foreground2": "#953800",
      "editorBracketHighlight.foreground3": "#8250df",
      "editorBracketHighlight.unexpectedBracket.foreground": "#cf222e",
    },
  });

  // Solarized Light theme
  monaco.editor.defineTheme("solarized-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "", foreground: "657b83", background: "fdf6e3" },
      { token: "comment", foreground: "93a1a1", fontStyle: "italic" },
      { token: "comment.line", foreground: "93a1a1", fontStyle: "italic" },
      { token: "comment.block", foreground: "93a1a1", fontStyle: "italic" },
      { token: "keyword", foreground: "859900" },
      { token: "keyword.control", foreground: "859900" },
      { token: "keyword.operator", foreground: "859900" },
      { token: "string", foreground: "2aa198" },
      { token: "string.quoted", foreground: "2aa198" },
      { token: "string.escape", foreground: "dc322f" },
      { token: "string.math", foreground: "2aa198" },
      { token: "number", foreground: "d33682" },
      { token: "number.float", foreground: "d33682" },
      { token: "variable", foreground: "268bd2" },
      { token: "variable.parameter", foreground: "657b83" },
      { token: "variable.other", foreground: "268bd2" },
      { token: "entity.name.function", foreground: "268bd2" },
      { token: "support.function", foreground: "268bd2" },
      { token: "entity.name.type", foreground: "b58900" },
      { token: "entity.name.class", foreground: "b58900" },
      { token: "support.type", foreground: "b58900" },
      { token: "support.class", foreground: "b58900" },
      { token: "tag", foreground: "268bd2" },
      { token: "tag.attribute.name", foreground: "93a1a1" },
      { token: "tag.attribute.value", foreground: "2aa198" },
      { token: "operator", foreground: "859900" },
      { token: "delimiter", foreground: "657b83" },
      { token: "delimiter.bracket", foreground: "657b83" },
      { token: "constant", foreground: "cb4b16" },
      { token: "constant.language", foreground: "cb4b16" },
      { token: "markup.heading", foreground: "cb4b16", fontStyle: "bold" },
      { token: "markup.bold", foreground: "657b83", fontStyle: "bold" },
      { token: "markup.italic", foreground: "657b83", fontStyle: "italic" },
      { token: "markup.underline.link", foreground: "268bd2" },
      { token: "invalid", foreground: "dc322f", fontStyle: "underline" },
    ],
    colors: {
      "editor.background": "#fdf6e3",
      "editor.foreground": "#657b83",
      "editorLineNumber.foreground": "#93a1a1",
      "editorLineNumber.activeForeground": "#586e75",
      "editorCursor.foreground": "#657b83",
      "editorCursor.background": "#fdf6e3",
      "editor.selectionBackground": "#eee8d5",
      "editor.selectionHighlightBackground": "#eee8d5aa",
      "editor.inactiveSelectionBackground": "#eee8d5aa",
      "editor.lineHighlightBackground": "#eee8d5",
      "editor.lineHighlightBorder": "#00000000",
      "editorBracketMatch.background": "#eee8d5",
      "editorBracketMatch.border": "#93a1a1",
      "editorIndentGuide.background": "#eee8d5",
      "editorIndentGuide.activeBackground": "#93a1a1",
      "editorWhitespace.foreground": "#eee8d5",
      "editorGutter.background": "#fdf6e3",
      "editorGutter.modifiedBackground": "#b58900",
      "editorGutter.addedBackground": "#859900",
      "editorGutter.deletedBackground": "#dc322f",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#93a1a133",
      "scrollbarSlider.hoverBackground": "#93a1a155",
      "scrollbarSlider.activeBackground": "#93a1a177",
      "editorWidget.background": "#eee8d5",
      "editorWidget.border": "#93a1a1",
      "editorWidget.foreground": "#657b83",
      "editorSuggestWidget.background": "#eee8d5",
      "editorSuggestWidget.border": "#93a1a1",
      "editorSuggestWidget.foreground": "#657b83",
      "editorSuggestWidget.selectedBackground": "#fdf6e3",
      "editorSuggestWidget.highlightForeground": "#268bd2",
      "editorHoverWidget.background": "#eee8d5",
      "editorHoverWidget.border": "#93a1a1",
      "editorHoverWidget.foreground": "#657b83",
      "editor.findMatchBackground": "#b5890066",
      "editor.findMatchHighlightBackground": "#b5890033",
      "editor.findMatchBorder": "#b58900",
      "editor.wordHighlightBackground": "#eee8d5",
      "editor.wordHighlightStrongBackground": "#eee8d5",
      "minimap.background": "#fdf6e3",
      "minimap.selectionHighlight": "#93a1a133",
      "minimapSlider.background": "#93a1a120",
      "minimapSlider.hoverBackground": "#93a1a140",
      "minimapSlider.activeBackground": "#93a1a160",
      "editorOverviewRuler.border": "#93a1a1",
      "editorOverviewRuler.findMatchForeground": "#b58900",
      "editorOverviewRuler.selectionHighlightForeground": "#268bd2",
      "editorError.foreground": "#dc322f",
      "editorWarning.foreground": "#b58900",
      "editorInfo.foreground": "#268bd2",
      "editorBracketHighlight.foreground1": "#268bd2",
      "editorBracketHighlight.foreground2": "#859900",
      "editorBracketHighlight.foreground3": "#d33682",
      "editorBracketHighlight.unexpectedBracket.foreground": "#dc322f",
    },
  });

  // One Dark theme
  monaco.editor.defineTheme("one-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "abb2bf", background: "282c34" },
      { token: "comment", foreground: "5c6370", fontStyle: "italic" },
      { token: "comment.line", foreground: "5c6370", fontStyle: "italic" },
      { token: "comment.block", foreground: "5c6370", fontStyle: "italic" },
      { token: "keyword", foreground: "c678dd" },
      { token: "keyword.control", foreground: "c678dd" },
      { token: "keyword.operator", foreground: "c678dd" },
      { token: "string", foreground: "98c379" },
      { token: "string.quoted", foreground: "98c379" },
      { token: "string.escape", foreground: "56b6c2" },
      { token: "string.math", foreground: "98c379" },
      { token: "number", foreground: "d19a66" },
      { token: "number.float", foreground: "d19a66" },
      { token: "variable", foreground: "e06c75" },
      { token: "variable.parameter", foreground: "abb2bf" },
      { token: "variable.other", foreground: "e06c75" },
      { token: "entity.name.function", foreground: "61afef" },
      { token: "support.function", foreground: "61afef" },
      { token: "entity.name.type", foreground: "e5c07b" },
      { token: "entity.name.class", foreground: "e5c07b" },
      { token: "support.type", foreground: "e5c07b" },
      { token: "support.class", foreground: "e5c07b" },
      { token: "tag", foreground: "e06c75" },
      { token: "tag.attribute.name", foreground: "d19a66" },
      { token: "tag.attribute.value", foreground: "98c379" },
      { token: "operator", foreground: "56b6c2" },
      { token: "delimiter", foreground: "abb2bf" },
      { token: "delimiter.bracket", foreground: "abb2bf" },
      { token: "constant", foreground: "d19a66" },
      { token: "constant.language", foreground: "d19a66" },
      { token: "markup.heading", foreground: "e06c75", fontStyle: "bold" },
      { token: "markup.bold", foreground: "d19a66", fontStyle: "bold" },
      { token: "markup.italic", foreground: "c678dd", fontStyle: "italic" },
      { token: "markup.underline.link", foreground: "61afef" },
      { token: "invalid", foreground: "e06c75", fontStyle: "underline" },
    ],
    colors: {
      "editor.background": "#282c34",
      "editor.foreground": "#abb2bf",
      "editorLineNumber.foreground": "#4b5263",
      "editorLineNumber.activeForeground": "#abb2bf",
      "editorCursor.foreground": "#528bff",
      "editorCursor.background": "#282c34",
      "editor.selectionBackground": "#3e4451",
      "editor.selectionHighlightBackground": "#3e445199",
      "editor.inactiveSelectionBackground": "#3e445166",
      "editor.lineHighlightBackground": "#2c313c",
      "editor.lineHighlightBorder": "#00000000",
      "editorBracketMatch.background": "#3e4451",
      "editorBracketMatch.border": "#528bff",
      "editorIndentGuide.background": "#3b4048",
      "editorIndentGuide.activeBackground": "#4b5263",
      "editorWhitespace.foreground": "#3b4048",
      "editorGutter.background": "#282c34",
      "editorGutter.modifiedBackground": "#e5c07b",
      "editorGutter.addedBackground": "#98c379",
      "editorGutter.deletedBackground": "#e06c75",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#4b526333",
      "scrollbarSlider.hoverBackground": "#4b526355",
      "scrollbarSlider.activeBackground": "#4b526377",
      "editorWidget.background": "#21252b",
      "editorWidget.border": "#3e4451",
      "editorWidget.foreground": "#abb2bf",
      "editorSuggestWidget.background": "#21252b",
      "editorSuggestWidget.border": "#3e4451",
      "editorSuggestWidget.foreground": "#abb2bf",
      "editorSuggestWidget.selectedBackground": "#3e4451",
      "editorSuggestWidget.highlightForeground": "#61afef",
      "editorHoverWidget.background": "#21252b",
      "editorHoverWidget.border": "#3e4451",
      "editorHoverWidget.foreground": "#abb2bf",
      "editor.findMatchBackground": "#42557b",
      "editor.findMatchHighlightBackground": "#314365",
      "editor.findMatchBorder": "#528bff",
      "editor.wordHighlightBackground": "#3e445166",
      "editor.wordHighlightStrongBackground": "#3e445199",
      "minimap.background": "#282c34",
      "minimap.selectionHighlight": "#3e445199",
      "minimapSlider.background": "#4b526320",
      "minimapSlider.hoverBackground": "#4b526340",
      "minimapSlider.activeBackground": "#4b526360",
      "editorOverviewRuler.border": "#3e4451",
      "editorOverviewRuler.findMatchForeground": "#528bff",
      "editorOverviewRuler.selectionHighlightForeground": "#61afef",
      "editorError.foreground": "#e06c75",
      "editorWarning.foreground": "#e5c07b",
      "editorInfo.foreground": "#61afef",
      "editorBracketHighlight.foreground1": "#61afef",
      "editorBracketHighlight.foreground2": "#c678dd",
      "editorBracketHighlight.foreground3": "#56b6c2",
      "editorBracketHighlight.unexpectedBracket.foreground": "#e06c75",
    },
  });

  // Dracula theme
  monaco.editor.defineTheme("dracula", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "f8f8f2", background: "282a36" },
      { token: "comment", foreground: "6272a4", fontStyle: "italic" },
      { token: "comment.line", foreground: "6272a4", fontStyle: "italic" },
      { token: "comment.block", foreground: "6272a4", fontStyle: "italic" },
      { token: "keyword", foreground: "ff79c6" },
      { token: "keyword.control", foreground: "ff79c6" },
      { token: "keyword.operator", foreground: "ff79c6" },
      { token: "string", foreground: "f1fa8c" },
      { token: "string.quoted", foreground: "f1fa8c" },
      { token: "string.escape", foreground: "ff79c6" },
      { token: "string.math", foreground: "f1fa8c" },
      { token: "number", foreground: "bd93f9" },
      { token: "number.float", foreground: "bd93f9" },
      { token: "variable", foreground: "f8f8f2" },
      { token: "variable.parameter", foreground: "ffb86c" },
      { token: "variable.other", foreground: "f8f8f2" },
      { token: "entity.name.function", foreground: "50fa7b" },
      { token: "support.function", foreground: "50fa7b" },
      { token: "entity.name.type", foreground: "8be9fd", fontStyle: "italic" },
      { token: "entity.name.class", foreground: "8be9fd", fontStyle: "italic" },
      { token: "support.type", foreground: "8be9fd", fontStyle: "italic" },
      { token: "support.class", foreground: "8be9fd", fontStyle: "italic" },
      { token: "tag", foreground: "ff79c6" },
      { token: "tag.attribute.name", foreground: "50fa7b" },
      { token: "tag.attribute.value", foreground: "f1fa8c" },
      { token: "operator", foreground: "ff79c6" },
      { token: "delimiter", foreground: "f8f8f2" },
      { token: "delimiter.bracket", foreground: "f8f8f2" },
      { token: "constant", foreground: "bd93f9" },
      { token: "constant.language", foreground: "bd93f9" },
      { token: "markup.heading", foreground: "bd93f9", fontStyle: "bold" },
      { token: "markup.bold", foreground: "ffb86c", fontStyle: "bold" },
      { token: "markup.italic", foreground: "f1fa8c", fontStyle: "italic" },
      { token: "markup.underline.link", foreground: "8be9fd" },
      { token: "invalid", foreground: "ff5555", fontStyle: "underline" },
    ],
    colors: {
      "editor.background": "#282a36",
      "editor.foreground": "#f8f8f2",
      "editorLineNumber.foreground": "#6272a4",
      "editorLineNumber.activeForeground": "#f8f8f2",
      "editorCursor.foreground": "#f8f8f2",
      "editorCursor.background": "#282a36",
      "editor.selectionBackground": "#44475a",
      "editor.selectionHighlightBackground": "#44475a99",
      "editor.inactiveSelectionBackground": "#44475a66",
      "editor.lineHighlightBackground": "#44475a75",
      "editor.lineHighlightBorder": "#00000000",
      "editorBracketMatch.background": "#44475a",
      "editorBracketMatch.border": "#ff79c6",
      "editorIndentGuide.background": "#44475a",
      "editorIndentGuide.activeBackground": "#6272a4",
      "editorWhitespace.foreground": "#44475a",
      "editorGutter.background": "#282a36",
      "editorGutter.modifiedBackground": "#ffb86c",
      "editorGutter.addedBackground": "#50fa7b",
      "editorGutter.deletedBackground": "#ff5555",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#44475a66",
      "scrollbarSlider.hoverBackground": "#44475a99",
      "scrollbarSlider.activeBackground": "#44475acc",
      "editorWidget.background": "#21222c",
      "editorWidget.border": "#44475a",
      "editorWidget.foreground": "#f8f8f2",
      "editorSuggestWidget.background": "#21222c",
      "editorSuggestWidget.border": "#44475a",
      "editorSuggestWidget.foreground": "#f8f8f2",
      "editorSuggestWidget.selectedBackground": "#44475a",
      "editorSuggestWidget.highlightForeground": "#8be9fd",
      "editorHoverWidget.background": "#21222c",
      "editorHoverWidget.border": "#44475a",
      "editorHoverWidget.foreground": "#f8f8f2",
      "editor.findMatchBackground": "#ffb86c66",
      "editor.findMatchHighlightBackground": "#ffb86c33",
      "editor.findMatchBorder": "#ffb86c",
      "editor.wordHighlightBackground": "#44475a66",
      "editor.wordHighlightStrongBackground": "#44475a99",
      "minimap.background": "#282a36",
      "minimap.selectionHighlight": "#44475a99",
      "minimapSlider.background": "#44475a40",
      "minimapSlider.hoverBackground": "#44475a60",
      "minimapSlider.activeBackground": "#44475a80",
      "editorOverviewRuler.border": "#44475a",
      "editorOverviewRuler.findMatchForeground": "#ffb86c",
      "editorOverviewRuler.selectionHighlightForeground": "#8be9fd",
      "editorError.foreground": "#ff5555",
      "editorWarning.foreground": "#ffb86c",
      "editorInfo.foreground": "#8be9fd",
      "editorBracketHighlight.foreground1": "#f8f8f2",
      "editorBracketHighlight.foreground2": "#ff79c6",
      "editorBracketHighlight.foreground3": "#8be9fd",
      "editorBracketHighlight.unexpectedBracket.foreground": "#ff5555",
    },
  });

  // Nord theme
  monaco.editor.defineTheme("nord", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "d8dee9", background: "2e3440" },
      { token: "comment", foreground: "616e88", fontStyle: "italic" },
      { token: "comment.line", foreground: "616e88", fontStyle: "italic" },
      { token: "comment.block", foreground: "616e88", fontStyle: "italic" },
      { token: "keyword", foreground: "81a1c1" },
      { token: "keyword.control", foreground: "81a1c1" },
      { token: "keyword.operator", foreground: "81a1c1" },
      { token: "string", foreground: "a3be8c" },
      { token: "string.quoted", foreground: "a3be8c" },
      { token: "string.escape", foreground: "ebcb8b" },
      { token: "string.math", foreground: "a3be8c" },
      { token: "number", foreground: "b48ead" },
      { token: "number.float", foreground: "b48ead" },
      { token: "variable", foreground: "d8dee9" },
      { token: "variable.parameter", foreground: "d8dee9" },
      { token: "variable.other", foreground: "d8dee9" },
      { token: "entity.name.function", foreground: "88c0d0" },
      { token: "support.function", foreground: "88c0d0" },
      { token: "entity.name.type", foreground: "8fbcbb" },
      { token: "entity.name.class", foreground: "8fbcbb" },
      { token: "support.type", foreground: "8fbcbb" },
      { token: "support.class", foreground: "8fbcbb" },
      { token: "tag", foreground: "81a1c1" },
      { token: "tag.attribute.name", foreground: "8fbcbb" },
      { token: "tag.attribute.value", foreground: "a3be8c" },
      { token: "operator", foreground: "81a1c1" },
      { token: "delimiter", foreground: "eceff4" },
      { token: "delimiter.bracket", foreground: "eceff4" },
      { token: "constant", foreground: "b48ead" },
      { token: "constant.language", foreground: "b48ead" },
      { token: "markup.heading", foreground: "88c0d0", fontStyle: "bold" },
      { token: "markup.bold", foreground: "d8dee9", fontStyle: "bold" },
      { token: "markup.italic", foreground: "d8dee9", fontStyle: "italic" },
      { token: "markup.underline.link", foreground: "88c0d0" },
      { token: "invalid", foreground: "bf616a", fontStyle: "underline" },
    ],
    colors: {
      "editor.background": "#2e3440",
      "editor.foreground": "#d8dee9",
      "editorLineNumber.foreground": "#4c566a",
      "editorLineNumber.activeForeground": "#d8dee9",
      "editorCursor.foreground": "#d8dee9",
      "editorCursor.background": "#2e3440",
      "editor.selectionBackground": "#434c5e",
      "editor.selectionHighlightBackground": "#434c5e99",
      "editor.inactiveSelectionBackground": "#434c5e66",
      "editor.lineHighlightBackground": "#3b4252",
      "editor.lineHighlightBorder": "#00000000",
      "editorBracketMatch.background": "#434c5e",
      "editorBracketMatch.border": "#88c0d0",
      "editorIndentGuide.background": "#434c5e",
      "editorIndentGuide.activeBackground": "#4c566a",
      "editorWhitespace.foreground": "#434c5e",
      "editorGutter.background": "#2e3440",
      "editorGutter.modifiedBackground": "#ebcb8b",
      "editorGutter.addedBackground": "#a3be8c",
      "editorGutter.deletedBackground": "#bf616a",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#4c566a66",
      "scrollbarSlider.hoverBackground": "#4c566a99",
      "scrollbarSlider.activeBackground": "#4c566acc",
      "editorWidget.background": "#3b4252",
      "editorWidget.border": "#4c566a",
      "editorWidget.foreground": "#d8dee9",
      "editorSuggestWidget.background": "#3b4252",
      "editorSuggestWidget.border": "#4c566a",
      "editorSuggestWidget.foreground": "#d8dee9",
      "editorSuggestWidget.selectedBackground": "#434c5e",
      "editorSuggestWidget.highlightForeground": "#88c0d0",
      "editorHoverWidget.background": "#3b4252",
      "editorHoverWidget.border": "#4c566a",
      "editorHoverWidget.foreground": "#d8dee9",
      "editor.findMatchBackground": "#88c0d066",
      "editor.findMatchHighlightBackground": "#88c0d033",
      "editor.findMatchBorder": "#88c0d0",
      "editor.wordHighlightBackground": "#434c5e66",
      "editor.wordHighlightStrongBackground": "#434c5e99",
      "minimap.background": "#2e3440",
      "minimap.selectionHighlight": "#434c5e99",
      "minimapSlider.background": "#4c566a40",
      "minimapSlider.hoverBackground": "#4c566a60",
      "minimapSlider.activeBackground": "#4c566a80",
      "editorOverviewRuler.border": "#4c566a",
      "editorOverviewRuler.findMatchForeground": "#88c0d0",
      "editorOverviewRuler.selectionHighlightForeground": "#88c0d0",
      "editorError.foreground": "#bf616a",
      "editorWarning.foreground": "#ebcb8b",
      "editorInfo.foreground": "#88c0d0",
      "editorBracketHighlight.foreground1": "#8fbcbb",
      "editorBracketHighlight.foreground2": "#88c0d0",
      "editorBracketHighlight.foreground3": "#81a1c1",
      "editorBracketHighlight.unexpectedBracket.foreground": "#bf616a",
    },
  });
};

// Register LaTeX language support
const registerLaTeXLanguage = (monaco: Monaco) => {
  // Register the LaTeX language
  monaco.languages.register({
    id: "latex",
    extensions: [".tex", ".sty", ".cls", ".bib"],
  });

  // Set language configuration
  monaco.languages.setLanguageConfiguration("latex", {
    comments: {
      lineComment: "%",
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "$", close: "$" },
      { open: "$$", close: "$$" },
      { open: '"', close: '"' },
      { open: "`", close: "'" },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "$", close: "$" },
      { open: '"', close: '"' },
    ],
    folding: {
      markers: {
        start: /\\begin\{/,
        end: /\\end\{/,
      },
    },
    indentationRules: {
      increaseIndentPattern: /\\begin\{(?!document)/,
      decreaseIndentPattern: /\\end\{(?!document)/,
    },
  });

  // Set tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider("latex", {
    defaultToken: "",
    tokenPostfix: ".latex",

    // Common LaTeX commands
    commands: [
      "documentclass",
      "usepackage",
      "begin",
      "end",
      "section",
      "subsection",
      "subsubsection",
      "chapter",
      "part",
      "paragraph",
      "subparagraph",
      "title",
      "author",
      "date",
      "maketitle",
      "tableofcontents",
      "include",
      "input",
      "bibliography",
      "bibliographystyle",
      "cite",
      "ref",
      "label",
      "footnote",
      "caption",
      "item",
      "textbf",
      "textit",
      "texttt",
      "emph",
      "underline",
      "newcommand",
      "renewcommand",
      "newenvironment",
      "def",
      "let",
      "if",
      "else",
      "fi",
      "ifx",
      "newline",
      "linebreak",
      "pagebreak",
      "newpage",
      "clearpage",
      "hspace",
      "vspace",
      "hfill",
      "vfill",
      "centering",
      "raggedright",
      "raggedleft",
      "frac",
      "sqrt",
      "sum",
      "prod",
      "int",
      "lim",
      "infty",
      "partial",
      "nabla",
      "alpha",
      "beta",
      "gamma",
      "delta",
      "epsilon",
      "theta",
      "lambda",
      "mu",
      "pi",
      "sigma",
      "omega",
    ],

    // Environments
    environments: [
      "document",
      "figure",
      "table",
      "tabular",
      "equation",
      "align",
      "gather",
      "multline",
      "itemize",
      "enumerate",
      "description",
      "quote",
      "quotation",
      "verse",
      "center",
      "flushleft",
      "flushright",
      "abstract",
      "verbatim",
      "lstlisting",
      "minipage",
      "array",
      "matrix",
      "pmatrix",
      "bmatrix",
      "cases",
      "split",
      "theorem",
      "lemma",
      "proof",
      "definition",
      "corollary",
      "example",
      "remark",
    ],

    tokenizer: {
      root: [
        // Comments
        [/%.*$/, "comment"],

        // Math mode
        [/\$\$/, { token: "string.math", next: "@mathDisplay" }],
        [/\$/, { token: "string.math", next: "@mathInline" }],
        [/\\\[/, { token: "string.math", next: "@mathDisplay" }],
        [/\\\(/, { token: "string.math", next: "@mathInline" }],

        // Commands with arguments
        [
          /\\(begin|end)\s*\{/,
          { token: "keyword.control", next: "@environment" },
        ],
        [
          /\\(documentclass|usepackage)\s*(\[)?/,
          { token: "keyword.control", next: "@options" },
        ],

        // Section commands
        [
          /\\(section|subsection|subsubsection|chapter|part|paragraph|subparagraph)\*?\s*\{/,
          { token: "markup.heading", next: "@braceArg" },
        ],

        // Reference commands
        [
          /\\(ref|cite|label|pageref|eqref)\s*\{/,
          { token: "keyword", next: "@braceArg" },
        ],

        // Text formatting
        [
          /\\(textbf|textit|texttt|emph|underline)\s*\{/,
          { token: "keyword", next: "@braceArg" },
        ],

        // Other commands
        [/\\[a-zA-Z@]+\*?/, "keyword"],

        // Special characters
        [/\\[{}$&#%_^~\\]/, "constant"],

        // Curly braces groups
        [/\{/, { token: "delimiter.bracket", next: "@braceGroup" }],
        [/\}/, "delimiter.bracket"],

        // Square brackets
        [/\[/, "delimiter.bracket"],
        [/\]/, "delimiter.bracket"],

        // Numbers
        [/-?\d+(\.\d+)?/, "number"],
      ],

      mathInline: [
        [/\$/, { token: "string.math", next: "@pop" }],
        [/\\\)/, { token: "string.math", next: "@pop" }],
        [/\\[a-zA-Z]+/, "keyword"],
        [/[^$\\]+/, "string.math"],
        [/./, "string.math"],
      ],

      mathDisplay: [
        [/\$\$/, { token: "string.math", next: "@pop" }],
        [/\\\]/, { token: "string.math", next: "@pop" }],
        [/\\[a-zA-Z]+/, "keyword"],
        [/[^$\\]+/, "string.math"],
        [/./, "string.math"],
      ],

      environment: [
        [/[a-zA-Z*]+/, "variable.parameter"],
        [/\}/, { token: "keyword.control", next: "@pop" }],
      ],

      options: [
        [/\]/, { token: "delimiter.bracket", next: "@pop" }],
        [/\{/, { token: "delimiter.bracket", next: "@braceArg" }],
        [/[^\]{}]+/, "variable.parameter"],
      ],

      braceArg: [
        [/\{/, { token: "delimiter.bracket", next: "@braceArg" }],
        [/\}/, { token: "delimiter.bracket", next: "@pop" }],
        [/\\[a-zA-Z]+/, "keyword"],
        [/[^{}\\]+/, ""],
      ],

      braceGroup: [
        [/\{/, { token: "delimiter.bracket", next: "@braceGroup" }],
        [/\}/, { token: "delimiter.bracket", next: "@pop" }],
        [/%.*$/, "comment"],
        [/\\[a-zA-Z]+/, "keyword"],
        [/[^{}%\\]+/, ""],
      ],
    },
  });

  // Register completions provider
  monaco.languages.registerCompletionItemProvider("latex", {
    triggerCharacters: ["\\", "{"],
    provideCompletionItems: (
      model: editor.ITextModel,
      position: { lineNumber: number; column: number },
    ) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Get the character before the cursor
      const lineContent = model.getLineContent(position.lineNumber);
      const charBefore = lineContent[position.column - 2];

      const suggestions: languages.CompletionItem[] = [];

      if (charBefore === "\\") {
        // Command completions
        const commands = [
          // Document structure
          {
            label: "documentclass",
            insertText: "documentclass{${1:article}}",
            detail: "Document class",
          },
          {
            label: "usepackage",
            insertText: "usepackage{${1:package}}",
            detail: "Import package",
          },
          {
            label: "begin",
            insertText:
              "begin{${1:environment}}\n\t$0\n\\end{${1:environment}}",
            detail: "Begin environment",
          },
          {
            label: "section",
            insertText: "section{${1:title}}",
            detail: "Section",
          },
          {
            label: "subsection",
            insertText: "subsection{${1:title}}",
            detail: "Subsection",
          },
          {
            label: "subsubsection",
            insertText: "subsubsection{${1:title}}",
            detail: "Subsubsection",
          },
          {
            label: "chapter",
            insertText: "chapter{${1:title}}",
            detail: "Chapter",
          },
          {
            label: "title",
            insertText: "title{${1:title}}",
            detail: "Document title",
          },
          {
            label: "author",
            insertText: "author{${1:name}}",
            detail: "Author",
          },
          { label: "date", insertText: "date{${1:\\today}}", detail: "Date" },
          { label: "maketitle", insertText: "maketitle", detail: "Make title" },
          {
            label: "tableofcontents",
            insertText: "tableofcontents",
            detail: "Table of contents",
          },

          // Text formatting
          {
            label: "textbf",
            insertText: "textbf{${1:text}}",
            detail: "Bold text",
          },
          {
            label: "textit",
            insertText: "textit{${1:text}}",
            detail: "Italic text",
          },
          {
            label: "texttt",
            insertText: "texttt{${1:text}}",
            detail: "Monospace text",
          },
          {
            label: "emph",
            insertText: "emph{${1:text}}",
            detail: "Emphasized text",
          },
          {
            label: "underline",
            insertText: "underline{${1:text}}",
            detail: "Underlined text",
          },

          // References
          { label: "label", insertText: "label{${1:key}}", detail: "Label" },
          { label: "ref", insertText: "ref{${1:key}}", detail: "Reference" },
          { label: "cite", insertText: "cite{${1:key}}", detail: "Citation" },
          {
            label: "footnote",
            insertText: "footnote{${1:text}}",
            detail: "Footnote",
          },
          {
            label: "caption",
            insertText: "caption{${1:text}}",
            detail: "Caption",
          },

          // Math
          {
            label: "frac",
            insertText: "frac{${1:num}}{${2:den}}",
            detail: "Fraction",
          },
          { label: "sqrt", insertText: "sqrt{${1:x}}", detail: "Square root" },
          {
            label: "sum",
            insertText: "sum_{${1:i=1}}^{${2:n}}",
            detail: "Summation",
          },
          {
            label: "int",
            insertText: "int_{${1:a}}^{${2:b}}",
            detail: "Integral",
          },
          {
            label: "lim",
            insertText: "lim_{${1:x \\to \\infty}}",
            detail: "Limit",
          },

          // Greek letters
          { label: "alpha", insertText: "alpha", detail: "Greek alpha" },
          { label: "beta", insertText: "beta", detail: "Greek beta" },
          { label: "gamma", insertText: "gamma", detail: "Greek gamma" },
          { label: "delta", insertText: "delta", detail: "Greek delta" },
          { label: "epsilon", insertText: "epsilon", detail: "Greek epsilon" },
          { label: "theta", insertText: "theta", detail: "Greek theta" },
          { label: "lambda", insertText: "lambda", detail: "Greek lambda" },
          { label: "mu", insertText: "mu", detail: "Greek mu" },
          { label: "pi", insertText: "pi", detail: "Greek pi" },
          { label: "sigma", insertText: "sigma", detail: "Greek sigma" },
          { label: "omega", insertText: "omega", detail: "Greek omega" },
          { label: "infty", insertText: "infty", detail: "Infinity" },

          // Spacing
          {
            label: "hspace",
            insertText: "hspace{${1:1cm}}",
            detail: "Horizontal space",
          },
          {
            label: "vspace",
            insertText: "vspace{${1:1cm}}",
            detail: "Vertical space",
          },
          { label: "newline", insertText: "newline", detail: "New line" },
          { label: "newpage", insertText: "newpage", detail: "New page" },

          // Lists
          { label: "item", insertText: "item ", detail: "List item" },

          // Includes
          {
            label: "input",
            insertText: "input{${1:file}}",
            detail: "Input file",
          },
          {
            label: "include",
            insertText: "include{${1:file}}",
            detail: "Include file",
          },
        ];

        commands.forEach((cmd) => {
          suggestions.push({
            label: cmd.label,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: cmd.insertText,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: cmd.detail,
            range,
          });
        });
      }

      // Environment completions after \begin{
      const linePrefix = lineContent.substring(0, position.column - 1);
      if (/\\begin\{$/.test(linePrefix)) {
        const environments = [
          { label: "document", detail: "Main document environment" },
          { label: "figure", detail: "Figure environment" },
          { label: "table", detail: "Table environment" },
          { label: "tabular", detail: "Tabular environment" },
          { label: "equation", detail: "Equation environment" },
          { label: "align", detail: "Aligned equations" },
          { label: "gather", detail: "Gathered equations" },
          { label: "itemize", detail: "Bullet list" },
          { label: "enumerate", detail: "Numbered list" },
          { label: "description", detail: "Description list" },
          { label: "center", detail: "Centered content" },
          { label: "verbatim", detail: "Verbatim text" },
          { label: "abstract", detail: "Abstract" },
          { label: "quote", detail: "Quote block" },
          { label: "minipage", detail: "Minipage" },
          { label: "array", detail: "Math array" },
          { label: "matrix", detail: "Matrix" },
          { label: "pmatrix", detail: "Parenthesized matrix" },
          { label: "bmatrix", detail: "Bracketed matrix" },
          { label: "cases", detail: "Cases" },
          { label: "theorem", detail: "Theorem" },
          { label: "lemma", detail: "Lemma" },
          { label: "proof", detail: "Proof" },
          { label: "definition", detail: "Definition" },
        ];

        environments.forEach((env) => {
          suggestions.push({
            label: env.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: `${env.label}}\n\t$0\n\\\\end{${env.label}}`,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: env.detail,
            range,
          });
        });
      }

      return { suggestions };
    },
  });
};

type Props = {
  content?: string;
  readOnly?: boolean;
  className?: string;
  language?: string;
  editorSettings?: Partial<EditorSettings>;
  onContentChange?: (content: string) => void;
};

export const MonacoEditor = memo(function MonacoEditor({
  content = "",
  readOnly = false,
  className = "",
  language = "latex",
  editorSettings,
  onContentChange,
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const isExternalUpdateRef = useRef(false);
  const contentRef = useRef(content);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define all themes
    defineEditorThemes(monaco);

    // Register LaTeX language support
    registerLaTeXLanguage(monaco);

    // Focus the editor
    editor.focus();

    // Custom keybindings
    // Toggle comment with Cmd/Ctrl + /
    editor.addAction({
      id: "toggle-latex-comment",
      label: "Toggle LaTeX Comment",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash],
      run: (ed) => {
        const selection = ed.getSelection();
        if (!selection) return;

        const model = ed.getModel();
        if (!model) return;

        const edits: editor.IIdentifiedSingleEditOperation[] = [];

        for (
          let lineNumber = selection.startLineNumber;
          lineNumber <= selection.endLineNumber;
          lineNumber++
        ) {
          const lineContent = model.getLineContent(lineNumber);
          const trimmedLine = lineContent.trimStart();
          const leadingSpaces = lineContent.length - trimmedLine.length;

          if (trimmedLine.startsWith("%")) {
            // Remove comment
            const commentLength = trimmedLine.startsWith("% ") ? 2 : 1;
            edits.push({
              range: {
                startLineNumber: lineNumber,
                startColumn: leadingSpaces + 1,
                endLineNumber: lineNumber,
                endColumn: leadingSpaces + 1 + commentLength,
              },
              text: "",
            });
          } else {
            // Add comment
            edits.push({
              range: {
                startLineNumber: lineNumber,
                startColumn: leadingSpaces + 1,
                endLineNumber: lineNumber,
                endColumn: leadingSpaces + 1,
              },
              text: "% ",
            });
          }
        }

        ed.executeEdits("toggle-comment", edits);
      },
    });
  }, []);

  const handleChange: OnChange = useCallback(
    (value) => {
      if (isExternalUpdateRef.current) return;
      if (value !== undefined) {
        contentRef.current = value;
        onContentChange?.(value);
      }
    },
    [onContentChange],
  );

  // Handle external content updates
  const handleBeforeMount = useCallback((monaco: Monaco) => {
    defineEditorThemes(monaco);
    registerLaTeXLanguage(monaco);
  }, []);

  // Update theme when settings change
  useEffect(() => {
    if (monacoRef.current && editorSettings?.theme) {
      monacoRef.current.editor.setTheme(editorSettings.theme);
    }
  }, [editorSettings?.theme]);

  // Detect language from content or file extension
  const detectLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      tex: "latex",
      latex: "latex",
      bib: "bibtex",
      js: "javascript",
      ts: "typescript",
      jsx: "javascript",
      tsx: "typescript",
      py: "python",
      md: "markdown",
      json: "json",
      css: "css",
      html: "html",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
    };
    return languageMap[lang.toLowerCase()] || lang;
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <Editor
        height="100%"
        language={detectLanguage(language)}
        value={content}
        theme={editorSettings?.theme ?? "monochrome"}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        onChange={handleChange}
        options={{
          readOnly,
          fontSize: editorSettings?.fontSize ?? 14,
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", "Courier New", monospace',
          fontLigatures: false,
          lineNumbers: editorSettings?.lineNumbers ?? "on",
          lineHeight: editorSettings?.lineHeight ?? 1.6,
          letterSpacing: 0,
          renderWhitespace: editorSettings?.renderWhitespace ?? "selection",
          tabSize: editorSettings?.tabSize ?? 2,
          insertSpaces: editorSettings?.insertSpaces ?? true,
          wordWrap: editorSettings?.wordWrap ?? "off",
          wordWrapColumn: editorSettings?.wordWrapColumn ?? 80,
          wrappingIndent: "indent",
          automaticLayout: true,
          minimap: {
            enabled: editorSettings?.minimap?.enabled ?? false,
            side: editorSettings?.minimap?.side ?? "right",
            size: editorSettings?.minimap?.size ?? "proportional",
            maxColumn: 120,
            renderCharacters:
              editorSettings?.minimap?.renderCharacters ?? false,
            scale: editorSettings?.minimap?.scale ?? 1,
            showSlider: editorSettings?.minimap?.showSlider ?? "mouseover",
          },
          scrollBeyondLastLine: false,
          smoothScrolling: editorSettings?.smoothScrolling ?? true,
          cursorBlinking: editorSettings?.cursorBlinking ?? "smooth",
          cursorSmoothCaretAnimation: "on",
          cursorStyle: editorSettings?.cursorStyle ?? "line",
          cursorWidth: 2,
          formatOnPaste: editorSettings?.formatOnPaste ?? false,
          formatOnType: editorSettings?.formatOnSave ?? false,
          autoClosingBrackets:
            editorSettings?.autoClosingBrackets ?? "languageDefined",
          autoClosingQuotes:
            editorSettings?.autoClosingQuotes ?? "languageDefined",
          renderLineHighlight: "line",
          renderLineHighlightOnlyWhenFocus: false,
          selectOnLineNumbers: true,
          folding: true,
          foldingStrategy: "auto",
          showFoldingControls: "mouseover",
          matchBrackets: "always",
          bracketPairColorization: {
            enabled: false, // Keep monochrome
          },
          guides: {
            bracketPairs: true,
            bracketPairsHorizontal: false,
            indentation: true,
            highlightActiveIndentation: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showFunctions: true,
            showConstants: true,
            showVariables: true,
            filterGraceful: true,
            localityBonus: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: "on",
          snippetSuggestions: "inline",
          parameterHints: {
            enabled: true,
          },
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: "multiline",
            seedSearchStringFromSelection: "selection",
          },
          padding: {
            top: 16,
            bottom: 16,
          },
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            arrowSize: 0,
          },
          overviewRulerBorder: false,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          contextmenu: true,
          mouseWheelZoom: true,
          dragAndDrop: true,
          links: true,
          colorDecorators: false,
          accessibilitySupport: "auto",
        }}
        loading={
          <div className="flex flex-col h-full bg-white">
            <div className="flex-1 p-4 space-y-2">
              {[70, 45, 60, 80, 35, 55, 40, 65].map((width, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-4 bg-neutral-100 animate-pulse" />
                  <div
                    className="flex-1 h-4 bg-neutral-100 animate-pulse"
                    style={{ width: `${width}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
});
