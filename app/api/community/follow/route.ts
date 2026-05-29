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

    // Check if follow exists
    const { data: existingFollow } = await supabaseAdmin
      .from('sentiment_follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle()

    if (existingFollow) {
      // Unfollow
      await supabaseAdmin.from('sentiment_follows').delete().eq('id', existingFollow.id)
      return NextResponse.json({ status: 'unfollowed' })
    } else {
      // Follow
      await supabaseAdmin.from('sentiment_follows').insert({
        follower_id: currentUserId,
        following_id: targetUserId
      })

      // Send notification
      await supabaseAdmin.from('sentiment_notifications').insert({
        sender_id: currentUserId,
        receiver_id: targetUserId,
        type: 'follow',
        message: 'começou a seguir o seu jardim!',
        is_read: false
      })

      return NextResponse.json({ status: 'followed' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
