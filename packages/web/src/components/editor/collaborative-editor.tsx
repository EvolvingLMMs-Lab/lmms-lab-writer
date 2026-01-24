'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, StreamLanguage, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { stex } from '@codemirror/legacy-modes/mode/stex'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

const latexLanguage = StreamLanguage.define(stex)

const latexHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#000', fontWeight: 'bold' },
  { tag: tags.comment, color: '#888', fontStyle: 'italic' },
  { tag: tags.string, color: '#333' },
  { tag: tags.number, color: '#333' },
  { tag: tags.operator, color: '#000' },
  { tag: tags.bracket, color: '#555' },
  { tag: tags.meta, color: '#000', fontWeight: 'bold' },
  { tag: tags.tagName, color: '#000', fontWeight: 'bold' },
  { tag: tags.attributeName, color: '#333' },
  { tag: tags.atom, color: '#000', fontWeight: 'bold' },
  { tag: tags.special(tags.string), color: '#444' },
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
})

type Viewer = {
  id: string
  email: string
  color: string
}

type Props = {
  documentId: string
  userId: string
  userName: string
  userColor?: string
  content?: string
  readOnly?: boolean
  className?: string
  onContentChange?: (content: string) => void
}

export function CollaborativeEditor({
  documentId,
  userId,
  userName,
  userColor = '#000',
  content = '',
  readOnly = false,
  className = '',
  onContentChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [mounted, setMounted] = useState(false)
  const [viewers, setViewers] = useState<Viewer[]>([])
  const contentRef = useRef(content)
  const isExternalUpdateRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    const channelName = `presence:doc:${documentId}`
    
    const channel = supabase.channel(channelName)
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const currentViewers: Viewer[] = []
        
        Object.values(state).forEach((presences) => {
          const typedPresences = presences as unknown as Array<{ user_id: string; email: string; color: string }>
          typedPresences.forEach((presence) => {
            if (presence.user_id !== userId) {
              currentViewers.push({
                id: presence.user_id,
                email: presence.email,
                color: presence.color,
              })
            }
          })
        })
        
        setViewers(currentViewers)
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            email: userName,
            color: userColor,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [documentId, userId, userName, userColor])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    const readOnlyCompartment = new Compartment()

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
          // Intercept Cmd/Ctrl+S to prevent browser save dialog
          { key: 'Mod-s', run: () => {
            // Content is auto-saved, so just prevent default
            return true
          }},
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          ...closeBracketsKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((update: { docChanged: boolean; state: EditorState }) => {
          if (update.docChanged && !isExternalUpdateRef.current) {
            const newContent = update.state.doc.toString()
            contentRef.current = newContent
            onContentChange?.(newContent)
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
  }, [mounted, readOnly, onContentChange])

  useEffect(() => {
    if (!viewRef.current || content === contentRef.current) return
    
    isExternalUpdateRef.current = true
    const view = viewRef.current
    const currentContent = view.state.doc.toString()
    
    if (content !== currentContent) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      })
      contentRef.current = content
    }
    isExternalUpdateRef.current = false
  }, [content])

  if (!mounted) {
    return (
      <div className={`flex flex-col ${className}`}>
        {/* Skeleton header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
          <div className="h-4 w-24 bg-neutral-200 animate-pulse rounded" />
          <div className="h-4 w-32 bg-neutral-200 animate-pulse rounded" />
        </div>
        {/* Skeleton editor lines */}
        <div className="flex-1 bg-white p-4 space-y-2">
          <div className="flex gap-4">
            <div className="w-8 h-4 bg-neutral-100 animate-pulse rounded" />
            <div className="flex-1 h-4 bg-neutral-100 animate-pulse rounded" style={{ width: '70%' }} />
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-4 bg-neutral-100 animate-pulse rounded" />
            <div className="flex-1 h-4 bg-neutral-100 animate-pulse rounded" style={{ width: '45%' }} />
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-4 bg-neutral-100 animate-pulse rounded" />
            <div className="flex-1 h-4 bg-neutral-100 animate-pulse rounded" style={{ width: '60%' }} />
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-4 bg-neutral-100 animate-pulse rounded" />
            <div className="flex-1 h-4 bg-neutral-100 animate-pulse rounded" style={{ width: '80%' }} />
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-4 bg-neutral-100 animate-pulse rounded" />
            <div className="flex-1 h-4 bg-neutral-100 animate-pulse rounded" style={{ width: '35%' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border text-sm bg-background">
        <div className="flex items-center gap-2">
          {viewers.length > 0 ? (
            <>
              <span className="text-muted">Viewing:</span>
              <div className="flex items-center -space-x-2">
                {viewers.slice(0, 5).map((viewer) => (
                  <div
                    key={viewer.id}
                    className="size-6 border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: viewer.color }}
                    title={viewer.email}
                  >
                    {viewer.email.charAt(0).toUpperCase()}
                  </div>
                ))}
                {viewers.length > 5 && (
                  <div className="size-6 border-2 border-white bg-muted flex items-center justify-center text-xs font-medium text-white">
                    +{viewers.length - 5}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-muted">Only you</span>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>Auto-saved to local file</span>
        </div>
      </div>
      
      <div 
        ref={containerRef} 
        className="flex-1 overflow-hidden"
      />
    </div>
  )
}
