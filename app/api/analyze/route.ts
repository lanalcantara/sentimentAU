import { NextResponse } from 'next/server'
import { LocalAnalyzer } from '@/lib/services/local-analyzer'

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from session cookie
    const cookieHeader = req.headers.get('cookie') || ''
    const userIdCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('session_user_id='))

    if (!userIdCookie) {
      return NextResponse.json(
        { error: 'Sessão não autorizada. Por favor, faça login.' },
        { status: 401 }
      )
    }

    const userId = userIdCookie.split('=')[1].trim()

    // 2. Parse request payload
    const { content, energyLevel, comfortLevel } = await req.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'O relato do diário é obrigatório e deve ser um texto.' },
        { status: 400 }
      )
    }

    // 3. Perform high-performance local deterministic macro-analysis
    const analysis = LocalAnalyzer.analyzeDiaryEntry({
      content,
      energyLevel: Number(energyLevel) || 3,
      comfortLevel: Number(comfortLevel) || 3,
    })

    return NextResponse.json({ analysis })
  } catch (error: any) {
    console.error('[API/Analyze] Macro analysis critical error:', error)
    return NextResponse.json(
      { error: error.message || 'Falha ao efetuar a análise emocional local.' },
      { status: 500 }
    )
  }
}
