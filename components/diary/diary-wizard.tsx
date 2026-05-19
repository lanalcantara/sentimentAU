'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RobotBuddy } from '@/components/characters/robot-buddy'
import { WeatherMood } from '@/components/characters/weather-mood'
import { SensoryTagSelector } from './sensory-tag-selector'
import { EnergySlider } from './energy-slider'
import { useCalmMode } from '@/lib/context/calm-mode-context'
import type { SensoryTag, SentimentAnalysis, Emotion } from '@/lib/types'
import { EMOTIONS } from '@/lib/types'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import { LocalAnalyzer } from '@/lib/services/local-analyzer'
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Loader2,
  AlertTriangle,
  Lightbulb,
  XCircle
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
    title: 'Meu Diário',
    subtitle: 'Conte-me como foi o seu dia',
    bgClass: 'bg-background',
    textClass: 'text-foreground',
  },
  2: {
    title: 'Análise Inteligente',
    subtitle: 'Analisando suas emoções...',
    bgClass: 'bg-background',
    textClass: 'text-foreground',
  },
  3: {
    title: 'Caça ao Tesouro Sensorial',
    subtitle: 'Quais sentidos foram afetados hoje?',
    bgClass: 'bg-background',
    textClass: 'text-foreground',
  },
  4: {
    title: 'Salvar Registro',
    subtitle: 'Revise e salve o seu dia',
    bgClass: 'bg-background',
    textClass: 'text-foreground',
  },
}

export function DiaryWizard({ onComplete }: DiaryWizardProps) {
  const { calmMode } = useCalmMode()
  const [step, setStep] = useState<WizardStep>(1)
  const [content, setContent] = useState('')
  const [energyLevel, setEnergyLevel] = useState(3)
  const [comfortLevel, setComfortLevel] = useState(3)
  const [sensoryTags, setSensoryTags] = useState<SensoryTag[]>([])
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const currentConfig = stepConfig[step]

  const handleAnalyze = async () => {
    if (!content.trim()) return
    
    setIsAnalyzing(true)
    setAnalysisError(null)
    setStep(2)
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          energyLevel,
          comfortLevel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível efetuar a análise.')
      }

      setAnalysis(data.analysis)
    } catch (error: any) {
      console.error('[DiaryWizard] Analysis failed, using robust LocalAnalyzer fallback:', error.message)
      
      const fallbackAnalysis = LocalAnalyzer.analyzeDiaryEntry({
        content,
        energyLevel,
        comfortLevel
      })
      
      setAnalysis(fallbackAnalysis)
      setAnalysisError('Conexão instável. Usando análise local segura.')
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
        message="Olá! Como você está se sentindo hoje? Escreva livremente o que quiser, estou aqui para ler com carinho."
      />
      
      <div className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Hoje aconteceu..."
          className="min-h-[160px] text-lg bg-card/85 border-border/80 rounded-2xl resize-none focus:border-primary focus:ring-1 focus:ring-primary/40 leading-relaxed text-foreground"
        />
      </div>

      <div className="space-y-6 bg-card/50 border border-border/20 rounded-2xl p-6">
        <EnergySlider
          value={energyLevel}
          onChange={(val) => {
            SensoryAudio.play('bubble')
            setEnergyLevel(val)
          }}
          label="Nível de Energia"
          lowLabel="Muito baixa"
          highLabel="Muito alta"
        />
        <EnergySlider
          value={comfortLevel}
          onChange={(val) => {
            SensoryAudio.play('bubble')
            setComfortLevel(val)
          }}
          label="Nível de Conforto Sensorial"
          lowLabel="Desconfortável"
          highLabel="Muito confortável"
        />
      </div>

      <Button 
        onClick={() => {
          SensoryAudio.play('bubble')
          handleAnalyze()
        }}
        disabled={!content.trim()}
        className="w-full h-14 text-lg rounded-2xl gap-2 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm cursor-pointer"
      >
        <Sparkles className="w-5 h-5 shrink-0" />
        Analisar Registro
      </Button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary shrink-0" />
          <p className="text-lg font-medium text-foreground">Analisando o seu registro...</p>
          <p className="text-xs text-muted-foreground">Nossa inteligência local está identificando gatilhos e emoções com todo o cuidado.</p>
        </div>
      ) : analysisError && !analysis ? (
        <div className="space-y-6 py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6 text-red-600 shrink-0" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Pedido de Análise Interrompido</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {analysisError}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              SensoryAudio.play('bubble')
              setStep(1)
            }}
            className="rounded-xl px-6 h-12 border-border font-medium cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar e Ajustar
          </Button>
        </div>
      ) : analysis && (
        <>
          {analysisError && (
            <div className="p-3 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-800 text-xs leading-relaxed">
              💡 {analysisError}
            </div>
          )}

          <div className="flex items-center justify-center py-4">
            <WeatherMood sentiment={analysis.sentiment} size="lg" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              {analysis.sentiment === 'positive' && 'Dia Positivo! ☀️'}
              {analysis.sentiment === 'neutral' && 'Dia Calmo ☁️'}
              {analysis.sentiment === 'negative' && 'Dia Difícil 🌧️'}
            </h3>
            <p className="text-xs text-muted-foreground">
              Grau de segurança na análise: {Math.round(analysis.confidence * 100)}%
            </p>
          </div>

          <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-3 shadow-sm leading-relaxed">
            <p className="text-sm leading-relaxed text-foreground">
              {content.split(' ').map((word, i) => {
                const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
                const isPositive = analysis.keywords.positive.some(k => 
                  cleanWord.includes(k.toLowerCase()) || k.toLowerCase().includes(cleanWord)
                )
                const isNegative = analysis.keywords.negative.some(k => 
                  cleanWord.includes(k.toLowerCase()) || k.toLowerCase().includes(cleanWord)
                )
                return (
                  <span
                    key={i}
                    className={cn(
                      isPositive && 'bg-emerald-100 text-emerald-950 font-medium px-1 rounded',
                      isNegative && 'bg-rose-100 text-rose-950 font-medium px-1 rounded'
                    )}
                  >
                    {word}{' '}
                  </span>
                )
              })}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Emoções expressas:</p>
            <div className="flex flex-wrap gap-2">
              {analysis.emotions.map((emotion) => (
                <span
                  key={emotion}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-border/10',
                    EMOTIONS[emotion]?.color || 'bg-muted text-foreground'
                  )}
                >
                  {EMOTIONS[emotion]?.emoji} {EMOTIONS[emotion]?.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                SensoryAudio.play('bubble')
                setStep(1)
              }}
              className="flex-1 h-12 rounded-xl gap-2 border-border cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              Voltar
            </Button>
            <Button 
              onClick={() => {
                SensoryAudio.play('bubble')
                setSensoryTags(analysis.suggestedSensoryTags || [])
                setStep(3)
              }}
              className="flex-1 h-12 rounded-xl gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm cursor-pointer"
            >
              Continuar
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Button>
          </div>
        </>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-base text-foreground leading-relaxed">
          Quais destes fatores ou sentidos você sentiu com mais impacto hoje?
        </p>
        {analysis?.suggestedSensoryTags && analysis.suggestedSensoryTags.length > 0 && (
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Gatilhos sugeridos pela análise inteligente destacados
          </p>
        )}
      </div>

      <SensoryTagSelector
        selected={sensoryTags}
        onChange={(tags) => {
          SensoryAudio.play('bubble')
          setSensoryTags(tags)
        }}
        suggested={analysis?.suggestedSensoryTags}
      />

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => {
            SensoryAudio.play('bubble')
            setStep(2)
          }}
          className="flex-1 h-12 rounded-xl gap-2 border-border cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Voltar
        </Button>
        <Button 
          onClick={() => {
            SensoryAudio.play('bubble')
            setStep(4)
          }}
          className="flex-1 h-12 rounded-xl gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm cursor-pointer"
        >
          Continuar
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      {analysis && (
        <>
          <div className="bg-card border border-border/20 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-4">
              <WeatherMood sentiment={analysis.sentiment} size="sm" />
              <div>
                <h3 className="font-bold text-foreground">
                  {analysis.sentiment === 'positive' && 'Dia Positivo ☀️'}
                  {analysis.sentiment === 'neutral' && 'Dia Calmo ☁️'}
                  {analysis.sentiment === 'negative' && 'Dia Difícil 🌧️'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Nível de energia: {energyLevel}/5 • Conforto Sensorial: {comfortLevel}/5
                </p>
              </div>
            </div>
            
            <p className="text-sm text-foreground leading-relaxed line-clamp-3 bg-muted/20 p-3 rounded-xl border border-border/10">{content}</p>
            
            {sensoryTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sensoryTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-lg text-[10px] font-semibold uppercase tracking-wider"
                  >
                    {tag.replace('-', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Risk Meltdown warnings in Portuguese */}
          {analysis.riskLevel !== 'low' && (
            <div className={cn(
              'rounded-2xl p-4.5 flex items-start gap-3 border shadow-sm',
              analysis.riskLevel === 'high' 
                ? 'bg-red-50 border-red-200/50 text-red-950' 
                : 'bg-amber-50 border-amber-200/50 text-amber-950'
            )}>
              <AlertTriangle className={cn(
                'w-5 h-5 mt-0.5 shrink-0',
                analysis.riskLevel === 'high' ? 'text-red-600' : 'text-amber-600'
              )} />
              <div>
                <p className="font-bold text-sm">
                  {analysis.riskLevel === 'high' ? '⚠️ Alerta: Risco de Crise Elevado' : '⚠️ Atenção: Risco de Crise Moderado'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Identificamos fatores que podem indicar sobrecarga. Veja os indicadores:
                </p>
                <ul className="text-xs text-foreground/80 mt-1.5 space-y-1 font-medium list-disc list-inside">
                  {analysis.riskIndicators.map((indicator, i) => (
                    <li key={i}>{indicator}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* AI suggestions/tips */}
          {analysis.suggestions.length > 0 && (
            <div className="bg-card border border-border/20 rounded-2xl p-4.5 flex items-start gap-3 shadow-sm">
              <Lightbulb className="w-5 h-5 mt-0.5 text-secondary shrink-0" />
              <div>
                <p className="font-bold text-sm text-foreground">Dicas de Autorregulação</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Sugestões carinhosas baseadas no seu relato:</p>
                <ul className="text-xs text-foreground/80 mt-1.5 space-y-1.5 leading-relaxed">
                  {analysis.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-secondary shrink-0">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                SensoryAudio.play('bubble')
                setStep(3)
              }}
              className="flex-1 h-12 rounded-xl gap-2 border-border cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              Voltar
            </Button>
            <Button 
              onClick={() => {
                SensoryAudio.play('chime')
                handleComplete()
              }}
              className="flex-1 h-12 rounded-xl gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4 shrink-0" />
              Salvar Registro
            </Button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className={cn('min-h-screen transition-colors', calmMode ? 'duration-0' : 'duration-500', currentConfig.bgClass)}>
      {/* Small Zen Mode Switch inside Wizard */}
      <div className="max-w-lg mx-auto pt-6 px-4 flex justify-between items-center md:max-w-none md:absolute md:top-8 md:left-8 md:p-0">
        <Link 
          href="/" 
          onClick={() => SensoryAudio.playClick()}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 bg-card/80 py-1.5 px-4 rounded-full border border-border/10 cursor-pointer shadow-sm hover:bg-card transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Painel
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {([1, 2, 3, 4] as WizardStep[]).map((s) => (
            <div
              key={s}
              className={cn(
                'w-3 h-3 rounded-full',
                calmMode ? 'transition-none' : 'transition-all duration-300',
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{currentConfig.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{currentConfig.subtitle}</p>
        </div>

        {/* Content */}
        {calmMode ? (
          // In Calm Mode, render instantly without motion and page flips
          <div className={currentConfig.textClass}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </div>
        ) : (
          // In Standard Mode, show elegant transitions
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
        )}
      </div>
    </div>
  )
}
