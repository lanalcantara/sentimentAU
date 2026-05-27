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

    // 3. Connect to Gemini Model using system_instruction for best practice
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
      systemInstruction: `Você é um classificador de sentimentos especializado em comunicação neurodivergente e autista.
Sua ÚNICA função é retornar um objeto JSON válido com a classificação emocional do texto.

REGRAS OBRIGATÓRIAS:
1. Ignore COMPLETAMENTE saudações isoladas ("bom dia", "boa tarde", "olá", "oi", "tudo bem?") — elas não têm peso emocional.
2. Preste MÁXIMA atenção a negações: "não gostei", "não foi bom", "não curti", "não me senti bem" = sentimento negativo.
3. Analise o CONTEXTO COMPLETO da frase. O sentimento dominante é o que prevalece ao final.
4. Se a pessoa menciona barulho, luz forte, multidão, textura ou mudança de rotina como incômodo = gatilho sensorial.
5. Se houver conflito entre palavras positivas e negativas, o contexto e a negação têm prioridade absoluta.
6. NÃO inclua markdown, blocos de código, explicações ou qualquer texto fora do JSON.

FORMATO OBRIGATÓRIO DE RESPOSTA (apenas este JSON, nada mais):
{
  "sentiment": "positive" | "neutral" | "negative",
  "riskLevel": "low" | "moderate" | "high",
  "emotion": "string em português (ex: feliz, frustrado, sobrecarregado, calmo, ansioso)",
  "emotions": ["até 3 emoções em inglês: happy, calm, excited, content, sad, anxious, frustrated, overwhelmed, tired, confused"],
  "confidence": 0.0 a 1.0,
  "riskIndicators": ["lista de gatilhos sensoriais ou emocionais encontrados, ou array vazio []"],
  "suggestions": ["até 2 dicas gentis de autorregulação em português"]
}`
    })

    const prompt = `Analise o seguinte relato de diário emocional e classifique o sentimento:

DADOS DO USUÁRIO:
- Nível de Energia (1=muito baixo, 5=muito alto): ${energyLevel}
- Nível de Conforto Sensorial (1=muito desconfortável, 5=muito confortável): ${comfortLevel}
- Texto do Diário: "${content}"

Retorne APENAS o JSON conforme o formato definido.`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Very low for maximum determinism in classification
        maxOutputTokens: 512,
      }
    })

    const responseText = result.response.text()

    // Parse and validate the JSON response
    let analysis: any
    try {
      analysis = JSON.parse(responseText)
    } catch {
      // If JSON parsing fails, throw to trigger a useful error message
      console.error('[API/Analyze-Sentiment] Gemini returned invalid JSON:', responseText)
      throw new Error('A IA retornou uma resposta inesperada. Usando análise local.')
    }

    // Validate required fields
    if (!analysis.sentiment || !['positive', 'neutral', 'negative'].includes(analysis.sentiment)) {
      throw new Error('Resposta da IA com formato inválido.')
    }

    // Normalize to the full SentimentAnalysis shape expected by the app
    const normalizedAnalysis = {
      sentiment: analysis.sentiment,
      confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.85,
      emotions: Array.isArray(analysis.emotions) ? analysis.emotions : [analysis.emotion || 'neutral'],
      keywords: { positive: [], negative: [] },
      suggestedSensoryTags: [],
      riskLevel: analysis.riskLevel || 'low',
      riskIndicators: Array.isArray(analysis.riskIndicators) ? analysis.riskIndicators : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
    }

    return NextResponse.json({ analysis: normalizedAnalysis })
  } catch (error: any) {
    console.error('[API/Analyze-Sentiment] Gemini API error:', error)
    return NextResponse.json(
      { error: error.message || 'Falha ao efetuar a análise via inteligência artificial.' },
      { status: 500 }
    )
  }
}
