'use client'

import { CollaborativeEditor } from '@/components/editor/collaborative-editor'
import { FileTree } from '@/components/editor/file-tree'
import { ShareModal } from '@/components/sharing/share-modal'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

const DynamicTerminal = dynamic(
  () => import('@/components/editor/local-terminal').then((mod) => mod.LocalTerminal),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-muted text-sm">Loading terminal...</div> }
)

const DynamicOpenCodePanel = dynamic(
  () => import('@/components/opencode/opencode-panel').then((mod) => mod.OpenCodePanel),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-muted text-sm">Loading OpenCode...</div> }
)

type Document = {
  id: string
  title: string
  created_at: string
  updated_at: string
  created_by: string
}

type FileNode = {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

type GitInfo = {
  branch: string
  isDirty: boolean
  lastCommit?: {
    hash: string
    message: string
    date: string
  }
}

type Props = {
  document: Document
  userId: string
  userName: string
  role: 'owner' | 'editor' | 'viewer'
}

export function EditorPageClient({ document, userId, userName, role }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(document.title)
  const [isSaving, setIsSaving] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [files, setFiles] = useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = useState<string>()
  const [fileContent, setFileContent] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showTerminal, setShowTerminal] = useState(true)
  const [showPdf, setShowPdf] = useState(false)
  const [rightPanelMode, setRightPanelMode] = useState<'terminal' | 'opencode'>('opencode')
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(224)
  const [terminalWidth, setTerminalWidth] = useState(400)
  const [resizing, setResizing] = useState<'sidebar' | 'terminal' | null>(null)
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingTitleRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)
  const wsRef = useRef<WebSocket | null>(null)

  const saveTitleToDb = useCallback(async (newTitle: string, skipStateUpdate = false) => {
    if (!skipStateUpdate) setIsSaving(true)
    const supabase = createClient()
    await supabase
      .from('documents')
      .update({ title: newTitle })
      .eq('id', document.id)
    if (!skipStateUpdate && isMountedRef.current) setIsSaving(false)
  }, [document.id])

  const handleTitleChange = useCallback((newTitle: string) => {
    if (role === 'viewer') return
    
    setTitle(newTitle)
    pendingTitleRef.current = newTitle

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (pendingTitleRef.current !== null) {
        saveTitleToDb(pendingTitleRef.current)
        pendingTitleRef.current = null
      }
    }, 300)
  }, [role, saveTitleToDb])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        if (pendingTitleRef.current !== null) {
          saveTitleToDb(pendingTitleRef.current, true)
        }
      }
    }
  }, [saveTitleToDb])

  useEffect(() => {
    if (!resizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (resizing === 'sidebar') {
        setSidebarWidth(Math.min(Math.max(e.clientX, 150), 400))
      } else if (resizing === 'terminal') {
        setTerminalWidth(Math.min(Math.max(window.innerWidth - e.clientX, 250), 600))
      }
    }

    const handleMouseUp = () => setResizing(null)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (selectedFile && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'refresh-files' }))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedFile])

  const handleFileSelect = useCallback((path: string) => {
    setSelectedFile(path)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'read-file', path }))
    }
  }, [])

  const handleFileContentUpdate = useCallback((path: string, content: string) => {
    if (path === selectedFile) {
      setFileContent(content)
    }
  }, [selectedFile])

  const handleGitInfoUpdate = useCallback((info: GitInfo) => {
    setGitInfo(info)
  }, [])

  const handlePdfUpdate = useCallback((url: string) => {
    setPdfUrl(url)
  }, [])



  const handleContentChange = useCallback((content: string) => {
    if (selectedFile && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'write-file', 
        path: selectedFile, 
        content 
      }))
    }
  }, [selectedFile])

  const handleDeleteConfirm = useCallback(async () => {
    if (role !== 'owner') return

    const supabase = createClient()
    await supabase
      .from('documents')
      .delete()
      .eq('id', document.id)

    router.push('/dashboard')
  }, [document.id, role, router])

  const userColors = [
    '#000000', '#333333', '#666666', '#999999',
    '#1a1a1a', '#2a2a2a', '#3a3a3a', '#4a4a4a',
  ]
  const userColor = userColors[userId.charCodeAt(0) % userColors.length] ?? '#000000'

  return (
    <div className="h-dvh flex flex-col">
      <header className="border-b border-border flex-shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              aria-label="Back to dashboard"
              className="text-muted hover:text-black transition-colors"
            >
              <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={role === 'viewer'}
              className="text-lg font-medium bg-transparent border-0 focus:outline-none focus:ring-0 w-auto min-w-[200px] disabled:opacity-50"
              placeholder="Untitled Document"
            />
            {isSaving && (
              <span className="text-xs text-muted">Saving...</span>
            )}
            
            {gitInfo && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-mono">{gitInfo.branch}</span>
                {gitInfo.isDirty && (
                  <span className="size-2 bg-black" title="Uncommitted changes" />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar((v) => !v)}
              className={`p-1 transition-colors ${showSidebar ? 'text-black' : 'text-muted hover:text-black'}`}
              title={showSidebar ? 'Hide files' : 'Show files'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <button
              onClick={() => setShowPdf((v) => !v)}
              className={`p-1 transition-colors ${showPdf ? 'text-black' : 'text-muted hover:text-black'}`}
              title={showPdf ? 'Hide PDF' : 'Show PDF'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setShowTerminal((v) => !v)}
              className={`p-1 transition-colors ${showTerminal ? 'text-black' : 'text-muted hover:text-black'}`}
              title={showTerminal ? 'Hide panel' : 'Show panel'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            <div className="w-px h-5 bg-border" />
            
            {role !== 'owner' && (
              <span className="text-xs uppercase tracking-wider text-muted border border-border px-2 py-1">
                {role}
              </span>
            )}
            {role === 'owner' && (
              <>
                <button
                  onClick={() => setIsShareOpen(true)}
                  className="text-sm text-muted hover:text-black transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-sm text-muted hover:text-black hover:font-bold transition-all"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex">
        {showSidebar && (
          <>
            <aside style={{ width: sidebarWidth }} className="border-r border-border flex flex-col flex-shrink-0">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-medium uppercase tracking-wider text-muted">Files</span>
                <span
                  className={`size-2 ${isConnected ? 'bg-black' : 'bg-muted'}`}
                  title={isConnected ? 'Connected to local daemon' : 'Not connected'}
                />
              </div>
              <FileTree
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                className="flex-1"
              />
              {!isConnected && files.length === 0 && (
                <div className="p-3 text-xs text-muted border-t border-border">
                  Run <code className="bg-border px-1">llw serve</code> to connect
                </div>
              )}
            </aside>
            <div
              onMouseDown={() => setResizing('sidebar')}
              className={`w-1 cursor-col-resize hover:bg-black/20 transition-colors ${resizing === 'sidebar' ? 'bg-black/20' : ''}`}
            />
          </>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          {isConnected && selectedFile ? (
            <CollaborativeEditor
              documentId={document.id}
              userId={userId}
              userName={userName}
              userColor={userColor}
              content={fileContent}
              readOnly={role === 'viewer'}
              onContentChange={handleContentChange}
              className="flex-1"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted">
              {isConnected ? (
                <p>Select a file to edit</p>
              ) : (
                <div className="text-center space-y-4">
                  <p>Connect to your local project</p>
                  <code className="bg-border px-3 py-2 text-sm">llw serve</code>
                  <p className="text-xs max-w-md">
                    Works with Claude Code, OpenCode, Codex, and any AI coding assistant that can edit files directly.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {showPdf && (
          <aside className="w-[500px] border-l border-border flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">PDF Preview</span>
            </div>
            <div className="flex-1 bg-neutral-100">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted text-sm">
                  <div className="text-center space-y-2">
                    <p>No PDF available</p>
                    <p className="text-xs">Run <code className="bg-border px-1">llw compile main.tex</code></p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {showTerminal && (
          <>
            <div
              onMouseDown={() => setResizing('terminal')}
              className={`w-1 cursor-col-resize hover:bg-black/20 transition-colors ${resizing === 'terminal' ? 'bg-black/20' : ''}`}
            />
            <aside style={{ width: terminalWidth }} className="border-l border-border flex-shrink-0 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
                <div className="flex gap-1">
                  <button
                    onClick={() => setRightPanelMode('terminal')}
                    className={`px-2 py-1 text-xs transition-colors ${rightPanelMode === 'terminal' ? 'bg-black text-white' : 'text-muted hover:text-black'}`}
                  >
                    Terminal
                  </button>
                  <button
                    onClick={() => setRightPanelMode('opencode')}
                    className={`px-2 py-1 text-xs transition-colors ${rightPanelMode === 'opencode' ? 'bg-black text-white' : 'text-muted hover:text-black'}`}
                  >
                    OpenCode
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {rightPanelMode === 'terminal' ? (
                  <DynamicTerminal
                    onFilesUpdate={setFiles}
                    onConnectionChange={setIsConnected}
                    onFileContent={handleFileContentUpdate}
                    onGitInfo={handleGitInfoUpdate}
                    onPdfUrl={handlePdfUpdate}
                    wsRef={wsRef}
                    className="h-full"
                  />
                ) : (
                  <DynamicOpenCodePanel
                    baseUrl="http://localhost:4096"
                    className="h-full"
                  />
                )}
              </div>
            </aside>
          </>
        )}
        {resizing && <div className="fixed inset-0 z-50 cursor-col-resize" />}
      </main>

      <ShareModal
        documentId={document.id}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
      />
    </div>
  )
}
