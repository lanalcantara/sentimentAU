import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get('session_user_id')?.value
    if (!userIdCookie) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const currentUserId = userIdCookie
    const { targetUserId } = await req.json()

    if (!targetUserId) {
      return NextResponse.json({ error: 'Faltando targetUserId' }, { status: 400 })
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: 'Não é possível regar seu próprio jardim.' }, { status: 400 })
    }

    // Insert notification of type 'regar'
    const { error } = await supabaseAdmin.from('sentiment_notifications').insert({
      sender_id: currentUserId,
      receiver_id: targetUserId,
      type: 'regar',
      message: 'passou por aqui e regou o seu jardim com carinho! 💧',
      is_read: false,
    })

    if (error) throw error

    return NextResponse.json({ status: 'water_sent' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
