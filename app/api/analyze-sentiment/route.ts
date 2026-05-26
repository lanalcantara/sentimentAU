import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini SDK. Fail gracefully if missing key in dev, but it should be there.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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

    // 2. Parse request payload
    const { content, energyLevel, comfortLevel } = await req.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'O relato do diário é obrigatório e deve ser um texto.' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada no servidor.')
    }

    // 3. Connect to Gemini Model (gemini-2.5-flash for fast text tasks)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const systemInstruction = `
Você é um assistente estrito de análise de sentimentos para indivíduos neurodivergentes. 
Sua tarefa é agir EXCLUSIVAMENTE como um classificador JSON.
Leia o texto do usuário. Ignore saudações comuns (ex: 'bom dia', 'olá', 'boa tarde') ao determinar o sentimento.
Analise o CONTEXTO GERAL da frase. Uma pessoa pode dizer "bom dia" e logo depois relatar uma sobrecarga intensa. O que importa é a emoção real.

Retorne APENAS um objeto JSON válido, sem markdown, sem explicações em texto livre. O JSON deve ter as seguintes chaves e restrições:
- "sentiment": apenas "positive", "neutral" ou "negative".
- "riskLevel": apenas "low", "moderate" ou "high".
- "emotion": palavra descritiva em português (ex: "feliz", "focado", "sobrecarregado", "triste", "calmo").
- "riskIndicators": array de strings curtas indicando gatilhos sensoriais ou emocionais (ex: ["barulho", "luz forte"]). Se não houver, retorne array vazio [].
- "suggestions": array de no máximo 2 strings curtas com dicas gentis para autorregulação. (ex: ["Que tal ouvir um som de chuva?", "Beba um copo de água."]).
`

    const prompt = `
Contexto do Usuário:
- Nível de Energia (1-5): ${energyLevel}
- Nível de Conforto Sensorial (1-5): ${comfortLevel}
- Texto do Diário: "${content}"

Analise o texto e gere o JSON conforme as instruções.
`

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemInstruction + '\n\n' + prompt }] }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Low temperature for deterministic classification
      }
    })

    const responseText = result.response.text()
    const analysis = JSON.parse(responseText)

    return NextResponse.json({ analysis })
  } catch (error: any) {
    console.error('[API/Analyze-Sentiment] Gemini API error:', error)
    return NextResponse.json(
      { error: error.message || 'Falha ao efetuar a análise via inteligência artificial.' },
      { status: 500 }
    )
  }
}
