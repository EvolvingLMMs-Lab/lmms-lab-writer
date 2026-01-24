'use client'

import dynamic from 'next/dynamic'

// Skeleton component for SSR and loading state
function EditorSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Skeleton header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="h-4 w-24 bg-neutral-200 animate-pulse rounded" />
        <div className="h-4 w-32 bg-neutral-200 animate-pulse rounded" />
      </div>
      {/* Skeleton editor lines */}
      <div className="flex-1 bg-white p-4 space-y-2">
        {[70, 45, 60, 80, 35, 55, 40, 75].map((width, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-8 h-4 bg-neutral-100 animate-pulse rounded" />
            <div
              className="h-4 bg-neutral-100 animate-pulse rounded"
              style={{ width: `${width}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Dynamic import with code splitting - CodeMirror bundle loads only when needed
export const CollaborativeEditorLazy = dynamic(
  () => import('./collaborative-editor').then(mod => ({ default: mod.CollaborativeEditor })),
  {
    loading: () => <EditorSkeleton className="flex-1" />,
    ssr: false, // CodeMirror doesn't work with SSR
  }
)
