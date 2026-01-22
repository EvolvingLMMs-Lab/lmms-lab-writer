'use client'

import { CollaborativeEditor } from '@/components/editor/collaborative-editor'
import { ShareModal } from '@/components/sharing/share-modal'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

type Document = {
  id: string
  title: string
  created_at: string
  updated_at: string
  created_by: string
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

  const handleTitleChange = useCallback(async (newTitle: string) => {
    if (role === 'viewer') return
    
    setTitle(newTitle)
    setIsSaving(true)

    const supabase = createClient()
    await supabase
      .from('documents')
      .update({ title: newTitle })
      .eq('id', document.id)

    setIsSaving(false)
  }, [document.id, role])

  const handleDelete = useCallback(async () => {
    if (role !== 'owner') return
    if (!confirm('Are you sure you want to delete this document?')) return

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
  const userColor = userColors[userId.charCodeAt(0) % userColors.length]

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-border flex-shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="text-muted hover:text-black transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>

          <div className="flex items-center gap-4">
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <button
                  onClick={handleDelete}
                  className="text-sm text-muted hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <CollaborativeEditor
          documentId={document.id}
          userId={userId}
          userName={userName}
          userColor={userColor}
          readOnly={role === 'viewer'}
          className="h-full"
        />
      </main>

      <ShareModal
        documentId={document.id}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  )
}
