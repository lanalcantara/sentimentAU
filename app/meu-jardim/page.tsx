'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FLOWERS } from '@/lib/flowers'
import { cn } from '@/lib/utils'
import { Sprout, CloudRain, Trophy, Loader2, UserCircle2, Lock } from 'lucide-react'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WatererRecord {
  id: string
  remetente: string
  florRemetente: string
  data: string
  sender_id?: string
}

export default function MeuJardimPage() {
  const [unlockedFlowers, setUnlockedFlowers] = useState<string[]>(['semente'])
  const [entries, setEntries] = useState<any[]>([])
  const [waterers, setWaterers] = useState<WatererRecord[]>([])
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFlower, setSelectedFlower] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      // Load profile with unlocked flowers
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
        // Filter only "regar" type notifications from the last 7 days
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const recentWaters = (dataNotifs.notifications as any[]).filter(n => {
          const notifDate = new Date(n.data)
          return (n.tipo === 'regar' || n.tipo === 'water') && notifDate >= oneWeekAgo
        })
        // Deduplicate by remetente (keep most recent per person)
        const seen = new Set<string>()
        const deduped = recentWaters.filter(n => {
          const key = n.remetente
          if (seen.has(key)) return false
          seen.add(key)
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
  
  const flowerEntries = Object.entries(FLOWERS)

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#b1d156] to-[#8bae96] p-8 text-white shadow-lg">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm">
                  <Sprout className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">Meu Jardim</h1>
                  <p className="text-white/80 text-sm font-medium">O jardim de {username}</p>
                </div>
              </div>
              <p className="text-sm text-white/70 max-w-md leading-relaxed">
                Cada flor conquistada aqui representa uma jornada emocional. Continue registrando para florescer!
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-4 shrink-0">
              <div className="text-center">
                <p className="text-3xl font-extrabold">{unlockedCount}</p>
                <p className="text-xs text-white/70 uppercase tracking-wider font-bold">flores</p>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <p className="text-3xl font-extrabold">{totalDias}</p>
                <p className="text-xs text-white/70 uppercase tracking-wider font-bold">dias</p>
              </div>
            </div>
          </div>
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/10 translate-y-12" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Flower Garden Grid */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Progress bar */}
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-foreground whitespace-nowrap">
                Flores Conquistadas
              </h2>
              <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                <div 
                  className="h-2 bg-gradient-to-r from-[#b1d156] to-[#8bae96] rounded-full transition-all duration-700"
                  style={{ width: `${(unlockedCount / totalCount) * 100}%` }} 
                />
              </div>
              <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">
                {unlockedCount}/{totalCount}
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-40 bg-muted/20 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {flowerEntries.map(([id, flower]) => {
                  const isUnlocked = unlockedFlowers.includes(id)
                  const isSelected = selectedFlower === id
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        if (isUnlocked) {
                          SensoryAudio.playClick()
                          setSelectedFlower(isSelected ? null : id)
                        }
                      }}
                      className={cn(
                        'relative rounded-2xl border-2 p-4 text-center transition-all duration-300 text-left',
                        isUnlocked
                          ? isSelected
                            ? 'border-[#b1d156] bg-[#f0fdf4] shadow-md scale-[1.02]'
                            : 'border-transparent bg-card hover:border-[#b1d156]/60 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                          : 'border-transparent bg-muted/40 opacity-60 cursor-default grayscale',
                      )}
                    >
                      {!isUnlocked && (
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
                          <Lock className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className={cn(
                        "text-4xl mb-2 transition-transform duration-300",
                        isUnlocked && "hover:scale-110"
                      )}>
                        {flower.emoji}
                      </div>
                      <p className={cn(
                        "text-sm font-bold",
                        isUnlocked ? "text-foreground" : "text-muted-foreground/60"
                      )}>
                        {flower.label}
                      </p>
                      {isUnlocked && isSelected && (
                        <p className="text-xs text-[#5a6b5e] mt-1 leading-snug">
                          {flower.description}
                        </p>
                      )}
                      {isUnlocked && !isSelected && (
                        <p className="text-[10px] text-[#b1d156] font-bold mt-1 uppercase tracking-wider">
                          Conquistada ✓
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar Panel */}
          <div className="space-y-6">
            
            {/* Stats Card */}
            <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-[#f0fdf4] to-white overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#16a34a]">
                  <Trophy className="w-4 h-4" />
                  Resumo do Jardim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium" style={{color:'#374151'}}>Flores descobertas</span>
                  <span className="text-sm font-extrabold text-[#16a34a]">{unlockedCount} 🌸</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium" style={{color:'#374151'}}>Registros totais</span>
                  <span className="text-sm font-extrabold" style={{color:'#111827'}}>{totalDias} 📓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium" style={{color:'#374151'}}>Dias positivos</span>
                  <span className="text-sm font-extrabold text-[#d97706]">{positiveCount} ☀️</span>
                </div>
                <div className="pt-2 border-t border-[#e8f5e9]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{color:'#374151'}}>Progresso geral</span>
                    <span className="text-xs font-bold text-[#16a34a]">
                      {Math.round((unlockedCount / totalCount) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-[#e8f5e9] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#b1d156] to-[#16a34a] rounded-full transition-all duration-700"
                      style={{ width: `${(unlockedCount / totalCount) * 100}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Waterers this week */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-[#f0f9ff] to-white">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#0284c7]">
                  <CloudRain className="w-4 h-4" />
                  Regaram seu jardim
                </CardTitle>
                <CardDescription className="text-xs" style={{color:'#374151'}}>
                  Colegas que passaram esta semana
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1,2].map(i => (
                      <div key={i} className="h-10 bg-muted/20 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : waterers.length === 0 ? (
                  <div className="text-center py-6">
                    <CloudRain className="w-8 h-8 mx-auto mb-2" style={{color:'#93c5fd', opacity:0.7}} />
                    <p className="text-xs leading-relaxed" style={{color:'#374151'}}>
                      Nenhum colega regou seu jardim esta semana ainda. 
                      Visite jardins de amigos para incentivar!
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
                            <p className="text-sm font-bold truncate" style={{color:'#111827'}}>
                              {w.remetente}
                            </p>
                            <p className="text-[10px]" style={{color:'#6b7280'}}>
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

            {/* Tip Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] p-4 border border-[#fde68a]/50">
              <p className="text-xs font-bold mb-1 uppercase tracking-wider" style={{color:'#92400e'}}>💡 Dica do Jardim</p>
              <p className="text-xs leading-relaxed" style={{color:'#78350f'}}>
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
