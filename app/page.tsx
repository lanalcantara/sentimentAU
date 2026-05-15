'use client'

import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { WellbeingGarden } from '@/components/dashboard/wellbeing-garden'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { MoodChart } from '@/components/dashboard/mood-chart'
import { EntryCard } from '@/components/diary/entry-card'
import { Button } from '@/components/ui/button'
import { MOCK_ENTRIES, MOCK_STATS } from '@/lib/mock-data'
import { PenLine, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const recentEntries = MOCK_ENTRIES.slice(0, 3)
  const gardenData = MOCK_STATS.weeklyMoodData

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
            <p className="text-muted-foreground">Como te sentes hoje?</p>
          </div>
          <Link href="/novo-registo">
            <Button className="gap-2 rounded-xl">
              <PenLine className="w-4 h-4" />
              Novo Registo
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <StatsGrid stats={MOCK_STATS} />

        {/* Garden */}
        <WellbeingGarden data={gardenData} />

        {/* Charts */}
        <MoodChart entries={MOCK_ENTRIES} />

        {/* Recent entries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Registos Recentes</h2>
            <Link href="/historico">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
