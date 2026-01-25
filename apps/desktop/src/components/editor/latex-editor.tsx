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

const latexLanguage = StreamLanguage.define(stex);

const latexHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#000", fontWeight: "bold" },
  { tag: tags.comment, color: "#888", fontStyle: "italic" },
  { tag: tags.string, color: "#333" },
  { tag: tags.number, color: "#333" },
  { tag: tags.operator, color: "#000" },
  { tag: tags.bracket, color: "#555" },
  { tag: tags.meta, color: "#000", fontWeight: "bold" },
  { tag: tags.tagName, color: "#000", fontWeight: "bold" },
  { tag: tags.attributeName, color: "#333" },
  { tag: tags.atom, color: "#000", fontWeight: "bold" },
  { tag: tags.special(tags.string), color: "#444" },
]);

const monochromTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    backgroundColor: "#fff",
    color: "#000",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#000",
    padding: "16px 0",
  },
  ".cm-cursor": {
    borderLeftColor: "#000",
    borderLeftWidth: "2px",
  },
  ".cm-activeLine": {
    backgroundColor: "#f5f5f5",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#f5f5f5",
  },
  ".cm-gutters": {
    backgroundColor: "#fff",
    color: "#999",
    border: "none",
    borderRight: "1px solid #e5e5e5",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 16px 0 8px",
  },
  ".cm-foldGutter .cm-gutterElement": {
    padding: "0 4px",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "#e5e5e5",
  },
  ".cm-selectionMatch": {
    backgroundColor: "#e5e5e5",
  },
  ".cm-matchingBracket": {
    backgroundColor: "#e5e5e5",
    outline: "1px solid #999",
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
    backgroundColor: "#fafafa",
  },
  ".cm-scroller::-webkit-scrollbar-track": {
    backgroundColor: "#fafafa",
    borderLeft: "1px solid #e5e5e5",
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
    backgroundColor: "#fafafa",
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
              onContentChange?.(newContent);
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
  }, [mounted, readOnly, onContentChange]);

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
          <div className="h-4 w-24 bg-neutral-200 animate-pulse" />
          <div className="h-4 w-32 bg-neutral-200 animate-pulse" />
        </div>
        <div className="flex-1 bg-white p-4 space-y-2">
          {[70, 45, 60, 80, 35].map((width, i) => (
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
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
});
