import type { SentimentAnalysis } from '../types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash-lite' // High performance, extremely fast, robust structured JSON support

export const GeminiService = {
  /**
   * Analyzes an autistic emotional diary entry using Gemini REST API
   * and returns the structured JSON analysis alongside the exact tokens consumed.
   */
  async analyzeDiaryEntry(params: {
    content: string
    energyLevel: number
    comfortLevel: number
  }): Promise<{ analysis: SentimentAnalysis; tokensConsumed: number }> {
    if (!GEMINI_API_KEY) {
      throw new Error('Chave de API do Gemini (GEMINI_API_KEY) está em falta.')
    }

    const systemPrompt = `Você é um especialista em análise de sentimentos para indivíduos no espectro autista. 
Sua tarefa é analisar relatos de diário emocional, identificando:

1. SENTIMENTO GERAL: Classifique como "positive", "neutral" ou "negative"
2. EMOÇÕES: Identifique as emoções presentes (máximo 5) de entre estas opções exatas: "happy", "calm", "excited", "anxious", "sad", "frustrated", "overwhelmed", "tired", "confused", "content"
3. PALAVRAS-CHAVE: Extraia palavras positivas e negativas importantes no texto
4. GATILHOS SENSORIAIS: Identifique menções a sobrecarga sensorial de entre estas opções exatas: "loud-noise", "bright-light", "crowded-space", "texture-discomfort", "temperature-change", "routine-change", "social-interaction", "unexpected-event", "smell-sensitivity", "taste-sensitivity", "physical-touch", "visual-clutter"
5. RISCO DE CRISE (MELTDOWN): Avalie o risco de meltdown como "low", "moderate" ou "high" baseado em:
   - Sobrecarga sensorial múltipla = risco high
   - Mudanças de rotina não planeadas = risco moderate a high
   - Sentimentos persistentes de frustração ou ansiedade = risco moderate
   - Dia calmo sem gatilhos = risco low
6. SUGESTÕES: Forneça 1 a 3 sugestões personalizadas, práticas e realizáveis para o utilizador se autorregular.

IMPORTANTE:
- Use português de Portugal
- Seja empático e não julgador
- Considere a literalidade comum no autismo
- Priorize a detecção de padrões que possam indicar crise iminente
- Retorne apenas o JSON no formato exigido pela estrutura.`

    const userPrompt = `Analise o seguinte relato de diário emocional:

RELATO: "${params.content}"

CONTEXTO ADICIONAL:
- Nível de energia reportado: ${params.energyLevel}/5
- Nível de conforto reportado: ${params.comfortLevel}/5

Por favor, forneça uma análise completa de sentimento, emoções, gatilhos sensoriais, nível de risco e sugestões personalizadas.`

    // Gemini REST payload structure with Schema validation enforce
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\n---\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            sentiment: {
              type: 'STRING',
              enum: ['positive', 'neutral', 'negative'],
            },
            confidence: {
              type: 'NUMBER',
            },
            emotions: {
              type: 'ARRAY',
              items: {
                type: 'STRING',
                enum: [
                  'happy',
                  'calm',
                  'excited',
                  'anxious',
                  'sad',
                  'frustrated',
                  'overwhelmed',
                  'tired',
                  'confused',
                  'content',
                ],
              },
            },
            keywords: {
              type: 'OBJECT',
              properties: {
                positive: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                },
                negative: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                },
              },
              required: ['positive', 'negative'],
            },
            suggestedSensoryTags: {
              type: 'ARRAY',
              items: {
                type: 'STRING',
                enum: [
                  'loud-noise',
                  'bright-light',
                  'crowded-space',
                  'texture-discomfort',
                  'temperature-change',
                  'routine-change',
                  'social-interaction',
                  'unexpected-event',
                  'smell-sensitivity',
                  'taste-sensitivity',
                  'physical-touch',
                  'visual-clutter',
                ],
              },
            },
            riskLevel: {
              type: 'STRING',
              enum: ['low', 'moderate', 'high'],
            },
            riskIndicators: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            suggestions: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
          required: [
            'sentiment',
            'confidence',
            'emotions',
            'keywords',
            'suggestedSensoryTags',
            'riskLevel',
            'riskIndicators',
            'suggestions',
          ],
        },
      },
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GeminiService] REST API error response:', errorText)
      throw new Error(`Erro na API do Gemini: ${response.statusText}`)
    }

    const responseJson = await response.json()
    
    // Extract structured JSON text
    const textOutput = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textOutput) {
      throw new Error('A resposta do Gemini veio vazia ou em formato incorreto.')
    }

    const parsedAnalysis: SentimentAnalysis = JSON.parse(textOutput)
    
    // Exact token count provided by Gemini API
    const tokensConsumed = responseJson?.usageMetadata?.totalTokenCount || 0

    return {
      analysis: parsedAnalysis,
      tokensConsumed,
    }
  },
}
