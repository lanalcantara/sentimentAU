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
import { TrendingUp, AlertTriangle } from 'lucide-react'

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

  // Determine risk level from recent entries
  const recentHighRisk = entries.slice(0, 7).filter(e => e.analysis?.riskLevel === 'high').length
  const riskLevel: RiskLevel = recentHighRisk >= 3 ? 'high' : recentHighRisk >= 1 ? 'medium' : 'low'

  const riskColors = {
    low: { bg: 'bg-green-50', text: 'text-green-600', bar: 'bg-green-500' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-600', bar: 'bg-yellow-500' },
    high: { bg: 'bg-red-50', text: 'text-red-600', bar: 'bg-red-500' },
  }

  const riskLabels = {
    low: 'Risco Baixo',
    medium: 'Risco Médio',
    high: 'Risco Alto',
  }

  const riskMessages = {
    low: 'Você está tendo uma ótima semana! Continue assim.',
    medium: 'Alguns dias mais difíceis. Preste atenção aos seus gatilhos.',
    high: 'Foram detectados vários sinais de dificuldade. Considere conversar com seu terapeuta.',
  }

  // Generate risk bars for last 7 days
  const riskBars = entries.slice(0, 7).reverse().map(entry => entry.analysis?.riskLevel || 'low')

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

      {/* Risk Indicator */}
      <Card className="bg-white border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#6b8fd4]" />
            <CardTitle className="text-base font-bold text-[#1e2a4a]">Indicador de Risco</CardTitle>
          </div>
          <p className="text-sm text-[#6a7a9a]">Baseado nos últimos 7 registros</p>
        </CardHeader>
        <CardContent>
          {/* Risk Alert Box */}
          <div className={cn(
            'rounded-xl p-4 mb-4',
            riskColors[riskLevel].bg
          )}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={cn('w-6 h-6 mt-0.5', riskColors[riskLevel].text)} />
              <div>
                <h4 className={cn('font-bold', riskColors[riskLevel].text)}>
                  {riskLabels[riskLevel]}
                </h4>
                <p className="text-sm text-[#4a5a7a] mt-1">
                  {riskMessages[riskLevel]}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Risk Bars */}
          <div>
            <p className="text-xs text-[#6a7a9a] mb-2 font-medium">ÚLTIMOS 7 DIAS</p>
            <div className="flex gap-2">
              {riskBars.map((risk, index) => (
                <div 
                  key={index}
                  className={cn(
                    'flex-1 h-3 rounded-full',
                    risk === 'high' ? 'bg-red-500' : risk === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
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
