'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FLOWERS } from '@/lib/flowers'
import { Sprout, CloudRain, Trophy, Leaf } from 'lucide-react'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PixelGarden } from '@/components/profile/pixel-garden'

interface WatererRecord {
  id: string
  remetente: string
  florRemetente: string
  data: string
}

export default function MeuJardimPage() {
  const [unlockedFlowers, setUnlockedFlowers] = useState<string[]>(['semente'])
  const [entries, setEntries] = useState<any[]>([])
  const [waterers, setWaterers] = useState<WatererRecord[]>([])
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [resProfile, resEntries, resNotifs] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/diary'),
        fetch('/api/notifications'),
      ])
      const [dataProfile, dataEntries, dataNotifs] = await Promise.all([
        resProfile.json(),
        resEntries.json(),
        resNotifs.json(),
      ])

      if (resProfile.ok && dataProfile.user) {
        setUnlockedFlowers(dataProfile.user.flores_desbloqueadas || ['semente'])
        setUsername(dataProfile.user.username || 'Jardineiro')
      }
      if (resEntries.ok && dataEntries.entries) {
        setEntries(dataEntries.entries)
      }
      if (resNotifs.ok && dataNotifs.notifications) {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const recentWaters = (dataNotifs.notifications as any[]).filter(n => {
          const notifDate = new Date(n.data)
          return (n.tipo === 'regar' || n.tipo === 'water') && notifDate >= oneWeekAgo
        })
        const seen = new Set<string>()
        const deduped = recentWaters.filter(n => {
          if (seen.has(n.remetente)) return false
          seen.add(n.remetente)
          return true
        })
        setWaterers(deduped)
      }
    } catch (err) {
      console.error('[MeuJardim] Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const handleFlowerUnlocked = () => loadData()
    window.addEventListener('flower_unlocked', handleFlowerUnlocked)
    return () => window.removeEventListener('flower_unlocked', handleFlowerUnlocked)
  }, [loadData])

  const unlockedCount = unlockedFlowers.length
  const totalCount = Object.keys(FLOWERS).length
  const totalDias = entries.length
  const positiveCount = entries.filter(e => e.analysis?.sentiment === 'positive').length

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#b1d156] to-[#5a8c3c] p-7 text-white shadow-lg">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Meu Jardim</h1>
                  <p className="text-white/80 text-xs font-medium">Jardim de {username}</p>
                </div>
              </div>
              <p className="text-sm text-white/70 max-w-md leading-relaxed mt-1">
                Cada flor aqui representa uma jornada emocional sua. Continue registrando para florescer!
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 shrink-0">
              <div className="text-center">
                <p className="text-3xl font-extrabold">{unlockedCount}</p>
                <p className="text-[10px] text-white/70 uppercase tracking-wider font-bold">flores</p>
              </div>
              <div className="w-px h-8 bg-white/30" />
              <div className="text-center">
                <p className="text-3xl font-extrabold">{totalDias}</p>
                <p className="text-[10px] text-white/70 uppercase tracking-wider font-bold">dias</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-16 translate-x-16 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/10 translate-y-12 pointer-events-none" />
        </div>

        {/* Main layout: Pixel Garden (left) + Side Panel (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Pixel Art Garden Scene */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#5a8c3c]" />
              <h2 className="text-lg font-bold text-foreground">Meu Cenário em Pixel Art</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                {unlockedCount}/{totalCount} flores
              </span>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border-4 border-[#5a8c3c] bg-[#4a7430] h-64 animate-pulse flex items-center justify-center">
                <Sprout className="w-10 h-10 text-white/30 animate-spin" />
              </div>
            ) : (
              <Card className="border-0 shadow-md rounded-3xl overflow-hidden">
                <CardContent className="p-4">
                  {/* Pixel Garden: own garden — no watering yourself */}
                  <PixelGarden
                    unlockedFlowers={unlockedFlowers}
                    username={username}
                    onWater={() => {}}
                    hasWatered={true}
                  />
                  <p className="text-center text-xs mt-3 italic" style={{ color: '#6b7280' }}>
                    Este é o seu jardim pessoal. 🌱 Visitantes podem regar — você conquista flores registrando!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Shortcut to Botanical Collection */}
            <Link
              href="/colecao"
              className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-[#b1d156] hover:bg-[#f0fdf4] transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center group-hover:bg-[#e0fdf4] transition-colors shrink-0">
                <Leaf className="w-5 h-5 text-[#16a34a]" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#15803d' }}>Ver Coleção Botânica completa →</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>Detalhes de cada flor desbloqueada e bloqueada</p>
              </div>
            </Link>
          </div>

          {/* RIGHT: Stats + Waterers panel */}
          <div className="space-y-5">

            {/* Stats Card */}
            <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-[#f0fdf4] to-white overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#16a34a]">
                  <Trophy className="w-4 h-4" />
                  Resumo do Jardim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {[
                  { label: 'Flores descobertas', value: `${unlockedCount} 🌸`, color: '#16a34a' },
                  { label: 'Registros totais',   value: `${totalDias} 📓`,   color: '#111827' },
                  { label: 'Dias positivos',      value: `${positiveCount} ☀️`, color: '#d97706' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-xs font-medium" style={{ color: '#374151' }}>{row.label}</span>
                    <span className="text-sm font-extrabold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#e8f5e9]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: '#374151' }}>Progresso geral</span>
                    <span className="text-xs font-bold text-[#16a34a]">
                      {Math.round((unlockedCount / totalCount) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#e8f5e9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#b1d156] to-[#16a34a] rounded-full transition-all duration-700"
                      style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Waterers Card */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-[#f0f9ff] to-white">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#0284c7]">
                  <CloudRain className="w-4 h-4" />
                  Regaram seu jardim
                </CardTitle>
                <CardDescription className="text-xs" style={{ color: '#374151' }}>
                  Colegas que passaram esta semana
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-10 bg-muted/20 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : waterers.length === 0 ? (
                  <div className="text-center py-6">
                    <CloudRain className="w-8 h-8 mx-auto mb-2" style={{ color: '#93c5fd', opacity: 0.7 }} />
                    <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>
                      Nenhum colega regou seu jardim esta semana. Visite outros jardins para incentivar!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {waterers.map(w => {
                      const flowerData = FLOWERS[w.florRemetente || 'semente']
                      return (
                        <div key={w.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#f0f9ff]/60 hover:bg-[#f0f9ff] transition-colors">
                          <div className="w-9 h-9 rounded-full bg-[#e0f2fe] flex items-center justify-center text-lg shrink-0">
                            {flowerData?.emoji || '🌱'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: '#111827' }}>
                              {w.remetente}
                            </p>
                            <p className="text-[10px]" style={{ color: '#6b7280' }}>
                              {formatDistanceToNow(new Date(w.data), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                          <span className="text-lg">💧</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tip card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] p-4 border border-[#fde68a]/50">
              <p className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: '#92400e' }}>
                💡 Dica do Jardim
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>
                Registre suas emoções todos os dias para desbloquear novas flores raras.
                Autorregular em dias difíceis também ganha flores especiais! 🪷
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
