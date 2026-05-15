// sentimentAU - Emotional Diary for Autistic Individuals

export type Sentiment = 'positive' | 'neutral' | 'negative'

export type Emotion = 
  | 'happy' 
  | 'calm' 
  | 'excited' 
  | 'anxious' 
  | 'sad' 
  | 'frustrated' 
  | 'overwhelmed' 
  | 'tired' 
  | 'confused' 
  | 'content'

export type SensoryTag = 
  | 'loud-noise'
  | 'bright-light' 
  | 'crowded-space'
  | 'texture-discomfort'
  | 'temperature-change'
  | 'routine-change'
  | 'social-interaction'
  | 'unexpected-event'
  | 'smell-sensitivity'
  | 'taste-sensitivity'
  | 'physical-touch'
  | 'visual-clutter'

export type RiskLevel = 'low' | 'moderate' | 'high'

export interface SentimentAnalysis {
  sentiment: Sentiment
  confidence: number
  emotions: Emotion[]
  keywords: {
    positive: string[]
    negative: string[]
  }
  suggestedSensoryTags: SensoryTag[]
  riskLevel: RiskLevel
  riskIndicators: string[]
  suggestions: string[]
}

export interface DiaryEntry {
  id: string
  createdAt: Date
  updatedAt: Date
  content: string
  energyLevel: number // 1-5
  comfortLevel: number // 1-5
  sensoryTags: SensoryTag[]
  analysis: SentimentAnalysis | null
  voiceRecording?: string
  useSymbols?: boolean
}

export interface WellbeingStats {
  totalEntries: number
  averageSentiment: number
  moodTrend: 'improving' | 'stable' | 'declining'
  commonTriggers: SensoryTag[]
  weeklyMoodData: {
    date: string
    sentiment: Sentiment
    riskLevel: RiskLevel
    energyLevel?: number
  }[]
}

// Sensory tag metadata for UI
export const SENSORY_TAGS: Record<SensoryTag, { label: string; emoji: string; category: string }> = {
  'loud-noise': { label: 'Ruído Alto', emoji: '🔊', category: 'auditory' },
  'bright-light': { label: 'Luz Forte', emoji: '💡', category: 'visual' },
  'crowded-space': { label: 'Espaço Lotado', emoji: '👥', category: 'social' },
  'texture-discomfort': { label: 'Textura Desconfortável', emoji: '🧶', category: 'tactile' },
  'temperature-change': { label: 'Mudança de Temperatura', emoji: '🌡️', category: 'environmental' },
  'routine-change': { label: 'Mudança de Rotina', emoji: '📅', category: 'routine' },
  'social-interaction': { label: 'Interação Social', emoji: '💬', category: 'social' },
  'unexpected-event': { label: 'Evento Inesperado', emoji: '⚡', category: 'routine' },
  'smell-sensitivity': { label: 'Sensibilidade a Cheiros', emoji: '👃', category: 'olfactory' },
  'taste-sensitivity': { label: 'Sensibilidade ao Gosto', emoji: '👅', category: 'gustatory' },
  'physical-touch': { label: 'Toque Físico', emoji: '✋', category: 'tactile' },
  'visual-clutter': { label: 'Desordem Visual', emoji: '🎨', category: 'visual' },
}

export const EMOTIONS: Record<Emotion, { label: string; emoji: string; color: string }> = {
  'happy': { label: 'Feliz', emoji: '😊', color: 'bg-yellow-100 text-yellow-800' },
  'calm': { label: 'Calmo', emoji: '😌', color: 'bg-green-100 text-green-800' },
  'excited': { label: 'Animado', emoji: '🤩', color: 'bg-orange-100 text-orange-800' },
  'anxious': { label: 'Ansioso', emoji: '😰', color: 'bg-purple-100 text-purple-800' },
  'sad': { label: 'Triste', emoji: '😢', color: 'bg-blue-100 text-blue-800' },
  'frustrated': { label: 'Frustrado', emoji: '😤', color: 'bg-red-100 text-red-800' },
  'overwhelmed': { label: 'Sobrecarregado', emoji: '😵', color: 'bg-pink-100 text-pink-800' },
  'tired': { label: 'Cansado', emoji: '😴', color: 'bg-gray-100 text-gray-800' },
  'confused': { label: 'Confuso', emoji: '😕', color: 'bg-indigo-100 text-indigo-800' },
  'content': { label: 'Contente', emoji: '🙂', color: 'bg-teal-100 text-teal-800' },
}
