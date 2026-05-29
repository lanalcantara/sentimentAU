'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  PenLine, 
  History,
  Lightbulb,
  LogOut,
  Heart,
  User,
  Leaf
} from 'lucide-react'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { FLOWERS } from '@/lib/flowers'
import { NotificationsPopover } from '@/components/profile/notifications-popover'

const navItems = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/novo-registo', label: 'Novo Registro', icon: PenLine },
  { href: '/colecao', label: 'Coleção Botânica', icon: Leaf },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
]

export function Sidebar() {
  const pathname = usePathname()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [florAvatar, setFlorAvatar] = useState<string>('semente')
  const [username, setUsername] = useState<string>('')
  const [streak, setStreak] = useState<number>(0)
  const [currentMood, setCurrentMood] = useState<string>('Neutro')
  const [breathingActive, setBreathingActive] = useState(false)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('inhale')
  const [breathTime, setBreathTime] = useState(4)

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (res.ok && data.user) {
        setAvatarUrl(data.user.avatar_url || null)
        setFlorAvatar(data.user.flor_avatar_atual || 'semente')
        setUsername(data.user.username)
      }
    } catch (err) {
      console.error('[Sidebar] Error loading profile:', err)
    }
  }

  const loadDiaryStats = async () => {
    try {
      const res = await fetch('/api/diary')
      const data = await res.json()
      if (res.ok && data.entries) {
        const entries = data.entries || []
        // Calculate streak
        const calculateStreak = (entriesList: any[]): number => {
          if (entriesList.length === 0) return 0
          const dates = entriesList
            .map(e => {
              const d = new Date(e.createdAt || e.created_at)
              d.setHours(0, 0, 0, 0)
              return d.getTime()
            })
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort((a, b) => b - a)
            
          let s = 0
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
              s++
              currentExpected -= 24 * 60 * 60 * 1000
            } else {
              break
            }
          }
          return s
        }
        setStreak(calculateStreak(entries))

        // Get latest mood
        if (entries.length > 0) {
          const latest = entries[0]
          let emotionLabel = 'Neutro'
          if (latest.analysis?.sentiment === 'positive') emotionLabel = 'Feliz'
          else if (latest.analysis?.sentiment === 'negative') emotionLabel = 'Frustrado'
          
          if (latest.emotions && latest.emotions.length > 0) {
            const emotionMap: Record<string, string> = {
              happy: 'Feliz',
              calm: 'Calmo',
              excited: 'Animado',
              content: 'Satisfeito',
              sad: 'Triste',
              anxious: 'Preocupado',
              frustrated: 'Irritado',
              overwhelmed: 'Sobrecarregado',
              tired: 'Cansado',
              confused: 'Confuso'
            }
            emotionLabel = emotionMap[latest.emotions[0]] || emotionLabel
          }
          setCurrentMood(emotionLabel)
        }
      }
    } catch (err) {
      console.error('[Sidebar] Error loading diary stats:', err)
    }
  }

  // Box Breathing loop
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathTime((prev) => {
          if (prev <= 1) {
            setBreathPhase((current) => {
              let nextPhase: typeof breathPhase = 'inhale'
              if (current === 'inhale') {
                nextPhase = 'hold-in'
                SensoryAudio.play('chime')
              } else if (current === 'hold-in') {
                nextPhase = 'exhale'
                SensoryAudio.play('water-drop')
              } else if (current === 'exhale') {
                nextPhase = 'hold-out'
                SensoryAudio.play('chime')
              } else if (current === 'hold-out') {
                nextPhase = 'inhale'
                SensoryAudio.play('bubble')
              }
              return nextPhase
            })
            return 4
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [breathingActive])

  useEffect(() => {
    loadProfile()
    loadDiaryStats()
    
    const handleAvatarUpdate = () => {
      loadProfile()
    }

    const handleDiaryUpdate = () => {
      loadDiaryStats()
    }
    
    window.addEventListener('avatar_updated', handleAvatarUpdate)
    window.addEventListener('diary_updated', handleDiaryUpdate)
    return () => {
      window.removeEventListener('avatar_updated', handleAvatarUpdate)
      window.removeEventListener('diary_updated', handleDiaryUpdate)
    }
  }, [])

  const handleLinkClick = () => {
    SensoryAudio.playClick()
  }


  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground min-h-screen border-r border-sidebar-border shadow-sm transition-all duration-300">
      {/* Top Absolute Title 'sentimentAU' */}
      <div className="px-7 pt-7 pb-2 flex items-center justify-between">
        <Link href="/" onClick={handleLinkClick} className="flex items-center gap-3 w-full">
          {/* Logo oficial em pixel art */}
          <img src="/sentimentau-logo.png" alt="sentimentAU Logo" className="w-9 h-9 rounded-full shrink-0 object-cover border border-slate-700/10 bg-white shadow-sm" />
          <div className="truncate">
            <h1 className="font-extrabold text-lg tracking-wider text-sidebar-foreground">sentimentAU</h1>
            <p className="text-[10px] text-sidebar-foreground/60 font-medium tracking-wide uppercase leading-none">Diário Emocional</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    isActive && 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Dynamic Status & SOS Calma Bottom Section */}
      <div className="px-3 pb-4 flex flex-col gap-3">
        {/* Bloco 1: Meu Status Atual */}
        <div className="bg-[#1b3024] text-white border border-[#1b3024]/10 rounded-2xl p-3.5 shadow-sm calm-widget-card transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <div className="min-w-0">
              <p className="text-[10px] text-white/60 calm-widget-label uppercase font-bold tracking-wider leading-none">Humor do Dia</p>
              <p className="font-bold text-sm text-white mt-1.5 leading-none">Status: {currentMood}</p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Contador de Streak */}
        <div className="bg-[#1b3024] text-white border border-[#1b3024]/10 rounded-2xl p-3.5 shadow-sm calm-widget-card transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <div className="min-w-0">
              <p className="text-[10px] text-white/60 calm-widget-label uppercase font-bold tracking-wider leading-none">Minha Jornada</p>
              <p className="font-semibold text-xs text-white mt-1.5 leading-snug">
                {streak === 0 
                  ? 'Comece seu jardim hoje!' 
                  : `${streak} ${streak === 1 ? 'dia cuidando do seu jardim' : 'dias cuidando do seu jardim'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 3: SOS Calma button */}
        <Dialog onOpenChange={(isOpen) => {
          if (!isOpen) {
            setBreathingActive(false)
            setBreathPhase('inhale')
            setBreathTime(4)
          }
        }}>
          <DialogTrigger asChild>
            <button
              onClick={() => SensoryAudio.playClick()}
              className="w-full py-3 rounded-2xl bg-[#e85a6b] hover:bg-[#d64b5c] active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>SOS Calma</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card rounded-3xl border border-border p-6 shadow-xl text-center flex flex-col items-center">
            <DialogHeader className="w-full text-center pb-2">
              <DialogTitle className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                🧘 Exercício de Respiração Guiada
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Box Breathing: Regule a sua respiração para acalmar a mente e o corpo.
              </DialogDescription>
            </DialogHeader>

            {/* Visual breathing guide */}
            <div className="my-8 flex flex-col items-center justify-center h-44 w-full relative">
              <motion.div
                animate={{
                  scale: breathPhase === 'inhale' || breathPhase === 'hold-in' ? 1.45 : 0.85,
                  backgroundColor: breathPhase === 'inhale' ? '#8bae96' : breathPhase === 'hold-in' ? '#d9f99d' : breathPhase === 'exhale' ? '#93c5fd' : '#cbd5e1'
                }}
                transition={{ duration: 4, ease: 'easeInOut' }}
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg border border-white/10"
              >
                <span className="text-2xl font-extrabold text-[#1A2421]">{breathTime}s</span>
              </motion.div>

              {/* Breathing Prompt */}
              <div className="absolute bottom-[-16px] left-0 right-0 text-center">
                <span className="font-extrabold text-base text-foreground tracking-wide uppercase">
                  {breathPhase === 'inhale' && '📥 Respire...'}
                  {breathPhase === 'hold-in' && '🛑 Segure o ar...'}
                  {breathPhase === 'exhale' && '📤 Solte o ar...'}
                  {breathPhase === 'hold-out' && '🛑 Segure sem ar...'}
                </span>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => {
                  SensoryAudio.playClick()
                  setBreathingActive(!breathingActive)
                }}
                variant={breathingActive ? "outline" : "default"}
                className="rounded-xl px-6 py-2 font-bold cursor-pointer"
              >
                {breathingActive ? 'Pausar' : 'Começar'}
              </Button>
              <Button
                onClick={() => {
                  SensoryAudio.playClick()
                  setBreathingActive(false)
                  setBreathPhase('inhale')
                  setBreathTime(4)
                }}
                variant="ghost"
                className="rounded-xl px-4 cursor-pointer"
              >
                Reiniciar
              </Button>
            </div>

            {/* Mini sound center */}
            <div className="w-full border-t border-border mt-6 pt-4 space-y-2.5">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">Central de Sons Rápidos</h5>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => SensoryAudio.play('chime')}
                  className="py-2 text-[10px] font-bold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                >
                  🔔 Sino
                </button>
                <button
                  onClick={() => SensoryAudio.play('water-drop')}
                  className="py-2 text-[10px] font-bold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                >
                  💧 Gotas
                </button>
                <button
                  onClick={() => SensoryAudio.play('bubble')}
                  className="py-2 text-[10px] font-bold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                >
                  🫧 Bolhas
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Logout Section */}
      <div className="px-3 pb-6 border-t border-sidebar-border pt-4">

        <button 
          onClick={async () => {
            handleLinkClick()
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/'
          }}
          className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/75 hover:text-sidebar-foreground transition-colors w-full cursor-pointer rounded-xl hover:bg-sidebar-accent"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Sair</span>
        </button>
      </div>
    </aside>
  )
}
