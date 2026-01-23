import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Context = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: Context) {
  const supabase = await createClient()
  const { id } = await context.params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: doc } = await supabase
    .from('documents')
    .select('created_by')
    .eq('id', id)
    .single()

  const hasAccess = doc?.created_by === user.id || await checkDocumentAccess(supabase, id, user.id)
  
  if (!hasAccess) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { data: files } = await supabase
    .from('document_shared_files')
    .select('id, file_name, file_size, mime_type, created_at, storage_path')
    .eq('document_id', id)
    .order('created_at', { ascending: false })

  const filesWithUrls = (files || []).map(file => {
    const { data } = supabase.storage.from('shared-files').getPublicUrl(file.storage_path)
    return {
      ...file,
      url: data.publicUrl,
    }
  })

  return NextResponse.json(filesWithUrls)
}

export async function DELETE(request: Request, context: Context) {
  const supabase = await createClient()
  const { id } = await context.params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: doc } = await supabase
    .from('documents')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!doc || doc.created_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('fileId')

  if (!fileId) {
    return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })
  }

  const { data: file } = await supabase
    .from('document_shared_files')
    .select('storage_path, file_size')
    .eq('id', fileId)
    .eq('document_id', id)
    .single()

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  await supabase.storage.from('shared-files').remove([file.storage_path])
  
  await supabase
    .from('document_shared_files')
    .delete()
    .eq('id', fileId)

  const { data: storage } = await supabase
    .from('user_storage')
    .select('used_bytes')
    .eq('user_id', user.id)
    .single()

  if (storage) {
    await supabase
      .from('user_storage')
      .update({ used_bytes: Math.max(0, storage.used_bytes - file.file_size) })
      .eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}

async function checkDocumentAccess(supabase: Awaited<ReturnType<typeof createClient>>, documentId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('document_access')
    .select('role')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .single()
  
  return !!data
}
