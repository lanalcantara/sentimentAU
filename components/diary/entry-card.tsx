'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { WeatherMood } from '@/components/characters/weather-mood'
import type { DiaryEntry } from '@/lib/types'
import { SENSORY_TAGS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronRight, AlertTriangle } from 'lucide-react'

interface EntryCardProps {
  entry: DiaryEntry
  className?: string
}

export function EntryCard({ entry, className }: EntryCardProps) {
  const sentiment = entry.analysis?.sentiment || 'neutral'
  const riskLevel = entry.analysis?.riskLevel || 'low'

  return (
    <Link href={`/historico/${entry.id}`}>
      <Card className={cn(
        'bg-card/50 border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer',
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <WeatherMood sentiment={sentiment} size="sm" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-medium">
                  {format(entry.createdAt, "EEEE, d 'de' MMMM", { locale: pt })}
                </p>
                {riskLevel === 'high' && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="w-3 h-3" />
                    Risco
                  </span>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {entry.content}
              </p>
              
              {entry.sensoryTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.sensoryTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-xs"
                    >
                      {SENSORY_TAGS[tag].emoji}
                    </span>
                  ))}
                  {entry.sensoryTags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{entry.sensoryTags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
