"use client";

import "@/lib/monaco/config";

import { useRef, memo, useCallback, useEffect, useState } from "react";
import Editor, { Monaco, OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { EditorSettings, EditorTheme } from "@/lib/editor/types";
import { EDITOR_MONO_FONT_FAMILY } from "@/lib/editor/font-stacks";
import { defineEditorThemes } from "@/lib/monaco/themes";
import { registerLaTeXLanguage } from "@/lib/monaco/latex";

type Props = {
  content?: string;
  readOnly?: boolean;
  className?: string;
  language?: string;
  editorSettings?: Partial<EditorSettings>;
  editorTheme?: EditorTheme;
  onContentChange?: (content: string) => void;
};

type VimModeController = {
  dispose: () => void;
};

function detectLanguage(lang: string): string {
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
}

export const MonacoEditor = memo(function MonacoEditor({
  content = "",
  readOnly = false,
  className = "",
  language = "latex",
  editorSettings,
  editorTheme = "one-light",
  onContentChange,
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const isExternalUpdateRef = useRef(false);
  const contentRef = useRef(content);
  const vimModeRef = useRef<VimModeController | null>(null);
  const vimStatusRef = useRef<HTMLDivElement | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);

    defineEditorThemes(monaco);
    registerLaTeXLanguage(monaco);

    editor.focus();

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

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    defineEditorThemes(monaco);
    registerLaTeXLanguage(monaco);
  }, []);

  useEffect(() => {
    if (monacoRef.current && editorTheme) {
      monacoRef.current.editor.setTheme(editorTheme);
    }
  }, [editorTheme]);

  useEffect(() => {
    const statusNode = vimStatusRef.current;
    if (!editorReady || !editorRef.current || !statusNode) return;

    vimModeRef.current?.dispose();
    vimModeRef.current = null;
    statusNode.textContent = "";

    const shouldEnableVim = !!editorSettings?.vimMode && !readOnly;
    if (!shouldEnableVim) return;

    let cancelled = false;

    (async () => {
      try {
        const monacoVim = await import("monaco-vim");
        if (cancelled || !editorRef.current) return;

        vimModeRef.current?.dispose();
        vimModeRef.current = monacoVim.initVimMode(editorRef.current, statusNode);
        editorRef.current.focus();
      } catch (error) {
        console.error("Failed to enable Vim mode:", error);
      }
    })();

    return () => {
      cancelled = true;
      vimModeRef.current?.dispose();
      vimModeRef.current = null;
      statusNode.textContent = "";
    };
  }, [editorReady, editorSettings?.vimMode, readOnly]);

  useEffect(() => {
    return () => {
      vimModeRef.current?.dispose();
      vimModeRef.current = null;
    };
  }, []);

  return (
    <div className={`relative flex flex-col ${className}`}>
      {editorSettings?.vimMode && !readOnly && (
        <div
          ref={vimStatusRef}
          className="pointer-events-none absolute right-3 top-3 z-10 border border-foreground bg-background px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider"
        />
      )}
      <Editor
        height="100%"
        language={detectLanguage(language)}
        value={content}
        theme={editorTheme}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        onChange={handleChange}
        options={{
          readOnly,
          fontSize: editorSettings?.fontSize ?? 14,
          fontFamily: EDITOR_MONO_FONT_FAMILY,
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
            enabled: false,
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
          <div className="flex flex-col h-full bg-background">
            <div className="flex-1 p-4 space-y-2">
              {[70, 45, 60, 80, 35, 55, 40, 65].map((width, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-4 bg-surface-secondary animate-pulse" />
                  <div
                    className="flex-1 h-4 bg-surface-secondary animate-pulse"
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
