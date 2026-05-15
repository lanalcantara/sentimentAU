'use client'

import { use } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { AppLayout } from '@/components/layout/app-layout'
import { WeatherMood } from '@/components/characters/weather-mood'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MOCK_ENTRIES } from '@/lib/mock-data'
import { SENSORY_TAGS, EMOTIONS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ArrowLeft, AlertTriangle, Lightbulb, Calendar, Battery, Heart } from 'lucide-react'
import { notFound } from 'next/navigation'

interface EntryDetailPageProps {
  params: Promise<{ id: string }>
}

export default function EntryDetailPage({ params }: EntryDetailPageProps) {
  const { id } = use(params)
  const entry = MOCK_ENTRIES.find((e) => e.id === id)

  if (!entry) {
    notFound()
  }

  const sentiment = entry.analysis?.sentiment || 'neutral'
  const riskLevel = entry.analysis?.riskLevel || 'low'

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <Link href="/historico">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Histórico
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4">
          <WeatherMood sentiment={sentiment} size="lg" />
          <div>
            <h1 className="text-xl font-bold">
              {format(entry.createdAt, "EEEE, d 'de' MMMM", { locale: pt })}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(entry.createdAt, 'HH:mm', { locale: pt })}
            </p>
          </div>
        </div>

        {/* Levels */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50 border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <Battery className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Energia</p>
                <p className="font-semibold">{entry.energyLevel}/5</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-0">
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
        <Card className="bg-card/50 border-0">
          <CardHeader>
            <CardTitle className="text-base">O Meu Registo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
          </CardContent>
        </Card>

        {/* Analysis */}
        {entry.analysis && (
          <>
            {/* Emotions */}
            <Card className="bg-card/50 border-0">
              <CardHeader>
                <CardTitle className="text-base">Emoções Detetadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {entry.analysis.emotions.map((emotion) => (
                    <span
                      key={emotion}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium',
                        EMOTIONS[emotion].color
                      )}
                    >
                      {EMOTIONS[emotion].emoji} {EMOTIONS[emotion].label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sensory tags */}
            {entry.sensoryTags.length > 0 && (
              <Card className="bg-card/50 border-0">
                <CardHeader>
                  <CardTitle className="text-base">Gatilhos Sensoriais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {entry.sensoryTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-xl text-sm"
                      >
                        <span>{SENSORY_TAGS[tag].emoji}</span>
                        <span>{SENSORY_TAGS[tag].label}</span>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk indicator */}
            {riskLevel !== 'low' && (
              <div className={cn(
                'rounded-2xl p-4 flex items-start gap-3',
                riskLevel === 'high' ? 'bg-destructive/10' : 'bg-yellow-100'
              )}>
                <AlertTriangle className={cn(
                  'w-5 h-5 mt-0.5',
                  riskLevel === 'high' ? 'text-destructive' : 'text-yellow-600'
                )} />
                <div>
                  <p className="font-medium text-sm">
                    {riskLevel === 'high' ? 'Risco Elevado Detetado' : 'Risco Moderado Detetado'}
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    {entry.analysis.riskIndicators.map((indicator, i) => (
                      <li key={i}>• {indicator}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {entry.analysis.suggestions.length > 0 && (
              <div className="bg-accent/20 rounded-2xl p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 mt-0.5 text-accent-foreground" />
                <div>
                  <p className="font-medium text-sm">Sugestões da IA</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    {entry.analysis.suggestions.map((suggestion, i) => (
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
