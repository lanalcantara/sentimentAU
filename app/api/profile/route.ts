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
      .select('id, username, avatar_url')
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
    const { avatarUrl } = await req.json()

    const { error } = await supabaseAdmin
      .from('sentiment_users')
      .update({ avatar_url: avatarUrl })
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
