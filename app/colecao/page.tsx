'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FLOWERS } from '@/lib/flowers'
import { cn } from '@/lib/utils'
import { Leaf, Award, Sun, CloudRain, Loader2 } from 'lucide-react'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import { toast } from 'sonner'

export default function ColecaoPage() {
  const [unlockedFlowers, setUnlockedFlowers] = useState<string[]>(['semente'])
  const [entries, setEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch profile
        const resProfile = await fetch('/api/profile')
        const dataProfile = await resProfile.json()
        if (resProfile.ok && dataProfile.user) {
          setUnlockedFlowers(dataProfile.user.flores_desbloqueadas || ['semente'])
        }

        // Fetch real diary entries for stats
        const resEntries = await fetch('/api/diary')
        const dataEntries = await resEntries.json()
        if (resEntries.ok && dataEntries.entries) {
          setEntries(dataEntries.entries)
        }
      } catch (err) {
        console.error('Failed to load profile or entries data', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])



  // Calculate friendly stats using real user entries
  const totalDias = entries.length
  const diasEnsola = entries.filter(e => e.analysis?.sentiment === 'positive').length
  const diasChuvosos = entries.filter(e => e.analysis?.sentiment === 'negative').length

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2 mt-4 mb-8">
          <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mb-2">
            <Leaf className="w-8 h-8 text-[#4caf50]" />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-fredoka">Álbum do Jardineiro</h1>
          <p className="text-[#6a7a9a] max-w-md">
            Cada dia que você registra é uma nova semente plantada. Acompanhe as flores que você já descobriu no seu jardim emocional!
          </p>
        </div>

        {/* Friendly Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#f0f9ff] border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center">
              <Award className="w-6 h-6 text-[#0284c7] mb-2" />
              <p className="text-3xl font-bold text-[#0369a1]">{unlockedFlowers.length}</p>
              <p className="text-xs text-[#0284c7] mt-1 font-semibold uppercase tracking-wider">Descobertas</p>
            </CardContent>
          </Card>
          <Card className="bg-[#f0fdf4] border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center">
              <Leaf className="w-6 h-6 text-[#16a34a] mb-2" />
              <p className="text-3xl font-bold text-[#15803d]">{totalDias}</p>
              <p className="text-xs text-[#16a34a] mt-1 font-semibold uppercase tracking-wider">Dias Regados</p>
            </CardContent>
          </Card>
          <Card className="bg-[#fffbeb] border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center">
              <Sun className="w-6 h-6 text-[#d97706] mb-2" />
              <p className="text-3xl font-bold text-[#b45309]">{diasEnsola}</p>
              <p className="text-xs text-[#d97706] mt-1 font-semibold uppercase tracking-wider">Dias de Sol</p>
            </CardContent>
          </Card>
          <Card className="bg-[#fdf4ff] border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center">
              <CloudRain className="w-6 h-6 text-[#c026d3] mb-2" />
              <p className="text-3xl font-bold text-[#a21caf]">{diasChuvosos}</p>
              <p className="text-xs text-[#c026d3] mt-1 font-semibold uppercase tracking-wider">Dias de Chuva</p>
            </CardContent>
          </Card>
        </div>

        {/* Album Grid */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <span>Coleção Botânica</span>
            <span className="text-sm font-normal bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full">
              {unlockedFlowers.length} de {Object.keys(FLOWERS).length} flores
            </span>
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(FLOWERS).map(([id, flower]) => {
                const isUnlocked = unlockedFlowers.includes(id)
                
                return (
                  <Card 
                    key={id} 
                    className={cn(
                      'border-0 shadow-sm rounded-2xl transition-all duration-300 relative overflow-hidden',
                      isUnlocked ? 'bg-white hover:shadow-md hover:-translate-y-1' : 'bg-[#f1f5f9] opacity-80 cursor-not-allowed grayscale'
                    )}
                  >
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <span className="text-4xl opacity-50">🔒</span>
                      </div>
                    )}
                    <CardHeader className="pb-2 text-center pt-6">
                      <div className={cn(
                        "text-5xl mb-4 transform transition-transform duration-500",
                        isUnlocked && "hover:scale-110 hover:rotate-3"
                      )}>
                        {flower.emoji}
                      </div>
                      <CardTitle className="text-base text-foreground">{flower.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className={cn(
                        "text-xs leading-relaxed",
                        isUnlocked ? "text-[#6a7a9a]" : "text-transparent"
                      )}>
                        {isUnlocked ? flower.description : 'Continue registrando seus sentimentos para descobrir esta flor.'}
                      </CardDescription>
                      

                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
