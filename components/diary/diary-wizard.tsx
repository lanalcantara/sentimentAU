'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RobotBuddy } from '@/components/characters/robot-buddy'
import { WeatherMood } from '@/components/characters/weather-mood'
import { SensoryTagSelector } from './sensory-tag-selector'
import { EnergySlider } from './energy-slider'
import type { SensoryTag, SentimentAnalysis, Emotion } from '@/lib/types'
import { EMOTIONS } from '@/lib/types'
import { 
  Mic, 
  Shapes, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Loader2,
  AlertTriangle,
  Lightbulb
} from 'lucide-react'

interface DiaryWizardProps {
  onComplete: (data: {
    content: string
    energyLevel: number
    comfortLevel: number
    sensoryTags: SensoryTag[]
    analysis: SentimentAnalysis
  }) => void
}

type WizardStep = 1 | 2 | 3 | 4

const stepConfig = {
  1: {
    title: 'O Meu Diário',
    subtitle: 'Conta-me como foi o teu dia',
    bgClass: 'bg-step-diary',
    textClass: 'text-step-diary-foreground',
  },
  2: {
    title: 'Análise IA',
    subtitle: 'A analisar o teu registo...',
    bgClass: 'bg-step-analysis',
    textClass: 'text-step-analysis-foreground',
  },
  3: {
    title: 'Caça ao Tesouro Sensorial',
    subtitle: 'Que sentidos foram afetados hoje?',
    bgClass: 'bg-step-sensory',
    textClass: 'text-step-sensory-foreground',
  },
  4: {
    title: 'Guardar Registo',
    subtitle: 'Revê e guarda o teu dia',
    bgClass: 'bg-step-save',
    textClass: 'text-step-save-foreground',
  },
}

export function DiaryWizard({ onComplete }: DiaryWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const [content, setContent] = useState('')
  const [energyLevel, setEnergyLevel] = useState(3)
  const [comfortLevel, setComfortLevel] = useState(3)
  const [sensoryTags, setSensoryTags] = useState<SensoryTag[]>([])
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const currentConfig = stepConfig[step]

  const handleAnalyze = async () => {
    if (!content.trim()) return
    
    setIsAnalyzing(true)
    setStep(2)
    
    try {
      // Call real AI sentiment analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          energyLevel,
          comfortLevel,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze')
      }

      const { analysis: aiAnalysis } = await response.json()
      setAnalysis(aiAnalysis)
    } catch (error) {
      console.error('[v0] Analysis failed, using fallback:', error)
      
      // Fallback to simple rule-based analysis if API fails
      const fallbackAnalysis: SentimentAnalysis = {
        sentiment: content.toLowerCase().includes('bom') || content.toLowerCase().includes('feliz') 
          ? 'positive' 
          : content.toLowerCase().includes('mal') || content.toLowerCase().includes('triste')
          ? 'negative'
          : 'neutral',
        confidence: 0.7,
        emotions: ['calm', 'content'] as Emotion[],
        keywords: {
          positive: content.match(/\b(bom|feliz|calmo|tranquilo|bem)\b/gi) || [],
          negative: content.match(/\b(mal|triste|ansioso|frustrado|difícil)\b/gi) || [],
        },
        suggestedSensoryTags: [] as SensoryTag[],
        riskLevel: 'low',
        riskIndicators: [],
        suggestions: ['Continue a registar os seus dias para identificar padrões.'],
      }
      
      // Detect sensory keywords
      if (content.toLowerCase().includes('barulho') || content.toLowerCase().includes('ruído')) {
        fallbackAnalysis.suggestedSensoryTags.push('loud-noise')
      }
      if (content.toLowerCase().includes('luz') || content.toLowerCase().includes('brilhante')) {
        fallbackAnalysis.suggestedSensoryTags.push('bright-light')
      }
      if (content.toLowerCase().includes('cheio') || content.toLowerCase().includes('lotado')) {
        fallbackAnalysis.suggestedSensoryTags.push('crowded-space')
      }
      if (content.toLowerCase().includes('rotina') || content.toLowerCase().includes('mudança')) {
        fallbackAnalysis.suggestedSensoryTags.push('routine-change')
      }
      
      setAnalysis(fallbackAnalysis)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleComplete = () => {
    if (!analysis) return
    onComplete({
      content,
      energyLevel,
      comfortLevel,
      sensoryTags,
      analysis,
    })
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <RobotBuddy 
        mood="encouraging" 
        message="Olá! Como te sentes hoje? Escreve o que quiseres, eu estou aqui para ajudar."
      />
      
      <div className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Hoje aconteceu..."
          className="min-h-[160px] text-lg bg-card/80 border-2 border-border/50 rounded-2xl resize-none focus:border-primary"
        />
        
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2 rounded-xl h-12">
            <Mic className="w-4 h-4" />
            Gravar Voz
          </Button>
          <Button variant="outline" className="flex-1 gap-2 rounded-xl h-12">
            <Shapes className="w-4 h-4" />
            Usar Símbolos
          </Button>
        </div>
      </div>

      <div className="space-y-6 bg-card/50 rounded-2xl p-6">
        <EnergySlider
          value={energyLevel}
          onChange={setEnergyLevel}
          label="Nível de Energia"
          lowLabel="Muito baixa"
          highLabel="Muito alta"
        />
        <EnergySlider
          value={comfortLevel}
          onChange={setComfortLevel}
          label="Nível de Conforto"
          lowLabel="Desconfortável"
          highLabel="Muito confortável"
        />
      </div>

      <Button 
        onClick={handleAnalyze}
        disabled={!content.trim()}
        className="w-full h-14 text-lg rounded-2xl gap-2"
      >
        <Sparkles className="w-5 h-5" />
        Analisar com IA
      </Button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg font-medium">A analisar o teu registo...</p>
          <p className="text-sm text-muted-foreground">Isto pode demorar alguns segundos</p>
        </div>
      ) : analysis && (
        <>
          <div className="flex items-center justify-center">
            <WeatherMood sentiment={analysis.sentiment} size="lg" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">
              {analysis.sentiment === 'positive' && 'Dia Positivo!'}
              {analysis.sentiment === 'neutral' && 'Dia Neutro'}
              {analysis.sentiment === 'negative' && 'Dia Difícil'}
            </h3>
            <p className="text-muted-foreground">
              Confiança: {Math.round(analysis.confidence * 100)}%
            </p>
          </div>

          <div className="bg-card/80 rounded-2xl p-4 space-y-3">
            <p className="text-sm leading-relaxed">
              {content.split(' ').map((word, i) => {
                const isPositive = analysis.keywords.positive.some(k => 
                  word.toLowerCase().includes(k.toLowerCase())
                )
                const isNegative = analysis.keywords.negative.some(k => 
                  word.toLowerCase().includes(k.toLowerCase())
                )
                return (
                  <span
                    key={i}
                    className={cn(
                      isPositive && 'bg-yellow-200 text-yellow-900 px-1 rounded',
                      isNegative && 'bg-blue-200 text-blue-900 px-1 rounded'
                    )}
                  >
                    {word}{' '}
                  </span>
                )
              })}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Emoções detetadas:</p>
            <div className="flex flex-wrap gap-2">
              {analysis.emotions.map((emotion) => (
                <span
                  key={emotion}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    EMOTIONS[emotion].color
                  )}
                >
                  {EMOTIONS[emotion].emoji} {EMOTIONS[emotion].label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setStep(1)}
              className="flex-1 h-12 rounded-xl gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button 
              onClick={() => setStep(3)}
              className="flex-1 h-12 rounded-xl gap-2"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-lg">
          Seleciona os gatilhos sensoriais que sentiste hoje
        </p>
        {analysis?.suggestedSensoryTags && analysis.suggestedSensoryTags.length > 0 && (
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4" />
            Sugestões da IA destacadas
          </p>
        )}
      </div>

      <SensoryTagSelector
        selected={sensoryTags}
        onChange={setSensoryTags}
        suggested={analysis?.suggestedSensoryTags}
      />

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setStep(2)}
          className="flex-1 h-12 rounded-xl gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button 
          onClick={() => setStep(4)}
          className="flex-1 h-12 rounded-xl gap-2"
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      {analysis && (
        <>
          <div className="bg-card/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <WeatherMood sentiment={analysis.sentiment} size="sm" />
              <div>
                <h3 className="font-semibold">
                  {analysis.sentiment === 'positive' && 'Dia Positivo'}
                  {analysis.sentiment === 'neutral' && 'Dia Neutro'}
                  {analysis.sentiment === 'negative' && 'Dia Difícil'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Energia: {energyLevel}/5 • Conforto: {comfortLevel}/5
                </p>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed line-clamp-3">{content}</p>
            
            {sensoryTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sensoryTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-muted rounded-lg text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {analysis.riskLevel !== 'low' && (
            <div className={cn(
              'rounded-2xl p-4 flex items-start gap-3',
              analysis.riskLevel === 'high' ? 'bg-destructive/10' : 'bg-yellow-100'
            )}>
              <AlertTriangle className={cn(
                'w-5 h-5 mt-0.5',
                analysis.riskLevel === 'high' ? 'text-destructive' : 'text-yellow-600'
              )} />
              <div>
                <p className="font-medium text-sm">
                  {analysis.riskLevel === 'high' ? 'Risco Elevado' : 'Risco Moderado'}
                </p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  {analysis.riskIndicators.map((indicator, i) => (
                    <li key={i}>• {indicator}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {analysis.suggestions.length > 0 && (
            <div className="bg-accent/20 rounded-2xl p-4 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 mt-0.5 text-accent-foreground" />
              <div>
                <p className="font-medium text-sm">Sugestões</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  {analysis.suggestions.map((suggestion, i) => (
                    <li key={i}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setStep(3)}
              className="flex-1 h-12 rounded-xl gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button 
              onClick={handleComplete}
              className="flex-1 h-12 rounded-xl gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Check className="w-4 h-4" />
              Guardar Registo
            </Button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className={cn('min-h-screen transition-colors duration-500', currentConfig.bgClass)}>
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {([1, 2, 3, 4] as WizardStep[]).map((s) => (
            <div
              key={s}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-300',
                s === step 
                  ? 'w-8 bg-foreground' 
                  : s < step 
                  ? 'bg-foreground/60' 
                  : 'bg-foreground/20'
              )}
            />
          ))}
        </div>

        {/* Header */}
        <div className={cn('text-center mb-8', currentConfig.textClass)}>
          <h1 className="text-2xl font-bold">{currentConfig.title}</h1>
          <p className="text-sm opacity-80">{currentConfig.subtitle}</p>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={currentConfig.textClass}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
