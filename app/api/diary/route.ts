import { NextResponse } from 'next/server'
import { DiaryService } from '@/lib/services/diary-service'

/**
 * Gets all diary entries for the logged-in user
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
    const entries = await DiaryService.getEntries(userId)

    return NextResponse.json({ entries })
  } catch (error: any) {
    console.error('[API/Diary/GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar registros.' },
      { status: 500 }
    )
  }
}

/**
 * Saves a new analyzed diary entry
 */
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
    const entryData = await req.json()

    if (!entryData.content || !entryData.analysis) {
      return NextResponse.json(
        { error: 'Dados do diário incompletos para gravação.' },
        { status: 400 }
      )
    }

    const result = await DiaryService.createEntry(userId, entryData)

    return NextResponse.json({ success: true, entry: result })
  } catch (error: any) {
    console.error('[API/Diary/POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar registro no diário.' },
      { status: 500 }
    )
  }
}
