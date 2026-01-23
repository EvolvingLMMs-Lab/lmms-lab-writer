'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DevTestLoginPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleTestLogin() {
    setStatus('loading')
    setError(null)

    try {
      // Get test credentials from API
      const response = await fetch('/api/dev/test-login', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get test credentials')
      }

      // Login with test credentials
      const supabase = createClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (loginError) {
        throw new Error(loginError.message)
      }

      setStatus('success')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-tight mb-2">Dev Test Login</h1>
          <p className="text-muted text-sm">One-click login for testing</p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-black text-black text-sm font-medium">
            Error: {error}
          </div>
        )}

        <button
          onClick={handleTestLogin}
          disabled={status === 'loading' || status === 'success'}
          className="btn btn-primary w-full"
        >
          {status === 'loading' && 'Logging in...'}
          {status === 'success' && 'Redirecting...'}
          {status === 'idle' && 'Login as Test User'}
          {status === 'error' && 'Try Again'}
        </button>

        <div className="mt-8 text-xs text-muted">
          <p>Test account: test@latex-writer.dev</p>
          <p className="mt-2 text-black font-medium">Development only - not available in production</p>
        </div>
      </div>
    </div>
  )
}
