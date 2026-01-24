import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { EditorPageClient } from './editor-page-client'

type Props = {
  params: Promise<{ id: string }>
}

async function getDocument(id: string) {
  const supabase = await createClient()

  // getSession() reads from cookie - ZERO network requests
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const userId = session.user.id

  // Parallel fetch: document + access check
  const [docResult, accessResult] = await Promise.all([
    supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('document_access')
      .select('role')
      .eq('document_id', id)
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const { data: doc, error } = docResult
  if (error || !doc) {
    notFound()
  }

  const isOwner = doc.created_by === userId
  let role: 'owner' | 'editor' | 'viewer'

  if (isOwner) {
    role = 'owner'
  } else if (accessResult.data) {
    role = accessResult.data.role as 'editor' | 'viewer'
  } else {
    notFound()
  }

  return {
    document: doc,
    user: {
      id: userId,
      email: session.user.email || 'Anonymous',
    },
    role,
  }
}

export default async function EditorPage({ params }: Props) {
  const { id } = await params
  const { document, user, role } = await getDocument(id)

  return (
    <EditorPageClient
      document={document}
      userId={user.id}
      userName={user.email}
      role={role}
    />
  )
}
