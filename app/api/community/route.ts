import { NextResponse } from 'next/server'
import { DiaryService } from '@/lib/services/diary-service'

/**
 * Gets the daily emotion feed of other users
 */
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
    const feed = await DiaryService.getCommunityFeed(userId)

    return NextResponse.json({ feed })
  } catch (error: any) {
    console.error('[API/Community/GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar feed da comunidade.' },
      { status: 500 }
    )
  }
}
