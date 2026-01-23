'use client'

import { useState } from 'react'
import { TemplateSelectModal } from '@/components/templates/template-select-modal'

type Props = {
  variant?: 'default' | 'primary'
}

export function NewDocumentButton({ variant = 'default' }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const baseClasses = 'btn flex items-center gap-2'
  const variantClasses = variant === 'primary' ? 'btn-primary' : 'btn-secondary'

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`${baseClasses} ${variantClasses}`}
      >
        <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New document
      </button>
      <TemplateSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
