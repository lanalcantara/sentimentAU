'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { MoodChart } from '@/components/dashboard/mood-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MOCK_ENTRIES, MOCK_STATS } from '@/lib/mock-data'
import { SENSORY_TAGS } from '@/lib/types'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

export default function InsightsPage() {
  // Calculate sensory trigger frequency
  const sensoryFrequency: Record<string, number> = {}
  MOCK_ENTRIES.forEach(entry => {
    entry.sensoryTags.forEach(tag => {
      sensoryFrequency[tag] = (sensoryFrequency[tag] || 0) + 1
    })
  })

  const sensoryChartData = Object.entries(sensoryFrequency)
    .map(([tag, count]) => ({
      tag: SENSORY_TAGS[tag as keyof typeof SENSORY_TAGS]?.label || tag,
      emoji: SENSORY_TAGS[tag as keyof typeof SENSORY_TAGS]?.emoji || '',
      count,
    }))
    .sort((a, b) => b.count - a.count)

  // Calculate energy/comfort patterns
  const energyComfortData = MOCK_ENTRIES.map(entry => ({
    date: entry.createdAt.toLocaleDateString('pt-PT', { weekday: 'short' }),
    energy: entry.energyLevel,
    comfort: entry.comfortLevel,
  })).reverse()

  // Calculate patterns for radar chart
  const categoryScores = {
    'Positividade': MOCK_ENTRIES.filter(e => e.analysis?.sentiment === 'positive').length / MOCK_ENTRIES.length * 100,
    'Energia': MOCK_ENTRIES.reduce((sum, e) => sum + e.energyLevel, 0) / MOCK_ENTRIES.length * 20,
    'Conforto': MOCK_ENTRIES.reduce((sum, e) => sum + e.comfortLevel, 0) / MOCK_ENTRIES.length * 20,
    'Estabilidade': 100 - (MOCK_ENTRIES.filter(e => e.analysis?.riskLevel === 'high').length / MOCK_ENTRIES.length * 100),
    'Consistência': (MOCK_ENTRIES.length / 7) * 100, // Assuming 7-day goal
  }

  const radarData = Object.entries(categoryScores).map(([subject, value]) => ({
    subject,
    value: Math.round(value),
    fullMark: 100,
  }))

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Insights</h1>
          <p className="text-muted-foreground">Análise detalhada dos teus padrões</p>
        </div>

        {/* Mood charts */}
        <MoodChart entries={MOCK_ENTRIES} />

        {/* Radar chart - overall wellbeing */}
        <Card className="bg-card/50 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Perfil de Bem-Estar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-border/30" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  />
                  <Radar
                    name="Bem-Estar"
                    dataKey="value"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Energy and Comfort over time */}
        <Card className="bg-card/50 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Energia e Conforto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energyComfortData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 5]}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="energy" name="Energia" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comfort" name="Conforto" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sensory triggers frequency */}
        {sensoryChartData.length > 0 && (
          <Card className="bg-card/50 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Gatilhos Sensoriais Mais Frequentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sensoryChartData.map((item, index) => (
                  <div key={item.tag} className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.tag}</span>
                        <span className="text-sm text-muted-foreground">{item.count}x</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(item.count / Math.max(...sensoryChartData.map(d => d.count))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-500">
                {MOCK_ENTRIES.filter(e => e.analysis?.sentiment === 'positive').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Dias Positivos</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">
                {MOCK_ENTRIES.filter(e => e.analysis?.sentiment === 'neutral').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Dias Neutros</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-pink-500">
                {MOCK_ENTRIES.filter(e => e.analysis?.sentiment === 'negative').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Dias Difíceis</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-500">
                {MOCK_ENTRIES.filter(e => e.analysis?.riskLevel === 'high').length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Alertas de Risco</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
