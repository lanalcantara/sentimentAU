import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const userIdCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('session_user_id='))

    if (!userIdCookie) {
      return NextResponse.json({ error: 'Sessão não autorizada.' }, { status: 401 })
    }

    const userId = userIdCookie.split('=')[1].trim()

    const { data, error } = await supabaseAdmin
      .from('sentiment_users')
      .select('id, username, avatar_url, flor_avatar_atual, flores_desbloqueadas')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    return NextResponse.json({ user: data })
  } catch (error: any) {
    console.error('[API/Profile/GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar perfil.' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const userIdCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('session_user_id='))

    if (!userIdCookie) {
      return NextResponse.json({ error: 'Sessão não autorizada.' }, { status: 401 })
    }

    const userId = userIdCookie.split('=')[1].trim()
    const { avatarUrl, flor_avatar_atual } = await req.json()

    const updateData: any = {}
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl
    if (flor_avatar_atual !== undefined) updateData.flor_avatar_atual = flor_avatar_atual

    const { error } = await supabaseAdmin
      .from('sentiment_users')
      .update(updateData)
      .eq('id', userId)

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, avatarUrl })
  } catch (error: any) {
    console.error('[API/Profile/POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar avatar.' },
      { status: 500 }
    )
  }
}
