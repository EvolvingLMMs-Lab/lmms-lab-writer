'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { HighlightStyle } from '@codemirror/language'

const latexHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#000', fontWeight: 'bold' },
  { tag: tags.comment, color: '#666', fontStyle: 'italic' },
  { tag: tags.string, color: '#333' },
  { tag: tags.number, color: '#333' },
  { tag: tags.operator, color: '#000' },
  { tag: tags.bracket, color: '#666' },
  { tag: tags.meta, color: '#000', fontWeight: 'bold' },
])

const monochromTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    backgroundColor: '#fff',
    color: '#000',
  },
  '.cm-content': {
    caretColor: '#000',
    padding: '16px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#000',
    borderLeftWidth: '2px',
  },
  '.cm-activeLine': {
    backgroundColor: '#f5f5f5',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f5f5f5',
  },
  '.cm-gutters': {
    backgroundColor: '#fff',
    color: '#999',
    border: 'none',
    borderRight: '1px solid #e5e5e5',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 16px 0 8px',
  },
  '.cm-foldGutter .cm-gutterElement': {
    padding: '0 4px',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: '#e5e5e5',
  },
  '.cm-selectionMatch': {
    backgroundColor: '#e5e5e5',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#e5e5e5',
    outline: '1px solid #999',
  },
  '.cm-searchMatch': {
    backgroundColor: '#e5e5e5',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#ccc',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
})

type Props = {
  initialContent?: string
  onChange?: (content: string) => void
  readOnly?: boolean
  className?: string
}

export function LaTeXEditor({ initialContent = '', onChange, readOnly = false, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    const readOnlyCompartment = new Compartment()

    const state = EditorState.create({
      doc: initialContent,
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
        syntaxHighlighting(defaultHighlightStyle),
        syntaxHighlighting(latexHighlightStyle),
        monochromTheme,
        readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...closeBracketsKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [mounted, initialContent, onChange, readOnly])

  if (!mounted) {
    return (
      <div className={`bg-white border border-border ${className}`}>
        <div className="h-full flex items-center justify-center text-muted">
          Loading editor...
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className={`bg-white border border-border overflow-hidden ${className}`}
    />
  )
}
