'use client'

import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { WellbeingGarden } from '@/components/dashboard/wellbeing-garden'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { MoodChart } from '@/components/dashboard/mood-chart'
import { Button } from '@/components/ui/button'
import { MOCK_ENTRIES, MOCK_STATS } from '@/lib/mock-data'
import { PenLine } from 'lucide-react'

export default function DashboardPage() {
  const gardenData = MOCK_STATS.weeklyMoodData

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6 bg-[#f5f7fa] min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">&#127804;</span>
              <h1 className="text-2xl font-bold text-[#1e2a4a]">O Teu Painel</h1>
            </div>
            <p className="text-[#6a7a9a] mt-1">Como te sentes esta semana?</p>
          </div>
          <Link href="/novo-registo">
            <Button className="gap-2 rounded-xl bg-[#f5c842] hover:bg-[#e5b832] text-[#1e2a4a] font-semibold shadow-sm">
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
      </div>
    </AppLayout>
  )
}
