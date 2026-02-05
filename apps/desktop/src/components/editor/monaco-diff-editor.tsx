"use client";

import { useRef, memo, useCallback } from "react";
import { DiffEditor, Monaco, DiffOnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

// Define monochrome theme for diff editor
const defineMonochromeTheme = (monaco: Monaco) => {
  monaco.editor.defineTheme("monochrome", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "", foreground: "0a0a0a", background: "ffffff" },
      { token: "comment", foreground: "737373", fontStyle: "italic" },
      { token: "keyword", foreground: "0a0a0a", fontStyle: "bold" },
      { token: "string", foreground: "404040" },
      { token: "number", foreground: "404040" },
      { token: "variable", foreground: "0a0a0a" },
      { token: "operator", foreground: "0a0a0a" },
      { token: "delimiter", foreground: "404040" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#0a0a0a",
      "editorLineNumber.foreground": "#a3a3a3",
      "editorLineNumber.activeForeground": "#0a0a0a",
      "editor.selectionBackground": "#e5e5e5",
      "editor.lineHighlightBackground": "#f5f5f5",
      "editorGutter.background": "#ffffff",
      "diffEditor.insertedTextBackground": "#dcfce7",
      "diffEditor.removedTextBackground": "#fee2e2",
      "diffEditor.insertedLineBackground": "#f0fdf4",
      "diffEditor.removedLineBackground": "#fef2f2",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#d4d4d4",
      "scrollbarSlider.hoverBackground": "#a3a3a3",
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

  const detectedLanguage = language || (filePath ? getLanguageFromPath(filePath) : "plaintext");

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    defineMonochromeTheme(monaco);
  }, []);

  const handleEditorDidMount: DiffOnMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  return (
    <div className={`flex flex-col ${className}`}>
      <DiffEditor
        height="100%"
        language={detectedLanguage}
        original={original}
        modified={modified}
        theme="monochrome"
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
          fontSize: 13,
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
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
          <div className="flex items-center justify-center h-full bg-white">
            <div className="text-sm text-neutral-400">Loading diff...</div>
          </div>
        }
      />
    </div>
  );
});
