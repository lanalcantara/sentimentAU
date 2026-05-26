import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get('sentiment_user_id')?.value
    if (!userIdCookie) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const currentUserId = userIdCookie
    const { targetUserId } = await req.json()

    if (!targetUserId) {
      return NextResponse.json({ error: 'Faltando targetUserId' }, { status: 400 })
    }

    // Send notification for hug
    await supabaseAdmin.from('sentiment_notifications').insert({
      remetente: currentUserId,
      destinatario: targetUserId,
      tipo: 'hug'
    })

    return NextResponse.json({ status: 'hug_sent' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
