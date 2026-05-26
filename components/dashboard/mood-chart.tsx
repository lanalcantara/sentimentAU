'use client'

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DiaryEntry, RiskLevel } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TrendingUp, Sun, CloudRain, Cloud } from 'lucide-react'

interface MoodChartProps {
  entries: DiaryEntry[]
  className?: string
}

export function MoodChart({ entries, className }: MoodChartProps) {
  // Process entries for line chart (last 7)
  const chartData = entries.slice(0, 7).reverse().map(entry => ({
    date: entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) : '',
    value: entry.analysis?.sentiment === 'positive' ? 1 
      : entry.analysis?.sentiment === 'negative' ? -0.5 
      : 0.5,
  }))

  // Determine garden energy from recent entries (replaces risk level logic)
  const recentHighRisk = entries.slice(0, 7).filter(e => e.analysis?.riskLevel === 'high').length
  const recentMediumRisk = entries.slice(0, 7).filter(e => e.analysis?.riskLevel === 'moderate').length
  
  const gardenEnergy = recentHighRisk >= 3 ? 'stormy' : (recentHighRisk >= 1 || recentMediumRisk >= 3) ? 'cloudy' : 'sunny'

  const energyColors = {
    sunny: { bg: 'bg-[#fcecc4]', text: 'text-[#f5a623]', bar: 'bg-[#f5a623]', icon: Sun },
    cloudy: { bg: 'bg-[#d4e8f9]', text: 'text-[#6b8fd4]', bar: 'bg-[#6b8fd4]', icon: Cloud },
    stormy: { bg: 'bg-[#f1f5f9]', text: 'text-[#9ca3af]', bar: 'bg-[#9ca3af]', icon: CloudRain },
  }

  const energyLabels = {
    sunny: 'Tempo Ensolarado',
    cloudy: 'Tempo Nublado',
    stormy: 'Precisando de Carinho',
  }

  const energyMessages = {
    sunny: 'O sol está brilhando! Seu jardim está florescendo lindamente.',
    cloudy: 'O tempo está mudando. Lembre-se de regar seu jardim com cuidado.',
    stormy: 'Dias de chuva também fazem as flores crescerem. Tenha paciência com você.',
  }

  // Generate energy bars for last 7 days
  const energyBars = entries.slice(0, 7).reverse().map(entry => {
    const risk = entry.analysis?.riskLevel || 'low'
    return risk === 'high' ? 'stormy' : risk === 'moderate' ? 'cloudy' : 'sunny'
  })

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-4', className)}>
      {/* Mood Evolution Chart */}
      <Card className="bg-white border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#6b8fd4]" />
            <CardTitle className="text-base font-bold text-[#1e2a4a]">Evolução do Humor</CardTitle>
          </div>
          <p className="text-sm text-[#6a7a9a]">Últimos 7 registros</p>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6a7a9a', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[-1, 1.5]} 
                  ticks={[-0.5, 0, 0.5, 1]}
                  tick={{ fill: '#6a7a9a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [
                    value >= 0.7 ? 'Positivo' : value <= 0 ? 'Difícil' : 'Neutro',
                    'Humor'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#f5c842"
                  strokeWidth={3}
                  dot={{ fill: '#f5c842', strokeWidth: 0, r: 4 }}
                  activeDot={{ fill: '#e5a832', strokeWidth: 0, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Garden Energy Indicator */}
      <Card className="bg-white border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#fcecc4] flex items-center justify-center">
              <Sun className="w-4 h-4 text-[#f5a623]" />
            </div>
            <CardTitle className="text-base font-bold text-[#1e2a4a]">Nível de Energia do Jardim</CardTitle>
          </div>
          <p className="text-sm text-[#6a7a9a]">Clima emocional dos últimos 7 dias</p>
        </CardHeader>
        <CardContent>
          {/* Energy Alert Box */}
          <div className={cn(
            'rounded-xl p-4 mb-4 flex items-start gap-3',
            energyColors[gardenEnergy].bg
          )}>
            {(() => {
              const Icon = energyColors[gardenEnergy].icon
              return <Icon className={cn('w-6 h-6 mt-0.5 shrink-0', energyColors[gardenEnergy].text)} />
            })()}
            <div>
              <h4 className={cn('font-bold', energyColors[gardenEnergy].text)}>
                {energyLabels[gardenEnergy]}
              </h4>
              <p className="text-sm text-[#4a5a7a] mt-1 font-medium leading-relaxed">
                {energyMessages[gardenEnergy]}
              </p>
            </div>
          </div>

          {/* Weekly Energy Bars */}
          <div>
            <p className="text-xs text-[#6a7a9a] mb-2 font-bold uppercase tracking-wider">Últimos 7 dias</p>
            <div className="flex gap-2">
              {energyBars.map((energy, index) => (
                <div 
                  key={index}
                  className={cn(
                    'flex-1 h-3 rounded-full',
                    energyColors[energy as 'sunny'|'cloudy'|'stormy'].bar
                  )}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
