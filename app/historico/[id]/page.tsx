'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppLayout } from '@/components/layout/app-layout'
import { WeatherMood } from '@/components/characters/weather-mood'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MOCK_ENTRIES } from '@/lib/mock-data'
import { SENSORY_TAGS, EMOTIONS, type Emotion, type SensoryTag } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ArrowLeft, AlertTriangle, Lightbulb, Calendar, Battery, Heart, Loader2 } from 'lucide-react'
import { SensoryAudio } from '@/lib/services/sensory-audio'

interface EntryDetailPageProps {
  params: Promise<{ id: string }>
}

export default function EntryDetailPage({ params }: EntryDetailPageProps) {
  const { id } = use(params)
  const [entry, setEntry] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadEntry() {
      try {
        const res = await fetch('/api/diary')
        const data = await res.json()
        if (res.ok && data.entries) {
          const found = data.entries.find((e: any) => String(e.id) === String(id))
          if (found) {
            setEntry(found)
            setIsLoading(false)
            return
          }
        }
        // Fallback to mock
        const mock = MOCK_ENTRIES.find((e) => String(e.id) === String(id))
        setEntry(mock || null)
      } catch (err) {
        console.error('[EntryDetail] Error loading entry:', err)
        const mock = MOCK_ENTRIES.find((e) => String(e.id) === String(id))
        setEntry(mock || null)
      } finally {
        setIsLoading(false)
      }
    }
    loadEntry()
  }, [id])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando registro...</p>
        </div>
      </AppLayout>
    )
  }

  if (!entry) {
    return (
      <AppLayout>
        <div className="p-8 text-center space-y-4 max-w-md mx-auto">
          <p className="text-muted-foreground">Registro não encontrado.</p>
          <Link href="/historico">
            <Button variant="outline" className="rounded-xl">Voltar ao Histórico</Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const sentiment = entry.analysis?.sentiment || entry.sentiment || 'neutral'
  const riskLevel = entry.analysis?.riskLevel || entry.risk_level || 'low'

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <Link href="/historico">
          <Button 
            onClick={() => SensoryAudio.play('bubble')}
            variant="ghost" 
            size="sm" 
            className="gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Histórico
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4">
          <WeatherMood sentiment={sentiment} size="lg" />
          <div>
            <h1 className="text-xl font-bold">
              {format(new Date(entry.createdAt), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(entry.createdAt), 'HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Levels */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Battery className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Energia</p>
                <p className="font-semibold">{entry.energyLevel}/5</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Heart className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Conforto</p>
                <p className="font-semibold">{entry.comfortLevel}/5</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Card className="bg-card/50 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Meu Registro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
          </CardContent>
        </Card>

        {/* Analysis */}
        {entry.analysis && (
          <>
            {/* Emotions */}
            <Card className="bg-card/50 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Emoções Detectadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {entry.analysis.emotions.map((emotion: any) => (
                    <span
                      key={emotion}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium',
                        EMOTIONS[emotion as Emotion]?.color || 'bg-muted text-muted-foreground'
                      )}
                    >
                      {EMOTIONS[emotion as Emotion]?.emoji} {EMOTIONS[emotion as Emotion]?.label || emotion}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sensory tags */}
            {entry.sensoryTags && entry.sensoryTags.length > 0 && (
              <Card className="bg-card/50 border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Gatilhos Sensoriais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {entry.sensoryTags.map((tag: any) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-xl text-sm"
                      >
                        <span>{SENSORY_TAGS[tag as SensoryTag]?.emoji}</span>
                        <span>{SENSORY_TAGS[tag as SensoryTag]?.label || tag}</span>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk indicator */}
            {riskLevel !== 'low' && (
              <div className={cn(
                'rounded-2xl p-4 flex items-start gap-3 shadow-sm',
                riskLevel === 'high' ? 'bg-destructive/10 text-destructive-foreground' : 'bg-yellow-100/70 text-yellow-900'
              )}>
                <AlertTriangle className={cn(
                  'w-5 h-5 mt-0.5 shrink-0',
                  riskLevel === 'high' ? 'text-destructive' : 'text-yellow-600'
                )} />
                <div>
                  <p className="font-semibold text-sm">
                    {riskLevel === 'high' ? 'Risco Elevado Detectado' : 'Risco Moderado Detectado'}
                  </p>
                  <ul className="text-sm mt-2 space-y-1 opacity-90">
                    {entry.analysis.riskIndicators?.map((indicator: string, i: number) => (
                      <li key={i}>• {indicator}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {entry.analysis.suggestions && entry.analysis.suggestions.length > 0 && (
              <div className="bg-accent/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                <Lightbulb className="w-5 h-5 mt-0.5 text-accent-foreground shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Dicas de Autorregulação</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    {entry.analysis.suggestions.map((suggestion: string, i: number) => (
                      <li key={i}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
