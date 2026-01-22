import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

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

  if (!doc || doc.created_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { data: collaborators } = await supabase
    .from('document_access')
    .select('user_id, role, created_at')
    .eq('document_id', id)

  const { data: pendingInvites } = await supabase
    .from('share_invites')
    .select('id, email, role, expires_at, created_at')
    .eq('document_id', id)
    .gt('expires_at', new Date().toISOString())

  return NextResponse.json({
    collaborators: collaborators || [],
    pendingInvites: pendingInvites || [],
  })
}

export async function POST(request: Request, context: Context) {
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

  const body = await request.json()
  const { email, role } = body

  if (!email || !role || !['editor', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: existingUser } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    const { error } = await supabase
      .from('document_access')
      .upsert({
        document_id: id,
        user_id: existingUser.id,
        role,
        invited_by: user.id,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, type: 'direct' })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await supabase
    .from('share_invites')
    .insert({
      document_id: id,
      email,
      role,
      token,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const inviteUrl = `${new URL(request.url).origin}/invite/${token}`

  return NextResponse.json({ 
    success: true, 
    type: 'invite',
    inviteUrl,
  })
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
  const userId = searchParams.get('userId')
  const inviteId = searchParams.get('inviteId')

  if (userId) {
    await supabase
      .from('document_access')
      .delete()
      .eq('document_id', id)
      .eq('user_id', userId)
  } else if (inviteId) {
    await supabase
      .from('share_invites')
      .delete()
      .eq('id', inviteId)
      .eq('document_id', id)
  }

  return NextResponse.json({ success: true })
}
