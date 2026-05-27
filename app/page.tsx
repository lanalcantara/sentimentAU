'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { cn } from '@/lib/utils'
import { WellbeingGarden } from '@/components/dashboard/wellbeing-garden'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { MoodChart } from '@/components/dashboard/mood-chart'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { NotificationsPopover } from '@/components/profile/notifications-popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PenLine, Loader2, Sparkles, Shield, Leaf, Lock, Heart, CheckCircle2, Volume2, VolumeX } from 'lucide-react'
import { useCalmMode } from '@/lib/context/calm-mode-context'
import type { DiaryEntry, WellbeingStats } from '@/lib/types'
import { SensoryAudio, type ASMRSoundType } from '@/lib/services/sensory-audio'
import { FLOWERS } from '@/lib/flowers'

// Dynamic Stats Calculator based on real Postgres entries
const calculateDynamicStats = (entries: DiaryEntry[]): WellbeingStats => {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      averageSentiment: 0,
      moodTrend: 'stable',
      commonTriggers: [],
      weeklyMoodData: [],
    }
  }

  // 1. Average sentiment conversion (positive=5, neutral=3, negative=1)
  const scores = entries.map((e) => {
    if (e.analysis?.sentiment === 'positive') return 5
    if (e.analysis?.sentiment === 'neutral') return 3
    return 1
  })
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  // Convert 1-5 score to percentage
  const averageSentiment = Math.round(((avgScore - 1) / 4) * 100)

  // 2. Trajector trend
  let moodTrend: 'improving' | 'stable' | 'declining' = 'stable'
  if (scores.length >= 2) {
    const mid = Math.ceil(scores.length / 2)
    const latestAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid
    const olderAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid)
    
    if (latestAvg > olderAvg + 0.3) moodTrend = 'improving'
    else if (latestAvg < olderAvg - 0.3) moodTrend = 'declining'
  }

  // 3. Collect sensory triggers
  const triggerMap: Record<string, number> = {}
  entries.forEach((e) => {
    (e.sensoryTags || []).forEach((tag) => {
      triggerMap[tag] = (triggerMap[tag] || 0) + 1
    })
  })
  const commonTriggers = Object.entries(triggerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag as any)

  // 4. Group last 7 items chronologically for the garden and mood trend chart
  const weeklyMoodData = [...entries]
    .slice(0, 7)
    .reverse()
    .map((e) => ({
      date: e.createdAt,
      sentiment: e.analysis?.sentiment || 'neutral',
      riskLevel: e.analysis?.riskLevel || 'low',
      energyLevel: e.energyLevel,
    }))

  return {
    totalEntries: entries.length,
    averageSentiment,
    moodTrend,
    commonTriggers,
    weeklyMoodData,
  }
}

export default function DashboardPage() {
  const { calmMode, toggleCalmMode } = useCalmMode()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  // Auth state inputs
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  
  // Dashboard states
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [stats, setStats] = useState<WellbeingStats | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)

  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [clickSound, setClickSoundState] = useState<ASMRSoundType>('bubble')

  const [communityMembers, setCommunityMembers] = useState<any[]>([])

  const handleSendSupport = async (userId: string) => {
    SensoryAudio.playClick()
    // Optimistic UI update
    setCommunityMembers(prev => prev.map(m => {
      if (m.userId === userId) {
        return { ...m, supportCount: m.supportCount + 1 }
      }
      return m
    }))

    try {
      await fetch('/api/community/hug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      })
    } catch (err) {
      console.error('[Dashboard] Failed to send hug:', err)
    }
  }

  useEffect(() => {
    setIsMuted(SensoryAudio.isMuted())
    setVolume(SensoryAudio.getVolume())
    setClickSoundState(SensoryAudio.getClickSound())

    const handleAudioToggle = () => {
      setIsMuted(SensoryAudio.isMuted())
      setVolume(SensoryAudio.getVolume())
      setClickSoundState(SensoryAudio.getClickSound())
    }

    window.addEventListener('sensory_audio_toggle', handleAudioToggle)
    return () => {
      window.removeEventListener('sensory_audio_toggle', handleAudioToggle)
    }
  }, [])

  // Verify auth session on mount
  useEffect(() => {
    const checkAuthCookie = () => {
      const hasUserCookie = document.cookie
        .split(';')
        .some((item) => item.trim().startsWith('session_username='))
      
      setIsAuthenticated(hasUserCookie)
      if (!hasUserCookie) {
        setDashboardLoading(false)
      }
    }
    
    checkAuthCookie()
  }, [])

  // Fetch real data when authenticated
  useEffect(() => {
    if (isAuthenticated === true) {
      const loadDiaryData = async () => {
        try {
          const res = await fetch('/api/diary')
          if (!res.ok) throw new Error('Não foi possível carregar os registros.')
          
          const data = await res.json()
          const loadedEntries = data.entries || []
          setEntries(loadedEntries)
          setStats(calculateDynamicStats(loadedEntries))
        } catch (e) {
          console.error('[Dashboard] Fetch error:', e)
        } finally {
          setDashboardLoading(false)
        }
      }

      const loadCommunityFeed = async () => {
        try {
          const res = await fetch('/api/community')
          if (res.ok) {
            const data = await res.json()
            const realMembers = data.feed || []
            
            setCommunityMembers(realMembers)
          }
        } catch (err) {
          console.error('[Dashboard] Community fetch error:', err)
        }
      }

      loadDiaryData()
      loadCommunityFeed()
    }
  }, [isAuthenticated])

  // Handles signup & login submission
  const handleAuthSubmit = async (type: 'login' | 'signup') => {
    if (!username.trim() || !password) {
      setAuthError('Por favor, preencha todos os campos.')
      return
    }

    setAuthError('')
    setAuthSuccess('')
    setAuthLoading(true)

    try {
      const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao processar o seu pedido.')
      }

      setAuthSuccess(type === 'login' ? 'Autenticado com sucesso!' : 'Conta criada com sucesso!')
      
      // Delay slightly for pleasant feedback
      setTimeout(() => {
        setIsAuthenticated(true)
        setDashboardLoading(true)
      }, 800)
    } catch (err: any) {
      setAuthError(err.message || 'Erro inesperado. Tente novamente.')
    } finally {
      setAuthLoading(false)
    }
  }

  // 1. Loading screen
  if (isAuthenticated === null || (isAuthenticated === true && dashboardLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Carregando o seu jardim emocional...</p>
      </div>
    )
  }

  // 2. Authentication panel (Zen & Autism-friendly Layout)
  if (isAuthenticated === false) {
    return (
      <div className="flex flex-col min-h-screen bg-background justify-between">
        {/* Floating Zen Mode switch at landing top-right */}
        <header className="flex justify-between items-center p-6 max-w-6xl w-full mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">&#127804;</span>
            <span className="font-bold text-lg text-foreground tracking-tight">sentimentAU</span>
          </div>
          
          <button 
            onClick={() => {
              SensoryAudio.play('bubble')
              toggleCalmMode()
            }}
            className={`px-4 py-2 text-sm font-medium rounded-full cursor-pointer border transition-all duration-300 ${
              calmMode 
                ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                : 'bg-card border-border text-foreground hover:bg-muted'
            }`}
          >
            {calmMode ? '🌿 Modo Calmo: Ativado' : '✨ Modo Calmo: Desativado'}
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="border-border/60 shadow-md bg-card">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-2">
                  <span className="text-2xl">&#128522;</span>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Seu Espaço Seguro</CardTitle>
                <CardDescription className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  Um diário emocional inteligente, minimalista e desenhado especialmente para abraçar o espectro autista.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid grid-cols-2 rounded-xl mb-6 bg-muted p-1">
                    <TabsTrigger 
                      onClick={() => SensoryAudio.play('bubble')}
                      value="login" 
                      className="rounded-lg py-2 font-medium text-sm data-[state=active]:bg-card cursor-pointer"
                    >
                      Entrar
                    </TabsTrigger>
                    <TabsTrigger 
                      onClick={() => SensoryAudio.play('bubble')}
                      value="signup" 
                      className="rounded-lg py-2 font-medium text-sm data-[state=active]:bg-card cursor-pointer"
                    >
                      Criar Conta
                    </TabsTrigger>
                  </TabsList>

                  {/* Errors & Success alert */}
                  {authError && (
                    <div className="p-3 mb-4 rounded-xl border border-red-200/50 bg-red-50 text-red-700 text-xs font-medium leading-relaxed">
                      ⚠️ {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-3 mb-4 rounded-xl border border-green-200/50 bg-green-50 text-green-700 text-xs font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{authSuccess}</span>
                    </div>
                  )}

                  {/* LOGIN FORM */}
                  <TabsContent value="login" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username" className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5" /> Nome de Usuário
                      </Label>
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="ex: joao123"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="rounded-xl border-border bg-input py-2.5"
                        disabled={authLoading}
                      />
                      <p className="text-[10px] text-muted-foreground">Insira o seu nome de usuário cadastrado.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Senha
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded-xl border-border bg-input py-2.5"
                        disabled={authLoading}
                      />
                    </div>

                    <Button
                      onClick={() => {
                        SensoryAudio.play('bubble')
                        handleAuthSubmit('login')
                      }}
                      className="w-full py-2.5 rounded-xl font-semibold bg-primary hover:bg-primary/95 text-primary-foreground mt-4 shadow-sm cursor-pointer"
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Entrando...
                        </>
                      ) : (
                        'Entrar no Meu Diário'
                      )}
                    </Button>
                  </TabsContent>

                  {/* SIGNUP FORM */}
                  <TabsContent value="signup" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username" className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5" /> Nome de Usuário
                      </Label>
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="ex: joao123"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="rounded-xl border-border bg-input py-2.5"
                        disabled={authLoading}
                      />
                      <p className="text-[10px] text-muted-foreground">Escolha um nome simples sem espaços (ex: marta_silva).</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Senha
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Crie uma senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded-xl border-border bg-input py-2.5"
                        disabled={authLoading}
                      />
                      <p className="text-[10px] text-muted-foreground">Escolha uma senha com pelo menos 4 letras ou números.</p>
                    </div>

                    <Button
                      onClick={() => {
                        SensoryAudio.play('bubble')
                        handleAuthSubmit('signup')
                      }}
                      className="w-full py-2.5 rounded-xl font-semibold bg-primary hover:bg-primary/95 text-primary-foreground mt-4 shadow-sm cursor-pointer"
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Criando conta...
                        </>
                      ) : (
                        'Criar a Minha Conta'
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="mt-6 text-center text-xs text-muted-foreground flex justify-center items-center gap-1 bg-card/40 py-2.5 px-4 rounded-xl border border-border/20">
              <Shield className="w-3.5 h-3.5 text-secondary" />
              <span>O seu diário é guardado de forma cifrada e segura.</span>
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/25">
          <span>&copy; 2026 sentimentAU. Desenvolvido para alívio emocional e apoio neurodivergente.</span>
        </footer>
      </div>
    )
  }

  // 3. Dashboard page with real dynamic records
  return (
    <AppLayout>
      <div className={cn(
        "p-4 lg:p-8 space-y-6 min-h-screen transition-colors duration-500",
        "bg-background"
      )}>
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">&#127804;</span>
              <h1 className="text-2xl font-bold text-foreground">Seu Painel</h1>
            </div>
            <p className="text-muted-foreground mt-1">Como você está se sentindo esta semana?</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Modo Calmo Trigger */}
            <button 
              onClick={() => {
                SensoryAudio.play('bubble')
                toggleCalmMode()
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer border transition-all duration-300 ${
                calmMode 
                  ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              {calmMode ? '🌿 Modo Calmo: ATIVADO' : '✨ Modo Calmo: DESATIVADO'}
            </button>
            
            <div className="flex items-center">
              <NotificationsPopover />
            </div>
          </div>
        </div>

        {/* Dynamic Responsive Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* Main Dashboard Column */}
          <div className="xl:col-span-3 space-y-6">
            {entries.length === 0 ? (
              <div className="text-center py-12 px-6 max-w-xl mx-auto rounded-3xl border border-dashed border-border bg-card shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-full bg-secondary/30 flex items-center justify-center mx-auto text-3xl">
                  🌱
                </div>
                <h2 className="text-lg font-bold text-foreground">Seu Jardim Emocional está pronto!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Bem-vindo ao sentimentAU! Você ainda não possui nenhum registro emocional salvo no seu histórico. 
                  Crie o seu primeiro diário para que possamos analisar seu estado emocional, te dar dicas práticas de autorregulação e fazer seu jardim florescer!
                </p>
                <div className="pt-2">
                  <Link href="/novo-registo">
                    <Button 
                      onClick={() => SensoryAudio.play('bubble')}
                      className="gap-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm"
                    >
                      <PenLine className="w-4.5 h-4.5 shrink-0" /> Escrever Primeiro Registro
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Dynamic Stats Grid */}
                {stats && <StatsGrid stats={stats} />}

                {/* Wellbeing Garden Map */}
                {stats && <WellbeingGarden data={stats.weeklyMoodData} />}

                {/* Mood Charts based on active entries */}
                <MoodChart entries={entries} />
              </>
            )}

            {/* Painel de Apoio da Comunidade */}
            <Card className="bg-card border-0 shadow-sm rounded-3xl p-6 space-y-4">
              <CardHeader className="p-0 pb-1">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <span className="text-lg">🌈</span> Painel de Apoio da Comunidade
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Membros da comunidade sentimentAU compartilhando sentimentos de forma acolhedora. Envie um abraço tátil!
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {communityMembers.map((member) => (
                    <Link 
                      href={`/perfil/${member.userId}`}
                      key={`${member.userId}-${member.createdAt}`}
                      className="p-4 rounded-2xl bg-muted border border-border flex flex-col justify-between space-y-3 hover:shadow-md transition-all hover:bg-card duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${member.avatarBg} shrink-0 overflow-hidden`}>
                          {FLOWERS[member.florAvatarId]?.emoji || '🌱'}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm truncate">{member.username || 'Usuário Anônimo'}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              member.sentiment === 'positive' 
                                ? 'bg-green-100 text-green-700'
                                : member.sentiment === 'negative'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {member.emotion}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed italic pr-2">
                            "{member.statusText}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-dashed border-border">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          🟢 Online hoje
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleSendSupport(member.userId)
                          }}
                          className="flex items-center gap-1.5 py-1 px-3 rounded-xl bg-[#eef2f6] hover:bg-primary/10 hover:text-primary transition-all text-xs font-bold text-[#5c6e8c] cursor-pointer"
                        >
                          <span>🫂 Enviar Abraço</span>
                          <span className="bg-card/90 text-primary font-extrabold px-1.5 py-0.5 rounded-md text-[9px] shadow-sm">
                            {member.supportCount}
                          </span>
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Settings Column (Avatar Upload & ASMR Sound Test) */}
          <div className="space-y-6 xl:sticky xl:top-24">
            <AvatarUpload />

            {/* ASMR Sound Panel Card */}
            <Card className="bg-card border-0 shadow-sm rounded-3xl p-6 space-y-4">
              <CardHeader className="p-0 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    Central de Sons ASMR
                  </CardTitle>
                  <button
                    onClick={() => {
                      const nextMuted = !isMuted
                      SensoryAudio.setMuted(nextMuted)
                      setIsMuted(nextMuted)
                      if (!nextMuted) {
                        setTimeout(() => SensoryAudio.play('bubble'), 50)
                      }
                      window.dispatchEvent(new Event('sensory_audio_toggle'))
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isMuted 
                        ? 'bg-red-50 hover:bg-red-100 text-red-500' 
                        : 'bg-[#eef2f6] hover:bg-[#dfe5eb] text-primary'
                    }`}
                    title={isMuted ? 'Ativar som' : 'Mutar som'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Controle a intensidade e personalize os sons táteis projetados para autorregulação e conforto.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0 space-y-4">
                {/* Volume Slider Control */}
                <div className="bg-muted p-3.5 rounded-2xl border border-border space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1">🔊 Volume Geral</span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                      const newVol = parseFloat(e.target.value)
                      setVolume(newVol)
                      SensoryAudio.setVolume(newVol)
                      if (newVol > 0 && isMuted) {
                        SensoryAudio.setMuted(false)
                        setIsMuted(false)
                      }
                    }}
                    className="w-full h-1.5 bg-[#eef2f6] rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Click Sound Selector */}
                <div className="bg-muted p-3.5 rounded-2xl border border-border space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1">🖱️ Som do Clique Padrão</span>
                  </div>
                  <select
                    value={clickSound}
                    onChange={(e) => {
                      const sound = e.target.value as ASMRSoundType
                      setClickSoundState(sound)
                      SensoryAudio.setClickSound(sound)
                      SensoryAudio.play(sound)
                    }}
                    className="w-full text-xs bg-card border border-border rounded-xl p-2 text-foreground outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer font-medium"
                  >
                    <optgroup label="Sons da Natureza">
                      <option value="water-drop">💧 Gota d'Água</option>
                      <option value="bubble">🫧 Bolha de Sabão</option>
                      <option value="chime">🔔 Sino de Cristal</option>
                    </optgroup>
                    <optgroup label="Sons do Minecraft">
                      <option value="mc-xp">🟢 Esfera de XP</option>
                      <option value="mc-levelup">👑 Melodia de Nível</option>
                      <option value="mc-anvil">⚙️ Ressonância de Bigorna</option>
                    </optgroup>
                  </select>
                </div>

                {/* Natural ASMR Synth Section */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground block">Sons da Natureza</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        SensoryAudio.play('water-drop')
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#d4e8f9] hover:bg-[#b8dafa] transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#6b8fd4]/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        💧
                      </div>
                      <span className="text-[10px] font-bold text-foreground mt-1.5">Gota</span>
                    </button>

                    <button
                      onClick={() => {
                        SensoryAudio.play('bubble')
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#c4f5f0] hover:bg-[#a6efe7] transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#4ecdc4]/20 flex items-center justify-center text-[#4ecdc4] group-hover:scale-110 transition-transform">
                        🫧
                      </div>
                      <span className="text-[10px] font-bold text-foreground mt-1.5">Bolha</span>
                    </button>

                    <button
                      onClick={() => {
                        SensoryAudio.play('chime')
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#fcecc4] hover:bg-[#fae2a5] transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 flex items-center justify-center text-[#f5a623] group-hover:scale-110 transition-transform">
                        🔔
                      </div>
                      <span className="text-[10px] font-bold text-foreground mt-1.5">Sino</span>
                    </button>
                  </div>
                </div>

                {/* Minecraft Retro ASMR Section */}
                <div className="space-y-2 pt-1 border-t border-border">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    🕹️ Sons do Minecraft (ASMR Retro)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        SensoryAudio.play('mc-xp')
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#e8f5e9] hover:bg-[#c8e6c9] border border-[#a5d6a7]/20 transition-all cursor-pointer group text-left"
                    >
                      <div className="w-7 h-7 rounded-xl bg-[#2e7d32]/10 flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                        🟢
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#1b5e20]">Exp Orb</span>
                        <span className="text-[8px] text-[#4caf50]">Chime Retro</span>
                      </div>
                    </button>


                    <button
                      onClick={() => {
                        SensoryAudio.play('mc-levelup')
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#fffde7] hover:bg-[#fff9c4] border border-[#fff59d]/20 transition-all cursor-pointer group text-left"
                    >
                      <div className="w-7 h-7 rounded-xl bg-[#f57f17]/10 flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                        👑
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#f57f17]">Level Up</span>
                        <span className="text-[8px] text-[#fbc02d]">Melodia</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        SensoryAudio.play('mc-anvil')
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#eceff1] hover:bg-[#cfd8dc] border border-[#b0bec5]/20 transition-all cursor-pointer group text-left"
                    >
                      <div className="w-7 h-7 rounded-xl bg-[#37474f]/10 flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                        ⚙️
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#37474f]">Bigorna</span>
                        <span className="text-[8px] text-[#607d8b]">Metálico</span>
                      </div>
                    </button>


                  </div>
                </div>

                <p className="text-[9px] text-[#8a9ab8] text-center italic mt-1 leading-normal">
                  Sons inspirados no projeto Minecraft-Sounds, otimizados para alívio tátil sensorial.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
