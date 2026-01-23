import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: storage } = await supabase
    .from('user_storage')
    .select('used_bytes, max_bytes')
    .eq('user_id', user.id)
    .single()

  if (!storage) {
    return NextResponse.json({
      used_bytes: 0,
      max_bytes: 52428800,
      used_mb: 0,
      max_mb: 50,
      percent_used: 0,
    })
  }

  return NextResponse.json({
    used_bytes: storage.used_bytes,
    max_bytes: storage.max_bytes,
    used_mb: Math.round(storage.used_bytes / 1024 / 1024 * 100) / 100,
    max_mb: Math.round(storage.max_bytes / 1024 / 1024),
    percent_used: Math.round(storage.used_bytes / storage.max_bytes * 100),
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const documentId = formData.get('documentId') as string | null

  if (!file || !documentId) {
    return NextResponse.json({ error: 'Missing file or documentId' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const { data: doc } = await supabase
    .from('documents')
    .select('created_by')
    .eq('id', documentId)
    .single()

  if (!doc || doc.created_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { data: storage } = await supabase
    .from('user_storage')
    .select('used_bytes, max_bytes')
    .eq('user_id', user.id)
    .single()

  const usedBytes = storage?.used_bytes ?? 0
  const maxBytes = storage?.max_bytes ?? 52428800

  if (usedBytes + file.size > maxBytes) {
    return NextResponse.json({ 
      error: 'Storage quota exceeded',
      used_bytes: usedBytes,
      max_bytes: maxBytes,
    }, { status: 413 })
  }

  const fileExt = file.name.split('.').pop() || 'pdf'
  const storagePath = `${user.id}/${documentId}/${Date.now()}.${fileExt}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('shared-files')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { error: insertError } = await supabase
    .from('document_shared_files')
    .insert({
      document_id: documentId,
      uploaded_by: user.id,
      file_name: file.name,
      file_size: file.size,
      storage_path: storagePath,
      mime_type: file.type,
    })

  if (insertError) {
    await supabase.storage.from('shared-files').remove([storagePath])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await supabase
    .from('user_storage')
    .upsert({
      user_id: user.id,
      used_bytes: usedBytes + file.size,
      max_bytes: maxBytes,
    })

  const { data: publicUrl } = supabase.storage
    .from('shared-files')
    .getPublicUrl(storagePath)

  return NextResponse.json({ 
    success: true,
    url: publicUrl.publicUrl,
    file_name: file.name,
    file_size: file.size,
  }, { status: 201 })
}
