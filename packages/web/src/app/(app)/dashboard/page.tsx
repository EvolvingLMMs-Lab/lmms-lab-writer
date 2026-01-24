import { createClient } from '@/lib/supabase/server'
import type { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { DocumentList } from './document-list'
import { NewDocumentButton } from './new-document-button'
import { SignOutButton } from './sign-out-button'

type Document = {
  id: string
  title: string
  created_at: string
  updated_at: string
  role: 'owner' | 'editor' | 'viewer'
}

type OwnedDoc = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

type SharedAccess = {
  document_id: string
  role: string
  documents: OwnedDoc | null
}

type UserProfile = {
  email: string
  created_at: string
}

function getUserProfile(session: Session): UserProfile {
  return {
    email: session.user.email ?? '',
    created_at: session.user.created_at,
  }
}

async function getDashboardData(): Promise<{ documents: Document[]; profile: UserProfile }> {
  const supabase = await createClient()

  // getSession() reads from cookie - ZERO network requests
  // Middleware already validated session, this just retrieves it
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const profile = getUserProfile(session)
  const userId = session.user.id

  // Parallel database queries - only network requests needed
  const [ownedDocsResult, sharedAccessResult] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, created_at, updated_at')
      .eq('created_by', userId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('document_access')
      .select('document_id, role, documents(id, title, created_at, updated_at)')
      .eq('user_id', userId),
  ])

  const ownedDocs = ownedDocsResult.data
  const sharedAccess = sharedAccessResult.data

  const owned: Document[] = (ownedDocs ?? []).map((doc: OwnedDoc) => ({
    ...doc,
    role: 'owner' as const,
  }))

  const shared: Document[] = ((sharedAccess ?? []) as unknown as SharedAccess[])
    .filter((a) => a.documents)
    .map((a) => ({
      ...a.documents!,
      role: a.role as 'editor' | 'viewer',
    }))

  const documents = [...owned, ...shared].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  return { documents, profile }
}

function formatDate(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function DashboardPage() {
  const { documents, profile } = await getDashboardData()

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-3">
            <div className="logo-bar text-foreground">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            LMMs-Lab Writer
          </Link>
          <div className="flex items-center gap-4">
            <NewDocumentButton />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-light tracking-tight">Documents</h1>
          {profile && (
            <div className="flex items-center gap-3 text-sm">
              <div className="size-8 border border-border flex items-center justify-center bg-border">
                <span className="font-medium">{profile.email.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium">{profile.email}</p>
                <p className="text-muted text-xs">Member since {formatDate(profile.created_at)}</p>
              </div>
            </div>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="border border-border p-12 text-center">
            <div className="max-w-sm mx-auto">
              <h2 className="text-xl font-light mb-2">No documents yet</h2>
              <p className="text-muted mb-6">
                Create your first LaTeX document to get started
              </p>
              <NewDocumentButton variant="primary" />
            </div>
          </div>
        ) : (
          <DocumentList documents={documents} />
        )}
      </main>
    </div>
  )
}


