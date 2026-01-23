'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { templates, type TemplateId } from '@/lib/templates'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function TemplateSelectModal({ isOpen, onClose }: Props) {
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('tech-report')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  function handleFocusTrap(e: React.KeyboardEvent) {
    if (e.key !== 'Tab' || !modalRef.current) return

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selectedTemplate }),
      })

      if (!res.ok) {
        const error = await res.json()
        console.error('Failed to create document:', error)
        return
      }

      const data = await res.json()
      router.push(`/editor/${data.id}`)
    } catch (error) {
      console.error('Failed to create document:', error)
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 modal-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={handleFocusTrap}
        className="relative bg-white border border-border w-full max-w-lg mx-4 max-h-[90vh] overflow-auto modal-content"
      >
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 id="template-modal-title" className="text-lg font-medium">
            New Document
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="square" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted mb-4">Select a template to start with</p>
          
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`w-full text-left p-4 border transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-black bg-accent'
                    : 'border-border hover:border-black'
                }`}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-muted mt-1">{template.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 py-2 text-sm bg-black text-white hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </div>
    </div>
  )
}
