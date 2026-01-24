'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  variant?: 'default' | 'primary'
}

export function NewDocumentButton({ variant = 'default' }: Props) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const baseClasses = 'btn btn-sm h-8 flex items-center gap-2'
  const variantClasses = variant === 'primary' ? 'btn-primary' : 'btn-secondary'

  const handleCreate = async () => {
    if (isCreating) return
    setIsCreating(true)

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document' }),
      })

      if (res.ok) {
        const doc = await res.json()
        router.push(`/editor/${doc.id}`)
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={isCreating}
      className={`${baseClasses} ${variantClasses} disabled:opacity-50`}
    >
      <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {isCreating ? 'Creating...' : 'New project'}
    </button>
  )
}
