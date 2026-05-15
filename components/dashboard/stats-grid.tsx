'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Calendar, Heart, AlertTriangle, Sparkles } from 'lucide-react'
import type { WellbeingStats } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StatsGridProps {
  stats: WellbeingStats
  className?: string
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  const trendIcon = {
    improving: <TrendingUp className="w-4 h-4 text-green-500" />,
    stable: <Minus className="w-4 h-4 text-blue-500" />,
    declining: <TrendingDown className="w-4 h-4 text-red-500" />,
  }

  const trendLabel = {
    improving: 'A melhorar',
    stable: 'Estável',
    declining: 'A decrescer',
  }

  const sentimentPercentage = Math.round(stats.averageSentiment * 100)

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <Card className="bg-card/50 border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Total de Registos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalEntries}</p>
          <p className="text-xs text-muted-foreground mt-1">últimos 30 dias</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Bem-estar Médio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{sentimentPercentage}%</p>
          <div className="flex items-center gap-1 mt-1">
            {trendIcon[stats.moodTrend]}
            <span className="text-xs text-muted-foreground">{trendLabel[stats.moodTrend]}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Gatilhos Comuns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.commonTriggers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">identificados</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Dias Positivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {stats.weeklyMoodData.filter(d => d.sentiment === 'positive').length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">esta semana</p>
        </CardContent>
      </Card>
    </div>
  )
}
