import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  try {
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get('sentiment_user_id')?.value
    if (!userIdCookie) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const currentUserId = userIdCookie

    const { data, error } = await supabaseAdmin
      .from('sentiment_notifications')
      .select('*')
      .eq('destinatario', currentUserId)
      .order('data', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ notifications: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get('sentiment_user_id')?.value
    if (!userIdCookie) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const currentUserId = userIdCookie

    await supabaseAdmin
      .from('sentiment_notifications')
      .update({ lido: true })
      .eq('destinatario', currentUserId)
      .eq('lido', false)

    return NextResponse.json({ status: 'marked_as_read' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
