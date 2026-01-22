'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { HighlightStyle } from '@codemirror/language'
import * as Y from 'yjs'
import { yCollab } from 'y-codemirror.next'
import { SupabaseProvider } from '@/lib/yjs/supabase-provider'

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
    height: '100%',
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
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
    height: '100%',
  },
  '.cm-ySelectionInfo': {
    fontSize: '11px',
    fontFamily: 'system-ui, sans-serif',
    padding: '2px 4px',
    position: 'absolute',
    top: '-1.4em',
    left: '-1px',
    zIndex: 10,
    opacity: 1,
  },
})

type Props = {
  documentId: string
  userId: string
  userName: string
  userColor?: string
  readOnly?: boolean
  className?: string
}

type AwarenessState = {
  user?: {
    id: string
    name: string
    color: string
  }
}

export function CollaborativeEditor({
  documentId,
  userId,
  userName,
  userColor = '#000',
  readOnly = false,
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const ydocRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<SupabaseProvider | null>(null)
  const [mounted, setMounted] = useState(false)
  const [collaborators, setCollaborators] = useState<Map<string, AwarenessState>>(new Map())

  const handleAwarenessUpdate = useCallback((awareness: Map<string, AwarenessState>) => {
    setCollaborators(new Map(awareness))
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    
    const provider = new SupabaseProvider(ydoc, {
      documentId,
      userId,
      userName,
    })
    providerRef.current = provider

    provider.setAwareness({
      user: { id: userId, name: userName, color: userColor }
    })

    provider.onAwarenessUpdate(handleAwarenessUpdate)

    const ytext = ydoc.getText('content')
    const readOnlyCompartment = new Compartment()

    const state = EditorState.create({
      doc: ytext.toString(),
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
        yCollab(ytext, provider.getAwareness()),
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
      provider.destroy()
      providerRef.current = null
      ydoc.destroy()
      ydocRef.current = null
    }
  }, [mounted, documentId, userId, userName, userColor, readOnly, handleAwarenessUpdate])

  if (!mounted) {
    return (
      <div className={`bg-white border border-border ${className}`}>
        <div className="h-full flex items-center justify-center text-muted">
          Loading editor...
        </div>
      </div>
    )
  }

  const otherUsers = Array.from(collaborators.entries())
    .filter(([id]) => id !== userId)
    .map(([, state]) => state.user)
    .filter(Boolean)

  return (
    <div className={`flex flex-col ${className}`}>
      {otherUsers.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border text-sm">
          <span className="text-muted">Editing with:</span>
          {otherUsers.map((user, i) => (
            <span
              key={user?.id || i}
              className="inline-flex items-center gap-1"
            >
              <span
                className="w-2 h-2"
                style={{ backgroundColor: user?.color || '#666' }}
              />
              <span>{user?.name || 'Anonymous'}</span>
            </span>
          ))}
        </div>
      )}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-hidden"
      />
    </div>
  )
}
