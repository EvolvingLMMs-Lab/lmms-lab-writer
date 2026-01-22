import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { EditorPageClient } from './editor-page-client'

type Props = {
  params: Promise<{ id: string }>
}

async function getDocument(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !doc) {
    notFound()
  }

  const isOwner = doc.created_by === user.id
  let role: 'owner' | 'editor' | 'viewer' = isOwner ? 'owner' : 'viewer'

  if (!isOwner) {
    const { data: access } = await supabase
      .from('document_access')
      .select('role')
      .eq('document_id', id)
      .eq('user_id', user.id)
      .single()

    if (!access) {
      notFound()
    }
    role = access.role as 'editor' | 'viewer'
  }

  return {
    document: doc,
    user: {
      id: user.id,
      email: user.email || 'Anonymous',
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
