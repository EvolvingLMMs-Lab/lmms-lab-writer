import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Props = {
  params: Promise<{ token: string }>
}

async function acceptInvite(token: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: invite } = await supabase
    .from('share_invites')
    .select('id, document_id, email, role, expires_at, documents(title)')
    .eq('token', token)
    .single()

  if (!invite) {
    return { error: 'Invalid or expired invite link' }
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'This invite has expired' }
  }

  if (!user) {
    return { 
      requiresAuth: true, 
      email: invite.email,
      documentTitle: (invite.documents as unknown as { title: string } | null)?.title || 'Untitled',
      role: invite.role,
    }
  }

  if (user.email !== invite.email) {
    return { error: `This invite was sent to ${invite.email}. Please sign in with that email.` }
  }

  const { error: accessError } = await supabase
    .from('document_access')
    .insert({
      document_id: invite.document_id,
      user_id: user.id,
      role: invite.role,
      invited_by: null,
    })

  if (accessError && !accessError.message.includes('duplicate')) {
    return { error: 'Failed to accept invite' }
  }

  await supabase
    .from('share_invites')
    .delete()
    .eq('id', invite.id)

  return { documentId: invite.document_id }
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const result = await acceptInvite(token)

  if ('documentId' in result) {
    redirect(`/editor/${result.documentId}`)
  }

  if ('error' in result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 border-2 border-black flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-light tracking-tight mb-4">Invite Error</h1>
          <p className="text-muted mb-6">{result.error}</p>
          <Link href="/dashboard" className="btn btn-secondary inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if ('requiresAuth' in result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 border-2 border-black flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-light tracking-tight mb-2">You&apos;re invited!</h1>
          <p className="text-muted mb-6">
            You&apos;ve been invited as <strong>{result.role}</strong> to{' '}
            <strong>{result.documentTitle}</strong>
          </p>
          <p className="text-sm text-muted mb-6">
            Sign in with <strong>{result.email}</strong> to accept
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href={`/login?redirect=/invite/${token}`} 
              className="btn btn-primary"
            >
              Sign in
            </Link>
            <Link 
              href={`/signup?redirect=/invite/${token}&email=${encodeURIComponent(result.email)}`} 
              className="btn btn-secondary"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
