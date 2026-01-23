import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTemplate, type TemplateId } from '@/lib/templates'
import * as Y from 'yjs'

function encodeYjsUpdate(content: string): string {
  const ydoc = new Y.Doc()
  const ytext = ydoc.getText('content')
  ytext.insert(0, content)
  const update = Y.encodeStateAsUpdate(ydoc)
  ydoc.destroy()
  return btoa(String.fromCharCode(...update))
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const templateId = body.template as TemplateId | undefined
  const template = templateId ? getTemplate(templateId) : undefined
  const title = body.title || template?.name || 'Untitled Document'

  const { data, error } = await supabase
    .from('documents')
    .insert({ title, created_by: user.id })
    .select('id, title, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (template) {
    const encodedUpdate = encodeYjsUpdate(template.content)
    
    const { error: yjsError } = await supabase
      .from('yjs_updates')
      .insert({
        document_id: data.id,
        file_path: 'main.tex',
        update: encodedUpdate,
        is_snapshot: true,
      })

    if (yjsError) {
      console.error('Failed to insert template content:', yjsError)
    }
  }

  return NextResponse.json(data, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('documents')
    .select('id, title, created_at, updated_at')
    .eq('created_by', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
