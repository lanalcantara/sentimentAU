import type { SentimentAnalysis, Emotion, SensoryTag } from '../types'

export const LocalAnalyzer = {
  /**
   * Deterministically analyzes an autistic emotional diary entry using local
   * keyword mappings, weighted scoring, and sensory trigger extraction.
   */
  analyzeDiaryEntry(params: {
    content: string
    energyLevel: number
    comfortLevel: number
  }): SentimentAnalysis {
    const content = params.content
    const contentLower = content.toLowerCase()
    
    // 1. Comprehensive Portuguese Emotion Lexicon (90+ Keywords/Phrases)
    const emotionKeywords: Record<Emotion, string[]> = {
      happy: [
        'feliz', 'alegr', 'content', 'ótim', 'maravilh', 'excelent', 'legal',
        'bom', 'boa', 'bem', 'gost', 'ador', 'sorri', 'incri', 'espetacul',
        'sucess', 'conseg', 'ganh', 'obrigad', 'grat', 'positi', 'favorit', 'lind'
      ],
      calm: [
        'calm', 'tranquil', 'seren', 'relax', 'suav', 'harmon', 'paz', 'descans',
        'silenc', 'lent', 'lev', 'segur', 'confort', 'estav'
      ],
      excited: [
        'animad', 'entusiasm', 'eufor', 'agit', 'celebr', 'fest', 'brinc',
        'jog', 'pul', 'grit', 'show'
      ],
      content: [
        'satisfe', 'agrad', 'aceit', 'ok', 'normal', 'rotin'
      ],
      sad: [
        'trist', 'chor', 'sozinh', 'isol', 'machuc', 'dor', 'cai', 'melanc',
        'abandon', 'pena', 'infeli', 'saudad', 'perd', 'falh', 'ruim', 'pessim', 'sofr'
      ],
      anxious: [
        'ansio', 'medo', 'assust', 'preocup', 'nervo', 'panic', 'afli',
        'recei', 'tenso', 'tensa', 'tensão', 'angust', 'inquiet', 'trem', 'insegur'
      ],
      frustrated: [
        'frustr', 'raiv', 'odio', 'irrit', 'brav', 'chate', 'injust',
        'fart', 'estrag', 'quebr', 'ruid', 'barulh'
      ],
      overwhelmed: [
        'sobrecarreg', 'cris', 'desesp', 'exces', 'estres', 'press', 'sufoc',
        'colaps', 'melt', 'shut', 'socorr', 'impossiv', 'explod', 'fug'
      ],
      tired: [
        'cans', 'esgot', 'sono', 'fatig', 'exaust', 'frac', 'desgast', 'dorm', 'pesad'
      ],
      confused: [
        'confus', 'duvida', 'perd', 'desorient', 'estranh', 'complic'
      ]
    }

    // 2. High-Precision Keyword Scoring
    const emotionScores: Record<Emotion, number> = {
      happy: 0, calm: 0, excited: 0, content: 0, sad: 0,
      anxious: 0, frustrated: 0, overwhelmed: 0, tired: 0, confused: 0
    }
    let totalMatches = 0
    
    // Ignore common greetings so they don't skew the sentiment (e.g. "Bom dia" -> "Bom" -> Happy)
    const strippedContent = content
      .replace(/\bbom dia\b/gi, '')
      .replace(/\bboa tarde\b/gi, '')
      .replace(/\bboa noite\b/gi, '')
      .replace(/\bolá\b/gi, '')
      .replace(/\boi\b/gi, '')

    for (const [emotion, keywords] of Object.entries(emotionKeywords) as [Emotion, string[]][]) {
      for (const keyword of keywords) {
        // Match base form or derivative
        const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi')
        const matches = strippedContent.match(regex)
        if (matches) {
          // Weighted scoring: critical emotions receive higher priority weights
          let weight = 1
          if (emotion === 'overwhelmed' || emotion === 'frustrated') weight = 1.5
          if (emotion === 'sad' || emotion === 'anxious') weight = 1.2

          emotionScores[emotion] += matches.length * weight
          totalMatches += matches.length
        }
      }
    }

    // Emoji Sentiments Map for alternative communication support
    const emojiMap: Record<Emotion, string[]> = {
      happy: ['🙂', '😊', '😀', '😁', '😆', '😍', '🥰', '💖', '❤️', '🎉', '☀️', '✨', '🌸', '🦋', '🌈', '🥳', '👍', '👏', '🐱', '🐶', '🧸', '🎨', '🍕', '🍰'],
      calm: ['🧘', '🎧', '☕', '🥤', '🍃', '☁️', '💨', '🏡', '🏢'],
      excited: ['🎉', '🥳', '🏃', '🧗', '💥', '🚀', '🔥'],
      content: ['😐', '😑', '😶', '💬', '📝', '📅', '⏰', '🦖'],
      sad: ['😭', '😢', '😞', '☹️', '🙁', '💔', '🥀', '📉'],
      anxious: ['🥺', '😰', '😨', '😱', '😖', '🌧️', '⛈️', '🌩️', '🌪️'],
      frustrated: ['😠', '😡', '🤬', '👎', '😤'],
      overwhelmed: ['💥', '🚨', '🆘', '🤯', '🤢', '🤮', '💀'],
      tired: ['😴', '🛌', '💤', '🥱'],
      confused: ['🤔', '❓', '❔', '🤷', '🤷‍♂️', '🤷‍♀️']
    }

    for (const [emotion, emojis] of Object.entries(emojiMap) as [Emotion, string[]][]) {
      for (const emoji of emojis) {
        let count = 0
        let pos = content.indexOf(emoji)
        while (pos !== -1) {
          count++
          pos = content.indexOf(emoji, pos + 1)
        }
        if (count > 0) {
          let weight = 1.2 // Emoji carries higher emotional weight for non-verbal representation
          if (emotion === 'overwhelmed' || emotion === 'frustrated') weight = 1.6
          if (emotion === 'sad' || emotion === 'anxious') weight = 1.4

          emotionScores[emotion] += count * weight
          totalMatches += count
        }
      }
    }

    // 3. Autistic Sensory Triggers Lexicon
    const sensoryKeywords: Record<SensoryTag, string[]> = {
      'loud-noise': ['barulho', 'ruido', 'som', 'grit', 'buzina', 'alarme', 'estrepitoso', 'alto', 'aspirador', 'choro', 'fogos'],
      'bright-light': ['luz', 'brilhante', 'forte', 'tela', 'sol', 'flash', 'claridade', 'lampada', 'farol', 'reflexo'],
      'crowded-space': ['multidão', 'gente', 'cheio', 'escola', 'shopping', 'ônibus', 'fila', 'aglomeração', 'supermercado'],
      'routine-change': ['rotina', 'mudança', 'surpresa', 'inesperado', 'imprevisto', 'plano alterado', 'viagem', 'atraso', 'cancelado'],
      'texture-discomfort': ['textura', 'roupa', 'etiqueta', 'comida', 'sensação na pele', 'áspero', 'apertado', 'molhado', 'areia'],
      'temperature-change': ['calor', 'frio', 'temperatura', 'ar condicionado', 'quente', 'gelado', 'abafado'],
      'social-interaction': ['conversar', 'falar com', 'olhar', 'apresentação', 'reunião', 'grupo', 'explicar', 'perguntar', 'falar em publico'],
      'unexpected-event': ['sustos', 'acidente', 'cai', 'quebrou', 'perdi', 'estragou', 'doença', 'urgente'],
      'smell-sensitivity': ['cheiro', 'odor', 'perfume', 'fumo', 'lixo', 'comida forte', 'fragrancia'],
      'taste-sensitivity': ['sabor', 'gosto', 'comida estranha', 'textura da comida', 'azedo', 'picante'],
      'physical-touch': ['tocar', 'abraço', 'aperto', 'cosquinha', 'empurrão', 'encostar'],
      'visual-clutter': ['bagunça', 'desorganizado', 'muitas coisas', 'sujo', 'espalhado', 'caos visual']
    }

    const suggestedSensoryTags: SensoryTag[] = []
    for (const [tag, keywords] of Object.entries(sensoryKeywords) as [SensoryTag, string[]][]) {
      for (const keyword of keywords) {
        if (contentLower.includes(keyword)) {
          suggestedSensoryTags.push(tag)
          break // Limit to one match per tag
        }
      }
    }

    // 4. Domination & Fallback Emotion Selection
    const sortedEmotions = (Object.entries(emotionScores) as [Emotion, number][])
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([emotion]) => emotion)

    if (sortedEmotions.length === 0) {
      // Heuristics based on energy/comfort values when no keywords match
      if (params.energyLevel >= 4 && params.comfortLevel >= 4) {
        sortedEmotions.push('happy', 'excited')
      } else if (params.energyLevel <= 2 && params.comfortLevel <= 2) {
        sortedEmotions.push('tired', 'sad')
      } else if (params.comfortLevel <= 2) {
        sortedEmotions.push('anxious', 'frustrated')
      } else {
        sortedEmotions.push('calm', 'content')
      }
    }

    // 5. Rich Multi-dimensional Sentiment Mapping
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
    const positiveEmotions: Emotion[] = ['happy', 'calm', 'excited', 'content']
    const negativeEmotions: Emotion[] = ['sad', 'anxious', 'frustrated', 'overwhelmed', 'tired']
    
    const hasPositive = sortedEmotions.some(e => positiveEmotions.includes(e))
    const hasNegative = sortedEmotions.some(e => negativeEmotions.includes(e))

    if (hasNegative && !hasPositive) {
      sentiment = 'negative'
    } else if (hasPositive && !hasNegative) {
      sentiment = 'positive'
    } else if (hasPositive && hasNegative) {
      sentiment = params.comfortLevel >= 3 ? 'positive' : 'negative'
    } else {
      sentiment = params.comfortLevel >= 4 ? 'positive' : params.comfortLevel <= 2 ? 'negative' : 'neutral'
    }

    // 6. Meltdown Risk Level Calculation
    let riskLevel: 'low' | 'moderate' | 'high' = 'low'
    if (
      sortedEmotions.includes('overwhelmed') ||
      suggestedSensoryTags.length >= 2 ||
      (params.comfortLevel <= 1 && params.energyLevel <= 2) ||
      contentLower.includes('crise') ||
      contentLower.includes('desespero')
    ) {
      riskLevel = 'high'
    } else if (
      sortedEmotions.includes('frustrated') ||
      sortedEmotions.includes('anxious') ||
      suggestedSensoryTags.length === 1 ||
      params.comfortLevel <= 2
    ) {
      riskLevel = 'moderate'
    }

    // 7. Portuguese Autistic Self-Regulation Tips
    const suggestions: string[] = []
    if (riskLevel === 'high') {
      suggestions.push(
        'Encontre um espaço tranquilo, silencioso e com luz suave para descansar.',
        'Use abafadores de ruído ou fones com a sua música favorita.',
        'Está tudo bem em fazer uma pausa e se afastar de estímulos e pessoas.'
      )
    } else if (riskLevel === 'moderate') {
      suggestions.push(
        'Pratique a respiração profunda (inspire em 4 segundos, segure por 4, expire por 4).',
        'Use objetos de autorregulação (fidget toys) ou aperte uma almofada.',
        'Se você sentir barulho ou sobrecarga visual, procure um canto calmo para se recuperar.'
      )
    } else {
      suggestions.push(
        'Excelente trabalho ao registrar as suas emoções hoje!',
        'Aproveite este dia estável para fazer um dos seus interesses especiais.',
        'Escreva ou desenhe mais sobre as coisas boas que aconteceram hoje.'
      )
    }

    // Dynamic confidence score
    const confidence = Math.min(0.95, 0.70 + (totalMatches * 0.05))

    // Extract Positive/Negative Keywords (including Emoji alternative communication)
    const positiveKeywords = content.match(/\b(bom|boa|bem|feliz|calmo|tranquilo|ótimo|alegre|gostei|gosto|adoro|incrível|sucesso|espetacular|divertido|favorito|favorita|lindo|linda|maravilhoso|maravilhosa|excelente|animado|animada|consegui)\w*\b/gi) || []
    const negativeKeywords = content.match(/\b(mal|triste|ansioso|ansiosa|frustrado|frustrada|difícil|ruim|chateado|chateada|raiva|irritado|irritada|sono|cansado|cansada|esgotado|esgotada|dor|machuc\w*|cai\w*|assusta\w*|medo|preocupado|preocupada|nervoso|nervosa|péssimo|péssima)\w*\b/gi) || []

    const foundPositiveEmojis: string[] = []
    const foundNegativeEmojis: string[] = []

    const posEmojis = ['🙂', '😊', '😀', '😁', '😆', '😍', '🥰', '💖', '❤️', '🎉', '☀️', '✨', '🌸', '🦋', '🌈', '🥳', '👍', '👏', '🐱', '🐶', '🧸', '🎨', '🍕', '🍰', '🧘', '🎧', '☕', '🥤', '🍃']
    const negEmojis = ['😭', '😢', '😞', '☹️', '🙁', '💔', '🥀', '📉', '🥺', '😰', '😨', '😱', '😖', '🌧️', '⛈️', '🌩️', '🌪️', '😠', '😡', '🤬', '👎', '😤', '💥', '🚨', '🆘', '🤯', '🤢', '🤮', '💀', '😴', '🛌', '💤', '🥱']

    for (const emoji of posEmojis) {
      if (content.includes(emoji)) {
        foundPositiveEmojis.push(emoji)
      }
    }
    for (const emoji of negEmojis) {
      if (content.includes(emoji)) {
        foundNegativeEmojis.push(emoji)
      }
    }

    return {
      sentiment,
      confidence: Number(confidence.toFixed(2)),
      emotions: sortedEmotions.slice(0, 3) as Emotion[],
      keywords: {
        positive: Array.from(new Set([...positiveKeywords.map(k => k.toLowerCase()), ...foundPositiveEmojis])),
        negative: Array.from(new Set([...negativeKeywords.map(k => k.toLowerCase()), ...foundNegativeEmojis]))
      },
      suggestedSensoryTags,
      riskLevel,
      riskIndicators: suggestedSensoryTags.length > 0 
        ? [`Identificamos ${suggestedSensoryTags.length} gatilho(s) sensorial(ais)`]
        : sortedEmotions.includes('overwhelmed') 
        ? ['Indícios de sobrecarga emocional elevada']
        : [],
      suggestions
    }
  }
}
