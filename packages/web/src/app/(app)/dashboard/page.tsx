import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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

async function getDocuments(): Promise<Document[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: ownedDocs } = await supabase
    .from('documents')
    .select('id, title, created_at, updated_at')
    .eq('created_by', user.id)
    .order('updated_at', { ascending: false })

  const { data: sharedAccess } = await supabase
    .from('document_access')
    .select('document_id, role, documents(id, title, created_at, updated_at)')
    .eq('user_id', user.id)

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

  return [...owned, ...shared].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
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
  const documents = await getDocuments()

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            LaTeX Writer
          </Link>
          <div className="flex items-center gap-4">
            <NewDocumentButton />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light tracking-tight mb-8">Documents</h1>

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
          <div className="border border-border divide-y divide-border">
            {documents.map(doc => (
              <Link
                key={doc.id}
                href={`/editor/${doc.id}`}
                className="flex items-center justify-between p-4 hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-border flex items-center justify-center group-hover:border-black transition-colors">
                    <svg className="w-5 h-5 text-muted group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">{doc.title}</h3>
                    <p className="text-sm text-muted">
                      {doc.role !== 'owner' && (
                        <span className="mr-2 text-xs uppercase tracking-wider">{doc.role}</span>
                      )}
                      {formatDate(doc.updated_at)}
                    </p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-muted group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}


