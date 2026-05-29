'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { MoodChart } from '@/components/dashboard/mood-chart'
import { Loader2, Lightbulb } from 'lucide-react'

export default function InsightsPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadEntries() {
      try {
        const res = await fetch('/api/diary')
        const data = await res.json()
        if (res.ok && data.entries) {
          setEntries(data.entries)
        }
      } catch (err) {
        console.error('Failed to load diary entries for insights', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadEntries()
  }, [])

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2 mt-4 mb-8">
          <div className="w-16 h-16 bg-[#eef2f6] rounded-full flex items-center justify-center mb-2">
            <Lightbulb className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-fredoka">Insights e Clima Emocional</h1>
          <p className="text-[#6a7a9a] max-w-md">
            Analise a evolução de seus sentimentos e o nível de energia do seu jardim com base nos seus últimos registros.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl shadow-sm border border-border">
            Sem registros suficientes para exibir insights. Comece a escrever no seu diário!
          </div>
        ) : (
          <div className="space-y-6">
            <MoodChart entries={entries} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
