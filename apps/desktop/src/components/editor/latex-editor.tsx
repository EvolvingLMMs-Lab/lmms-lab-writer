"use client";

import { useEffect, useRef, useState, memo } from "react";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  rectangularSelection,
} from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  selectLine,
  deleteLine,
  copyLineDown,
  moveLineUp,
  moveLineDown,
  indentMore,
  indentLess,
} from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import {
  bracketMatching,
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  StreamLanguage,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { EDITOR_MONO_FONT_FAMILY } from "@/lib/editor/font-stacks";

const latexLanguage = StreamLanguage.define(stex);

const latexHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#d73a49" },
  { tag: tags.comment, color: "#6a737d", fontStyle: "italic" },
  { tag: tags.string, color: "#032f62" },
  { tag: tags.number, color: "#005cc5" },
  { tag: tags.operator, color: "#d73a49" },
  { tag: tags.bracket, color: "#586069" },
  { tag: tags.meta, color: "#6f42c1" },
  { tag: tags.tagName, color: "#22863a" },
  { tag: tags.attributeName, color: "#6f42c1" },
  { tag: tags.atom, color: "#005cc5" },
  { tag: tags.special(tags.string), color: "#032f62" },
]);

const monochromTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    fontFamily: EDITOR_MONO_FONT_FAMILY,
    backgroundColor: "#fff",
    color: "#24292e",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#24292e",
    padding: "16px 0",
  },
  ".cm-cursor": {
    borderLeftColor: "#24292e",
    borderLeftWidth: "2px",
  },
  ".cm-activeLine": {
    backgroundColor: "#fafbfc",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#fafbfc",
  },
  ".cm-gutters": {
    backgroundColor: "#fff",
    color: "#959da5",
    border: "none",
    borderRight: "1px solid #e1e4e8",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 16px 0 8px",
  },
  ".cm-foldGutter .cm-gutterElement": {
    padding: "0 4px",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "#c8c8fa",
  },
  ".cm-selectionMatch": {
    backgroundColor: "#c8c8fa88",
  },
  ".cm-matchingBracket": {
    backgroundColor: "#c8c8fa66",
    outline: "1px solid #586069",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    height: "100%",
  },
  ".cm-scroller::-webkit-scrollbar": {
    width: "12px",
    height: "12px",
    backgroundColor: "#fafbfc",
  },
  ".cm-scroller::-webkit-scrollbar-track": {
    backgroundColor: "#fafbfc",
    borderLeft: "1px solid #e1e4e8",
  },
  ".cm-scroller::-webkit-scrollbar-thumb": {
    backgroundColor: "#888",
    border: "1px solid #777",
    borderRadius: "0",
  },
  ".cm-scroller::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "#555",
    borderColor: "#444",
  },
  ".cm-scroller::-webkit-scrollbar-corner": {
    backgroundColor: "#fafbfc",
  },
});

type Props = {
  content?: string;
  readOnly?: boolean;
  className?: string;
  onContentChange?: (content: string) => void;
};

export const LaTeXEditor = memo(function LaTeXEditor({
  content = "",
  readOnly = false,
  className = "",
  onContentChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef(content);
  const isExternalUpdateRef = useRef(false);
  const onContentChangeRef = useRef(onContentChange);

  // Update ref in effect to avoid render-phase side effects
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const readOnlyCompartment = new Compartment();

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        drawSelection(),
        rectangularSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightSelectionMatches(),
        latexLanguage,
        syntaxHighlighting(defaultHighlightStyle),
        syntaxHighlighting(latexHighlightStyle),
        monochromTheme,
        readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
        keymap.of([
          { key: "Mod-s", run: () => true },
          {
            key: "Mod-/",
            run: (view) => {
              const { state } = view;
              const changes: { from: number; to: number; insert: string }[] =
                [];
              for (const range of state.selection.ranges) {
                const line = state.doc.lineAt(range.from);
                const lineText = line.text;
                if (lineText.trimStart().startsWith("%")) {
                  const commentIndex = lineText.indexOf("%");
                  changes.push({
                    from: line.from + commentIndex,
                    to:
                      line.from +
                      commentIndex +
                      (lineText[commentIndex + 1] === " " ? 2 : 1),
                    insert: "",
                  });
                } else {
                  changes.push({
                    from: line.from,
                    to: line.from,
                    insert: "% ",
                  });
                }
              }
              view.dispatch({ changes });
              return true;
            },
          },
          { key: "Mod-l", run: selectLine },
          { key: "Mod-Shift-k", run: deleteLine },
          { key: "Mod-Shift-d", run: copyLineDown },
          { key: "Alt-ArrowUp", run: moveLineUp },
          { key: "Alt-ArrowDown", run: moveLineDown },
          { key: "Mod-]", run: indentMore },
          { key: "Mod-[", run: indentLess },
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...closeBracketsKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of(
          (update: { docChanged: boolean; state: EditorState }) => {
            if (update.docChanged && !isExternalUpdateRef.current) {
              const newContent = update.state.doc.toString();
              contentRef.current = newContent;
              onContentChangeRef.current?.(newContent);
            }
          },
        ),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- content is handled by separate effect below
  }, [mounted, readOnly]);

  useEffect(() => {
    if (!viewRef.current || content === contentRef.current) return;

    isExternalUpdateRef.current = true;
    const view = viewRef.current;
    const currentContent = view.state.doc.toString();

    if (content !== currentContent) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      });
      contentRef.current = content;
    }
    isExternalUpdateRef.current = false;
  }, [content]);

  if (!mounted) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
          <div className="h-4 w-24 bg-surface-tertiary animate-pulse" />
          <div className="h-4 w-32 bg-surface-tertiary animate-pulse" />
        </div>
        <div className="flex-1 bg-background p-4 space-y-2">
          {[70, 45, 60, 80, 35].map((width, i) => (
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
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
});
