import { generateText, Output } from 'ai'
import { z } from 'zod'

// Schema for sentiment analysis response
const sentimentAnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']).describe('Overall sentiment of the diary entry'),
  confidence: z.number().min(0).max(1).describe('Confidence score of the sentiment classification'),
  emotions: z.array(z.enum([
    'happy', 'calm', 'excited', 'anxious', 'sad', 'frustrated', 'overwhelmed', 'tired', 'confused', 'content'
  ])).min(1).max(5).describe('Detected emotions in the text (max 5)'),
  keywords: z.object({
    positive: z.array(z.string()).describe('Positive words and phrases detected'),
    negative: z.array(z.string()).describe('Negative or concerning words and phrases detected'),
  }),
  suggestedSensoryTags: z.array(z.enum([
    'loud-noise', 'bright-light', 'crowded-space', 'texture-discomfort', 
    'temperature-change', 'routine-change', 'social-interaction', 
    'unexpected-event', 'smell-sensitivity', 'taste-sensitivity', 
    'physical-touch', 'visual-clutter'
  ])).describe('Suggested sensory triggers based on the text content'),
  riskLevel: z.enum(['low', 'moderate', 'high']).describe('Risk level for potential meltdown or crisis'),
  riskIndicators: z.array(z.string()).describe('Specific indicators that contributed to the risk assessment'),
  suggestions: z.array(z.string()).min(1).max(3).describe('Personalized suggestions for the user (1-3 suggestions)'),
})

export type SentimentAnalysisResponse = z.infer<typeof sentimentAnalysisSchema>

export async function POST(req: Request) {
  try {
    const { content, energyLevel, comfortLevel } = await req.json()

    if (!content || typeof content !== 'string') {
      return Response.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      )
    }

    const systemPrompt = `Você é um especialista em análise de sentimentos para indivíduos no espectro autista. 
Sua tarefa é analisar relatos de diário emocional, identificando:

1. SENTIMENTO GERAL: Classifique como positivo, neutro ou negativo
2. EMOÇÕES: Identifique as emoções presentes (máximo 5)
3. PALAVRAS-CHAVE: Extraia palavras positivas e negativas importantes
4. GATILHOS SENSORIAIS: Identifique menções a sobrecarga sensorial como:
   - Ruídos altos, luzes fortes, espaços lotados
   - Desconforto com texturas, mudanças de temperatura
   - Mudanças de rotina, eventos inesperados
   - Interações sociais difíceis
   - Sensibilidades a cheiros, gostos ou toque físico
5. RISCO DE CRISE (MELTDOWN): Avalie o risco baseado em:
   - Sobrecarga sensorial múltipla = risco elevado
   - Mudanças de rotina não planeadas = risco moderado a elevado
   - Sentimentos persistentes de frustração ou ansiedade = risco moderado
   - Dia calmo sem gatilhos = risco baixo
6. SUGESTÕES: Forneça 1-3 sugestões personalizadas e práticas

IMPORTANTE:
- Use português de Portugal
- Seja empático e não julgador
- Considere a literalidade comum no autismo
- Priorize a detecção de padrões que possam indicar crise iminente
- As sugestões devem ser práticas e realizáveis`

    const userPrompt = `Analise o seguinte relato de diário emocional:

RELATO: "${content}"

CONTEXTO ADICIONAL:
- Nível de energia reportado: ${energyLevel}/5
- Nível de conforto reportado: ${comfortLevel}/5

Por favor, forneça uma análise completa de sentimento, emoções, gatilhos sensoriais, nível de risco e sugestões personalizadas.`

    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({
        schema: sentimentAnalysisSchema,
      }),
      system: systemPrompt,
      prompt: userPrompt,
    })

    return Response.json({ analysis: output })
  } catch (error) {
    console.error('[v0] Sentiment analysis error:', error)
    return Response.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    )
  }
}
