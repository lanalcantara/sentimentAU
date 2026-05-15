'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { EntryCard } from '@/components/diary/entry-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MOCK_ENTRIES } from '@/lib/mock-data'
import type { Sentiment } from '@/lib/types'
import { Search, Filter, Sun, Cloud, CloudRain } from 'lucide-react'
import { cn } from '@/lib/utils'

type SentimentFilter = Sentiment | 'all'

export default function HistoricoPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all')

  const filteredEntries = MOCK_ENTRIES.filter((entry) => {
    // Search filter
    if (searchQuery && !entry.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Sentiment filter
    if (sentimentFilter !== 'all' && entry.analysis?.sentiment !== sentimentFilter) {
      return false
    }
    
    return true
  })

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-muted-foreground">Todos os teus registos</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar registos..."
              className="pl-9 rounded-xl"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={sentimentFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSentimentFilter('all')}
              className="rounded-xl gap-1"
            >
              <Filter className="w-4 h-4" />
              Todos
            </Button>
            <Button
              variant={sentimentFilter === 'positive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSentimentFilter('positive')}
              className={cn(
                'rounded-xl gap-1',
                sentimentFilter === 'positive' && 'bg-green-500 hover:bg-green-600'
              )}
            >
              <Sun className="w-4 h-4" />
              Positivo
            </Button>
            <Button
              variant={sentimentFilter === 'neutral' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSentimentFilter('neutral')}
              className={cn(
                'rounded-xl gap-1',
                sentimentFilter === 'neutral' && 'bg-blue-500 hover:bg-blue-600'
              )}
            >
              <Cloud className="w-4 h-4" />
              Neutro
            </Button>
            <Button
              variant={sentimentFilter === 'negative' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSentimentFilter('negative')}
              className={cn(
                'rounded-xl gap-1',
                sentimentFilter === 'negative' && 'bg-pink-500 hover:bg-pink-600'
              )}
            >
              <CloudRain className="w-4 h-4" />
              Difícil
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum registo encontrado</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))
          )}
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground text-center">
          {filteredEntries.length} registo{filteredEntries.length !== 1 && 's'} encontrado{filteredEntries.length !== 1 && 's'}
        </p>
      </div>
    </AppLayout>
  )
}
