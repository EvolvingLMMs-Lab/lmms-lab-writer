"use client";

import { useRef, memo, useCallback, useEffect } from "react";
import { DiffEditor, Monaco, DiffOnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "next-themes";
import { EDITOR_MONO_FONT_FAMILY } from "@/lib/editor/font-stacks";

// Define diff themes for both light and dark
const defineDiffThemes = (monaco: Monaco) => {
  monaco.editor.defineTheme("diff-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "", foreground: "24292e", background: "ffffff" },
      { token: "comment", foreground: "6a737d", fontStyle: "italic" },
      { token: "keyword", foreground: "d73a49" },
      { token: "string", foreground: "032f62" },
      { token: "number", foreground: "005cc5" },
      { token: "variable", foreground: "e36209" },
      { token: "operator", foreground: "d73a49" },
      { token: "delimiter", foreground: "586069" },
      { token: "entity.name.function", foreground: "6f42c1" },
      { token: "entity.name.tag", foreground: "22863a" },
      { token: "constant", foreground: "005cc5" },
      { token: "support", foreground: "005cc5" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#24292e",
      "editorLineNumber.foreground": "#959da5",
      "editorLineNumber.activeForeground": "#24292e",
      "editor.selectionBackground": "#c8c8fa",
      "editor.lineHighlightBackground": "#fafbfc",
      "editorGutter.background": "#ffffff",
      "editorOverviewRuler.border": "#e1e4e8",
      "diffEditor.insertedTextBackground": "#bbf7d0",
      "diffEditor.removedTextBackground": "#fecaca",
      "diffEditor.insertedLineBackground": "#f0fdf4",
      "diffEditor.removedLineBackground": "#fef2f2",
      "diffEditorGutter.insertedLineBackground": "#dcfce7",
      "diffEditorGutter.removedLineBackground": "#fee2e2",
      "diffEditor.border": "#e5e5e5",
      "diffEditor.diagonalFill": "#f5f5f5",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#d4d4d4",
      "scrollbarSlider.hoverBackground": "#a3a3a3",
    },
  });

  monaco.editor.defineTheme("diff-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "f6f8fa", background: "24292e" },
      { token: "comment", foreground: "959da5", fontStyle: "italic" },
      { token: "keyword", foreground: "ea4a5a" },
      { token: "string", foreground: "79b8ff" },
      { token: "number", foreground: "c8e1ff" },
      { token: "variable", foreground: "fb8532" },
      { token: "operator", foreground: "ea4a5a" },
      { token: "delimiter", foreground: "f6f8fa" },
      { token: "entity.name.function", foreground: "b392f0" },
      { token: "entity.name.tag", foreground: "7bcc72" },
      { token: "constant", foreground: "c8e1ff" },
      { token: "support", foreground: "c8e1ff" },
    ],
    colors: {
      "editor.background": "#24292e",
      "editor.foreground": "#f6f8fa",
      "editorLineNumber.foreground": "#6a737d",
      "editorLineNumber.activeForeground": "#f6f8fa",
      "editor.selectionBackground": "#4c2889",
      "editor.lineHighlightBackground": "#444d56",
      "editorGutter.background": "#24292e",
      "editorOverviewRuler.border": "#444d56",
      "diffEditor.insertedTextBackground": "#7bcc7233",
      "diffEditor.removedTextBackground": "#ea4a5a33",
      "diffEditor.insertedLineBackground": "#7bcc7218",
      "diffEditor.removedLineBackground": "#ea4a5a18",
      "diffEditorGutter.insertedLineBackground": "#7bcc7225",
      "diffEditorGutter.removedLineBackground": "#ea4a5a25",
      "diffEditor.border": "#444d56",
      "diffEditor.diagonalFill": "#444d56",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#6a737d33",
      "scrollbarSlider.hoverBackground": "#6a737d55",
    },
  });
};

// Detect language from file path
const getLanguageFromPath = (filePath: string): string => {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const languageMap: Record<string, string> = {
    tex: "latex",
    bib: "bibtex",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    md: "markdown",
    json: "json",
    css: "css",
    html: "html",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    rs: "rust",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
  };
  return languageMap[ext] || "plaintext";
};

type Props = {
  original: string;
  modified: string;
  filePath?: string;
  language?: string;
  className?: string;
};

export const MonacoDiffEditor = memo(function MonacoDiffEditor({
  original,
  modified,
  filePath,
  language,
  className = "",
}: Props) {
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const isDisposingRef = useRef(false);
  const { resolvedTheme } = useTheme();

  const diffTheme = resolvedTheme === "dark" ? "diff-dark" : "diff-light";
  const detectedLanguage = language || (filePath ? getLanguageFromPath(filePath) : "plaintext");

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    defineDiffThemes(monaco);
  }, []);

  const handleEditorDidMount: DiffOnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    isDisposingRef.current = false;
  }, []);

  // Reactively switch theme when app mode changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(diffTheme);
    }
  }, [diffTheme]);

  // Cleanup effect to properly dispose the editor before unmount
  useEffect(() => {
    return () => {
      if (editorRef.current && !isDisposingRef.current) {
        isDisposingRef.current = true;
        try {
          // Get the models before disposing
          const originalModel = editorRef.current.getModel()?.original;
          const modifiedModel = editorRef.current.getModel()?.modified;

          // Dispose the editor first (this should reset the widget)
          editorRef.current.dispose();

          // Then dispose the models if they exist and aren't already disposed
          try {
            if (originalModel && !originalModel.isDisposed()) {
              originalModel.dispose();
            }
          } catch {
            // Ignore errors during model disposal
          }
          try {
            if (modifiedModel && !modifiedModel.isDisposed()) {
              modifiedModel.dispose();
            }
          } catch {
            // Ignore errors during model disposal
          }
        } catch {
          // Silently ignore disposal errors
        }
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`flex flex-col ${className}`}>
      <DiffEditor
        height="100%"
        language={detectedLanguage}
        original={original}
        modified={modified}
        theme={diffTheme}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        options={{
          readOnly: true,
          renderSideBySide: true,
          enableSplitViewResizing: true,
          ignoreTrimWhitespace: false,
          renderIndicators: true,
          originalEditable: false,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          diffWordWrap: "on",
          fontSize: 13,
          fontFamily: EDITOR_MONO_FONT_FAMILY,
          lineNumbers: "on",
          lineHeight: 1.5,
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          renderLineHighlight: "none",
          folding: false,
          glyphMargin: false,
          contextmenu: false,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-background">
            <div className="text-sm text-muted-foreground">Loading diff...</div>
          </div>
        }
      />
    </div>
  );
});
