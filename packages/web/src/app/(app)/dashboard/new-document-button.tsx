'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  variant?: 'default' | 'primary'
}

export function NewDocumentButton({ variant = 'default' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({ created_by: user.id })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create document:', error)
      setLoading(false)
      return
    }

    router.push(`/editor/${data.id}`)
  }

  const baseClasses = 'btn flex items-center gap-2'
  const variantClasses = variant === 'primary' ? 'btn-primary' : 'btn-secondary'

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className={`${baseClasses} ${variantClasses}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {loading ? 'Creating...' : 'New document'}
    </button>
  )
}
