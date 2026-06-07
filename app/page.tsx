'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { WellbeingGarden } from '@/components/dashboard/wellbeing-garden'
import { GardenRPG } from '@/components/dashboard/garden-rpg'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { MoodChart } from '@/components/dashboard/mood-chart'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { NotificationsPopover } from '@/components/profile/notifications-popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PenLine, Loader2, Sparkles, Shield, Leaf, Lock, Heart, CheckCircle2, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalmMode } from '@/lib/context/calm-mode-context'
import type { DiaryEntry, WellbeingStats } from '@/lib/types'
import { SensoryAudio, type ASMRSoundType } from '@/lib/services/sensory-audio'
import { FLOWERS } from '@/lib/flowers'
import { toast } from 'sonner'

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

const calculateStreak = (entries: DiaryEntry[]): number => {
  if (entries.length === 0) return 0
  
  const dates = entries
    .map(e => {
      const d = new Date(e.createdAt)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => b - a)
    
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  
  if (dates[0] !== today.getTime() && dates[0] !== yesterday.getTime()) {
    return 0
  }
  
  let currentExpected = dates[0]
  for (let i = 0; i < dates.length; i++) {
    if (dates[i] === currentExpected) {
      streak++
      const nextExpected = new Date(currentExpected)
      nextExpected.setDate(nextExpected.getDate() - 1)
      currentExpected = nextExpected.getTime()
    } else {
      break
    }
  }
  return streak
}

export default function DashboardPage() {
  const { calmMode, toggleCalmMode } = useCalmMode()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  // Auth state inputs
  const [viewMode, setViewMode] = useState<'auth' | 'otp' | 'forgot' | 'reset'>('auth')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  
  const [otpCode, setOtpCode] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [tempUserId, setTempUserId] = useState('')

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
  const [communityIndex, setCommunityIndex] = useState(0)

  const handleNextCommunity = () => {
    if (communityIndex + 4 < communityMembers.length) {
      SensoryAudio.playClick()
      setCommunityIndex(prev => prev + 1)
    }
  }

  const handlePrevCommunity = () => {
    if (communityIndex > 0) {
      SensoryAudio.playClick()
      setCommunityIndex(prev => prev - 1)
    }
  }

  const handleSendSupport = async (userId: string) => {
    SensoryAudio.playClick()
    // Optimistic UI update
    setCommunityMembers(prev => prev.map(m => {
      if (m.userId === userId) {
        return { ...m, supportCount: m.supportCount + 1, hasHugged: true }
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

  const triggerSelfRegulationUnlock = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerSelfRegulation: true })
      })
      const data = await res.json()
      if (res.ok && data.unlockedFlower) {
        toast.success(`✨ Você conquistou uma nova flor por se autorregular num dia difícil: ${FLOWERS[data.unlockedFlower]?.label} ${FLOWERS[data.unlockedFlower]?.emoji}!`, {
          description: 'Ela foi adicionada ao seu Jardim do Bem-Estar.',
          duration: 6000
        })
        window.dispatchEvent(new Event('flower_unlocked'))
        window.dispatchEvent(new Event('avatar_updated'))
      }
    } catch (err) {
      console.error('Failed to trigger self-regulation:', err)
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
    if (type === 'signup') {
      if (!username.trim() || !email.trim() || !password) {
        setAuthError('Por favor, preencha todos os campos.')
        return
      }
      if (username.trim().length < 3) {
        setAuthError('O nome de usuário deve ter pelo menos 3 caracteres.')
        return
      }
      if (password.length < 6) {
        setAuthError('Para sua segurança, a senha deve ter pelo menos 6 caracteres.')
        return
      }
    } else {
      if (!username.trim() || !password) {
        setAuthError('Por favor, preencha todos os campos.')
        return
      }
    }

    setAuthError('')
    setAuthSuccess('')
    setAuthLoading(true)

    try {
      if (type === 'signup') {
        // 1. Check with our API first if username or email is already taken
        const checkRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), email: email.trim(), password, action: 'check' }),
        })
        const checkData = await checkRes.json()
        if (!checkRes.ok) {
          throw new Error(checkData.error || 'Erro ao validar nome de usuário ou e-mail.')
        }

        // 2. Call Supabase Auth signUp (no emailRedirectTo → forces OTP code, not magic link)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            // Leaving emailRedirectTo undefined so Supabase uses the
            // email template configured in the dashboard (must use {{ .Token }})
          },
        })

        if (signUpError) {
          throw new Error(signUpError.message)
        }

        if (!signUpData.user) {
          throw new Error('Não foi possível iniciar o cadastro. Tente novamente.')
        }

        setTempUserId(signUpData.user.id)
        setAuthSuccess('Código de verificação enviado para o seu e-mail! Insira-o abaixo.')
        setViewMode('otp')
      } else {
        // Login Flow
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Nome de usuário ou senha incorretos.')
        }

        // Sync client-side Supabase session if user has an email
        if (data.user?.email) {
          try {
            await supabase.auth.signInWithPassword({
              email: data.user.email,
              password,
            })
          } catch (e) {
            console.warn('[Login] Supabase client sync warning:', e)
          }
        }

        setAuthSuccess('Autenticado com sucesso!')
        
        setTimeout(() => {
          setIsAuthenticated(true)
          setDashboardLoading(true)
        }, 800)
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro inesperado. Tente novamente.')
    } finally {
      setAuthLoading(false)
    }
  }

  // Handles OTP Verification code submission
  const handleOtpSubmit = async () => {
    if (!otpCode.trim()) {
      setAuthError('Por favor, digite o código de verificação.')
      return
    }

    setAuthError('')
    setAuthSuccess('')
    setAuthLoading(true)

    try {
      const cleanCode = otpCode.replace(/\s+/g, '')
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleanCode,
        type: 'signup',
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error('Falha na autenticação do código OTP.')
      }

      // Finalize database insertion in sentiment_users and set session cookies
      const confirmRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      })

      const confirmData = await confirmRes.json()
      if (!confirmRes.ok) {
        throw new Error(confirmData.error || 'Erro ao finalizar o cadastro no banco de dados.')
      }

      setAuthSuccess('Conta criada e verificada com sucesso! Bem-vindo(a).')

      setTimeout(() => {
        setIsAuthenticated(true)
        setDashboardLoading(true)
      }, 800)
    } catch (err: any) {
      let errMsg = err.message || 'Erro inesperado. Tente novamente.'
      const lowerMsg = errMsg.toLowerCase()
      if (
        lowerMsg.includes('token has expired') ||
        lowerMsg.includes('invalid') ||
        lowerMsg.includes('expired') ||
        lowerMsg.includes('otp')
      ) {
        errMsg = 'O código digitado está incorreto ou expirou. Por favor, tente novamente com o código mais recente.'
      }
      setAuthError(errMsg)
    } finally {
      setAuthLoading(false)
    }
  }

  // Trigger password recovery email
  const handleForgotPassword = async () => {
    if (!recoveryEmail.trim()) {
      setAuthError('Por favor, insira o seu e-mail cadastrado.')
      return
    }

    setAuthError('')
    setAuthSuccess('')
    setAuthLoading(true)

    try {
      // Check if user with this email exists in sentiment_users first
      const checkEmailRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'check_only', email: recoveryEmail.trim(), password: 'none', action: 'check' }),
      })
      
      const checkEmailData = await checkEmailRes.json()
      // If NOT taken, it means it is NOT in our database! (because action: 'check' returns error if it is taken)
      if (checkEmailRes.ok) {
        throw new Error('Não encontramos nenhuma conta cadastrada com este e-mail.')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail.trim())
      if (error) {
        throw new Error(error.message)
      }

      setAuthSuccess('Código de recuperação enviado! Verifique seu e-mail e insira os dados abaixo.')
      setViewMode('reset')
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao enviar código de recuperação.')
    } finally {
      setAuthLoading(false)
    }
  }

  // Redefine password using token/OTP
  const handleResetPassword = async () => {
    if (!recoveryCode.trim() || !newPassword) {
      setAuthError('Por favor, preencha todos os campos.')
      return
    }

    if (newPassword.length < 6) {
      setAuthError('Para sua segurança, a nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    setAuthError('')
    setAuthSuccess('')
    setAuthLoading(true)

    try {
      // 1. Verify OTP with Supabase (cleaning spaces first)
      const cleanCode = recoveryCode.replace(/\s+/g, '')
      const { data, error } = await supabase.auth.verifyOtp({
        email: recoveryEmail.trim(),
        token: cleanCode,
        type: 'recovery',
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error('Código de recuperação inválido ou expirado.')
      }

      // 2. Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      // 3. Update hashed password in public.sentiment_users table
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          password: newPassword,
        }),
      })

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData.error || 'Erro ao atualizar a senha no banco de dados.')
      }

      setAuthSuccess('Senha redefinida com sucesso! Você já pode entrar com sua nova senha.')
      setViewMode('auth')
      setUsername('')
      setPassword('')
      setRecoveryEmail('')
      setRecoveryCode('')
      setNewPassword('')
    } catch (err: any) {
      let errMsg = err.message || 'Erro ao redefinir a senha.'
      const lowerMsg = errMsg.toLowerCase()
      if (
        lowerMsg.includes('token has expired') ||
        lowerMsg.includes('invalid') ||
        lowerMsg.includes('expired') ||
        lowerMsg.includes('otp')
      ) {
        errMsg = 'O código digitado está incorreto ou expirou. Por favor, tente novamente com o código mais recente.'
      }
      setAuthError(errMsg)
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
              SensoryAudio.playClick()
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
                <div className="mx-auto w-24 h-24 mb-4 flex items-center justify-center rounded-full overflow-hidden border border-border/40 bg-white shadow-sm">
                  <img src="/sentimentau-logo.png" alt="sentimentAU Logo" className="w-full h-full object-cover" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Seu Espaço Seguro</CardTitle>
                <CardDescription className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  Um diário emocional inteligente, minimalista e desenhado especialmente para abraçar o espectro autista.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
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

                {/* VIEW 1: LOGIN & SIGNUP TABS */}
                {viewMode === 'auth' && (
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid grid-cols-2 rounded-xl mb-6 bg-muted p-1">
                      <TabsTrigger 
                        onClick={() => SensoryAudio.playClick()}
                        value="login" 
                        className="rounded-lg py-2 font-medium text-sm data-[state=active]:bg-card cursor-pointer"
                      >
                        Entrar
                      </TabsTrigger>
                      <TabsTrigger 
                        onClick={() => SensoryAudio.playClick()}
                        value="signup" 
                        className="rounded-lg py-2 font-medium text-sm data-[state=active]:bg-card cursor-pointer"
                      >
                        Criar Conta
                      </TabsTrigger>
                    </TabsList>

                    {/* LOGIN TAB */}
                    <TabsContent value="login" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username" className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                          <Leaf className="w-3.5 h-3.5" /> Nome de Usuário ou E-mail
                        </Label>
                        <Input
                          id="login-username"
                          type="text"
                          placeholder="ex: joao123 ou joao@email.com"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="rounded-xl border-border bg-input py-2.5"
                          disabled={authLoading}
                        />
                        <p className="text-[10px] text-muted-foreground">Insira o seu nome de usuário ou e-mail cadastrado.</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="login-password" className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" /> Senha
                          </Label>
                          <button
                            type="button"
                            onClick={() => {
                              SensoryAudio.playClick()
                              setAuthError('')
                              setAuthSuccess('')
                              setViewMode('forgot')
                            }}
                            className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                          >
                            Esqueci minha senha
                          </button>
                        </div>
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
                          SensoryAudio.playClick()
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

                    {/* SIGNUP TAB */}
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
                        <Label htmlFor="signup-email" className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                          <Leaf className="w-3.5 h-3.5" /> E-mail
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="ex: marta@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="rounded-xl border-border bg-input py-2.5"
                          disabled={authLoading}
                        />
                        <p className="text-[10px] text-muted-foreground">E-mail obrigatório para validação da conta.</p>
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
                        <p className="text-[10px] text-muted-foreground">Escolha uma senha com pelo menos 6 letras ou números.</p>
                      </div>

                      <Button
                        onClick={() => {
                          SensoryAudio.playClick()
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
                )}

                {/* VIEW 2: OTP CODE VERIFICATION */}
                {viewMode === 'otp' && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-bold text-foreground">Confirmar Cadastro</h3>
                      <p className="text-xs text-muted-foreground">Insira o código de verificação enviado para o e-mail: <strong className="text-foreground">{email}</strong></p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otp-code" className="text-xs text-muted-foreground font-semibold">
                        Código de Verificação (OTP)
                      </Label>
                      <Input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        placeholder="••••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        className="rounded-xl border-border bg-input py-2.5 text-center font-mono tracking-[0.3em] text-xl font-bold"
                        disabled={authLoading}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        SensoryAudio.playClick()
                        handleOtpSubmit()
                      }}
                      className="w-full py-2.5 rounded-xl font-semibold bg-primary hover:bg-primary/95 text-primary-foreground mt-4 shadow-sm cursor-pointer"
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Verificando...
                        </>
                      ) : (
                        'Confirmar Código'
                      )}
                    </Button>
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          SensoryAudio.play('bubble')
                          setAuthError('')
                          setAuthSuccess('')
                          setOtpCode('')
                          setAuthLoading(true)
                          try {
                            const { error: resendError } = await supabase.auth.signUp({
                              email: email.trim(),
                              password: password,
                            })
                            if (resendError) throw new Error(resendError.message)
                            setAuthSuccess('Novo código enviado para o seu e-mail!')
                          } catch (err: any) {
                            setAuthError(err.message || 'Erro ao reenviar. Tente novamente.')
                          } finally {
                            setAuthLoading(false)
                          }
                        }}
                        disabled={authLoading}
                        className="text-xs text-primary hover:text-primary/80 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        🔄 Reenviar código
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          SensoryAudio.play('bubble')
                          setAuthError('')
                          setAuthSuccess('')
                          setOtpCode('')
                          setViewMode('auth')
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                      >
                        Voltar para Criar Conta
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW 3: FORGOT PASSWORD EMAIL REQUEST */}
                {viewMode === 'forgot' && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-bold text-foreground">Recuperação de Senha</h3>
                      <p className="text-xs text-muted-foreground">Insira seu e-mail cadastrado para enviarmos um código de redefinição.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-xs text-muted-foreground font-semibold">
                        E-mail Cadastrado
                      </Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="ex: marta@email.com"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="rounded-xl border-border bg-input py-2.5"
                        disabled={authLoading}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        SensoryAudio.playClick()
                        handleForgotPassword()
                      }}
                      className="w-full py-2.5 rounded-xl font-semibold bg-primary hover:bg-primary/95 text-primary-foreground mt-4 shadow-sm cursor-pointer"
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Enviando...
                        </>
                      ) : (
                        'Enviar Código de Recuperação'
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        SensoryAudio.playClick()
                        setAuthError('')
                        setAuthSuccess('')
                        setViewMode('auth')
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold w-full text-center block mt-2 cursor-pointer"
                    >
                      Voltar para o Login
                    </button>
                  </div>
                )}

                {/* VIEW 4: RESET PASSWORD REDEFINITION */}
                {viewMode === 'reset' && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-bold text-foreground">Redefinir sua Senha</h3>
                      <p className="text-xs text-muted-foreground">Insira o código de recuperação enviado para: <strong className="text-foreground">{recoveryEmail}</strong></p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reset-code" className="text-xs text-muted-foreground font-semibold">
                        Código de Recuperação (OTP)
                      </Label>
                      <Input
                        id="reset-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        placeholder="••••••••"
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        className="rounded-xl border-border bg-input py-2.5 text-center font-mono tracking-[0.3em] text-xl font-bold"
                        disabled={authLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-xs text-muted-foreground font-semibold">
                        Nova Senha
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Nova senha (min. 6 caracteres)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-xl border-border bg-input py-2.5"
                        disabled={authLoading}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        SensoryAudio.playClick()
                        handleResetPassword()
                      }}
                      className="w-full py-2.5 rounded-xl font-semibold bg-primary hover:bg-primary/95 text-primary-foreground mt-4 shadow-sm cursor-pointer"
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Redefinindo...
                        </>
                      ) : (
                        'Redefinir e Salvar Senha'
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        SensoryAudio.playClick()
                        setAuthError('')
                        setAuthSuccess('')
                        setViewMode('auth')
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold w-full text-center block mt-2 cursor-pointer"
                    >
                      Voltar para o Login
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 text-center text-xs text-muted-foreground flex justify-center items-center gap-1 bg-card/40 py-2.5 px-4 rounded-xl border border-border/20">
              <Shield className="w-3.5 h-3.5 text-secondary" />
              <span>Seu diário é guardado de forma criptografada e segura.</span>
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
          <div className="flex-1 flex justify-between items-center pr-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">&#127804;</span>
                <h1 className="text-2xl font-bold text-foreground">Seu Painel</h1>
              </div>
              <p className="text-muted-foreground mt-1">Como você está se sentindo esta semana?</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Modo Calmo Trigger */}
            <button 
              onClick={() => {
                SensoryAudio.playClick()
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
            
            {/* Bell popover: hidden on mobile, visible on desktop */}
            <div className="hidden lg:flex items-center">
              <NotificationsPopover />
            </div>
            
            {/* Novo Registro button: visible on mobile, hidden on desktop */}
            <Link 
              href="/novo-registo"
              onClick={() => {
                SensoryAudio.playClick()
              }}
              className="lg:hidden p-2.5 bg-[#f5c842] text-slate-900 border border-[#f5c842] text-xs font-bold rounded-xl cursor-pointer hover:bg-[#e5b832] flex items-center gap-1 shadow-sm transition-all duration-300 shrink-0"
              title="Novo Registro"
            >
              <span>✏️</span>
              <span className="text-[11px] font-bold">Novo Registro</span>
            </Link>
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
                      onClick={() => SensoryAudio.playClick()}
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
              </>
            )}

            {/* Botanical RPG Minigame */}
            <GardenRPG entriesCount={entries.length} streak={calculateStreak(entries)} />

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
                  {/* Carousel Controls */}
                  {communityMembers.length > 4 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevCommunity}
                        disabled={communityIndex === 0}
                        className="h-8 w-8 rounded-xl border-border bg-card hover:bg-muted text-foreground transition-all duration-300 disabled:opacity-50 cursor-pointer"
                        title="Anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextCommunity}
                        disabled={communityIndex + 4 >= communityMembers.length}
                        className="h-8 w-8 rounded-xl border-border bg-card hover:bg-muted text-foreground transition-all duration-300 disabled:opacity-50 cursor-pointer"
                        title="Próximo"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {communityMembers.length === 0 ? (
                  <div className="text-center py-10 px-4 rounded-2xl bg-muted/40 border border-dashed border-border/80 flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">🌱</span>
                    <h4 className="font-bold text-sm text-foreground">O jardim da comunidade está tranquilo</h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Nenhum membro compartilhou registros publicamente hoje. Seja o primeiro a compartilhar escrevendo no seu diário!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {communityMembers.slice(communityIndex, communityIndex + 4).map((member) => (
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
                            </div>
                            <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider community-sentiment-tag self-start ${
                              member.sentiment === 'positive' 
                                ? 'bg-green-100 text-green-700'
                                : member.sentiment === 'negative'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {member.emotion}
                            </span>
                            <p className="text-xs text-muted-foreground leading-relaxed italic pr-2 line-clamp-3">
                              "{member.statusText}"
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-border mt-auto">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              SensoryAudio.playClick()
                              window.location.href = `/perfil/${member.userId}`
                            }}
                            className="flex items-center justify-center gap-1 w-full py-1 px-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold cursor-pointer community-ver-jardim-button"
                          >
                            <Leaf className="w-3.5 h-3.5 mr-0.5" />
                            <span>Ver Jardim</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              if (!member.hasHugged) {
                                handleSendSupport(member.userId)
                              }
                            }}
                            disabled={member.hasHugged}
                            className={cn(
                              "community-support-button flex items-center justify-center gap-1.5 w-full py-1 px-2 rounded-xl transition-all text-xs font-bold cursor-pointer",
                              member.hasHugged
                                ? "bg-[#fce7f3] text-[#db2777] cursor-not-allowed opacity-80"
                                : "bg-[#eef2f6] hover:bg-primary/10 hover:text-primary text-[#5c6e8c]"
                            )}
                          >
                            <span>{member.hasHugged ? '🫂 Abraço' : '🫂 Enviar Abraço'}</span>
                            <span className={cn(
                              "community-support-count font-extrabold px-1.5 py-0.5 rounded-md text-[9px] shadow-sm",
                              member.hasHugged ? "bg-white text-[#db2777]" : "bg-card/90 text-primary"
                            )}>
                              {member.supportCount}
                            </span>
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Settings Column (Avatar Upload & ASMR Sound Test) */}
          <div className="space-y-6 xl:sticky xl:top-24">
            <AvatarUpload />

            {/* ASMR Sound Panel Card */}
            <Card className="right-column-card bg-card border-0 shadow-sm rounded-3xl p-6 space-y-4">
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
                         setTimeout(() => SensoryAudio.playClick(), 50)
                      }
                      window.dispatchEvent(new Event('sensory_audio_toggle'))
                    }}
                    className={`speaker-toggle-btn w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
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
                        triggerSelfRegulationUnlock()
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#d4e8f9] hover:bg-[#b8dafa] transition-all cursor-pointer group asmr-button"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#6b8fd4]/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        💧
                      </div>
                      <span className="text-[10px] font-bold text-foreground mt-1.5">Gota</span>
                    </button>

                    <button
                      onClick={() => {
                        SensoryAudio.play('bubble')
                        triggerSelfRegulationUnlock()
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#c4f5f0] hover:bg-[#a6efe7] transition-all cursor-pointer group asmr-button"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#4ecdc4]/20 flex items-center justify-center text-[#4ecdc4] group-hover:scale-110 transition-transform">
                        🫧
                      </div>
                      <span className="text-[10px] font-bold text-foreground mt-1.5">Bolha</span>
                    </button>

                    <button
                      onClick={() => {
                        SensoryAudio.play('chime')
                        triggerSelfRegulationUnlock()
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#fcecc4] hover:bg-[#fae2a5] transition-all cursor-pointer group asmr-button"
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
                        triggerSelfRegulationUnlock()
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#e8f5e9] hover:bg-[#c8e6c9] border border-[#a5d6a7]/20 transition-all cursor-pointer group text-left asmr-button"
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
                        triggerSelfRegulationUnlock()
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#fffde7] hover:bg-[#fff9c4] border border-[#fff59d]/20 transition-all cursor-pointer group text-left asmr-button"
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
                        triggerSelfRegulationUnlock()
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#eceff1] hover:bg-[#cfd8dc] border border-[#b0bec5]/20 transition-all cursor-pointer group text-left asmr-button"
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
