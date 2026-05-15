'use client'

import { cn } from '@/lib/utils'
import { Calendar, Sun, Cloud, Zap } from 'lucide-react'
import type { WellbeingStats } from '@/lib/types'

interface StatsGridProps {
  stats: WellbeingStats
  className?: string
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  const positiveCount = stats.weeklyMoodData.filter(d => d.sentiment === 'positive').length
  const difficultCount = stats.weeklyMoodData.filter(d => d.sentiment === 'negative').length
  const averageEnergy = (stats.weeklyMoodData.reduce((acc, d) => acc + (d.energyLevel || 3), 0) / stats.weeklyMoodData.length).toFixed(1)

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {/* Registos - Blue */}
      <div className="bg-[#d4e8f9] rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#6b8fd4] rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-[#1e2a4a]">{stats.totalEntries}</p>
          <p className="text-sm text-[#4a5a7a]">Registos</p>
        </div>
      </div>

      {/* Positivos - Yellow/Orange */}
      <div className="bg-[#fcecc4] rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#f5a623] rounded-lg flex items-center justify-center">
          <Sun className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-[#1e2a4a]">{positiveCount}</p>
          <p className="text-sm text-[#7a6a4a]">Positivos</p>
        </div>
      </div>

      {/* Difíceis - Pink/Coral */}
      <div className="bg-[#fce4e4] rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#e85a6b] rounded-lg flex items-center justify-center">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-[#1e2a4a]">{difficultCount}</p>
          <p className="text-sm text-[#7a5a5a]">Difíceis</p>
        </div>
      </div>

      {/* Energia - Cyan/Turquoise */}
      <div className="bg-[#c4f5f0] rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#4ecdc4] rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-[#1e2a4a]">{averageEnergy}</p>
          <p className="text-sm text-[#4a7a7a]">Energia</p>
        </div>
      </div>
    </div>
  )
}
