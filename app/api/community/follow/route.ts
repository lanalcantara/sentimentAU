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

    // Check if follow exists
    const { data: existingFollow } = await supabaseAdmin
      .from('sentiment_follows')
      .select('id')
      .eq('seguidor', currentUserId)
      .eq('seguido', targetUserId)
      .maybeSingle()

    if (existingFollow) {
      // Unfollow
      await supabaseAdmin.from('sentiment_follows').delete().eq('id', existingFollow.id)
      return NextResponse.json({ status: 'unfollowed' })
    } else {
      // Follow
      await supabaseAdmin.from('sentiment_follows').insert({
        seguidor: currentUserId,
        seguido: targetUserId
      })

      // Send notification
      await supabaseAdmin.from('sentiment_notifications').insert({
        remetente: currentUserId,
        destinatario: targetUserId,
        tipo: 'follow'
      })

      return NextResponse.json({ status: 'followed' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
