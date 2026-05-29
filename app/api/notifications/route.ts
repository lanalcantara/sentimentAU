import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('session_user_id')?.value
    if (!userIdCookie) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const currentUserId = userIdCookie

    const { data, error } = await supabaseAdmin
      .from('sentiment_notifications')
      .select(`
        *,
        sender:sentiment_users!sender_id(username, flor_avatar_atual)
      `)
      .eq('receiver_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Map to the shape expected by the NotificationsPopover component
    const notifications = (data || []).map((n: any) => ({
      id: n.id,
      tipo: n.type,
      lido: n.is_read,
      data: n.created_at,
      remetente: n.sender?.username || 'Alguém',
      florRemetente: n.sender?.flor_avatar_atual || 'semente',
      mensagem: n.message || '',
    }))

    return NextResponse.json({ notifications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('session_user_id')?.value
    if (!userIdCookie) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const currentUserId = userIdCookie

    await supabaseAdmin
      .from('sentiment_notifications')
      .update({ is_read: true })
      .eq('receiver_id', currentUserId)
      .eq('is_read', false)

    return NextResponse.json({ status: 'marked_as_read' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
