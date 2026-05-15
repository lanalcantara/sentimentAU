'use client'

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DiaryEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MoodChartProps {
  entries: DiaryEntry[]
  className?: string
}

export function MoodChart({ entries, className }: MoodChartProps) {
  // Process entries for area chart
  const chartData = entries.slice().reverse().map(entry => ({
    date: entry.createdAt.toLocaleDateString('pt-PT', { weekday: 'short' }),
    sentiment: entry.analysis?.sentiment === 'positive' ? 100 
      : entry.analysis?.sentiment === 'negative' ? 0 
      : 50,
    energy: entry.energyLevel * 20,
    comfort: entry.comfortLevel * 20,
  }))

  // Process entries for pie chart
  const sentimentCounts = {
    positive: entries.filter(e => e.analysis?.sentiment === 'positive').length,
    neutral: entries.filter(e => e.analysis?.sentiment === 'neutral').length,
    negative: entries.filter(e => e.analysis?.sentiment === 'negative').length,
  }

  const pieData = [
    { name: 'Positivo', value: sentimentCounts.positive, color: 'var(--chart-1)' },
    { name: 'Neutro', value: sentimentCounts.neutral, color: 'var(--chart-2)' },
    { name: 'Difícil', value: sentimentCounts.negative, color: 'var(--chart-3)' },
  ].filter(d => d.value > 0)

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-4', className)}>
      <Card className="bg-card/50 border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Evolução do Humor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs" 
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  className="text-xs"
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sentiment" 
                  stroke="var(--chart-1)" 
                  fill="url(#sentimentGradient)"
                  strokeWidth={2}
                  name="Humor"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Distribuição de Emoções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            {pieData.map((item) => (
              <span key={item.name} className="flex items-center gap-1">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                {item.name} ({item.value})
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
