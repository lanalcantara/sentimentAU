import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('sentiment_user_id')?.value
    if (!userIdCookie) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const currentUserId = userIdCookie
    const { targetUserId } = await req.json()

    if (!targetUserId) {
      return NextResponse.json({ error: 'Faltando targetUserId' }, { status: 400 })
    }

    // Don't send a hug to yourself
    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: 'Não é possível enviar abraço para si mesmo.' }, { status: 400 })
    }

    // Insert notification using real column names: sender_id, receiver_id, type, is_read
    const { error } = await supabaseAdmin.from('sentiment_notifications').insert({
      sender_id: currentUserId,
      receiver_id: targetUserId,
      type: 'hug',
      is_read: false,
    })

    if (error) throw error

    return NextResponse.json({ status: 'hug_sent' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
