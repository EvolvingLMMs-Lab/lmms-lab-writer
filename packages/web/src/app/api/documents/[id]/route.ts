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

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  const hasAccess = data.created_by === user.id
  if (!hasAccess) {
    const { data: access } = await supabase
      .from('document_access')
      .select('role')
      .eq('document_id', id)
      .eq('user_id', user.id)
      .single()
    
    if (!access) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request, context: Context) {
  const supabase = await createClient()
  const { id } = await context.params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title } = body

  const { data, error } = await supabase
    .from('documents')
    .update({ title })
    .eq('id', id)
    .eq('created_by', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, context: Context) {
  const supabase = await createClient()
  const { id } = await context.params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
