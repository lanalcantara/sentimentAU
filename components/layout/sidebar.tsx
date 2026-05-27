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

  useEffect(() => {
    loadProfile()
    
    // Listen to local avatar changes to keep sidebar synced dynamically
    const handleAvatarUpdate = () => {
      loadProfile()
    }
    
    window.addEventListener('avatar_updated', handleAvatarUpdate)
    return () => {
      window.removeEventListener('avatar_updated', handleAvatarUpdate)
    }
  }, [])

  const handleLinkClick = () => {
    SensoryAudio.play('bubble')
  }


  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#7ee8d0] text-slate-800 min-h-screen border-r border-border shadow-sm">
      {/* Top Absolute Title 'sentimentAU' */}
      <div className="px-7 pt-7 pb-2 flex items-center justify-between">
        <Link href="/" onClick={handleLinkClick} className="flex items-center gap-3 w-full">
          {/* Logo oficial em pixel art */}
          <img src="/sentimentau-logo.png" alt="sentimentAU Logo" className="w-9 h-9 rounded-xl shrink-0 object-contain" />
          <div className="truncate">
            <h1 className="font-extrabold text-lg tracking-wider text-slate-800 font-sans">sentimentAU</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase leading-none">Diário Emocional</p>
          </div>
        </Link>
      </div>

      {/* User Profile Block */}
      {username && (
        <div className="px-7 py-3">
          <div className="flex items-center gap-3 px-3 py-2 bg-[#69d9be] border border-[#59cbaf]/40 rounded-xl shadow-sm">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-border text-lg shadow-sm shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>{FLOWERS[florAvatar]?.emoji || '🌱'}</span>
              )}
            </div>
            <div className="truncate flex-1">
              <span className="text-[10px] text-[#2c7261] font-semibold block uppercase tracking-wider leading-none">Usuário</span>
              <span className="text-sm font-bold text-slate-800 capitalize truncate block mt-0.5">{username}</span>
            </div>
          </div>
        </div>
      )}

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
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-600',
                    'hover:bg-slate-200 hover:text-slate-800',
                    isActive && 'bg-[#f5c842] text-slate-900 font-semibold shadow-sm'
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

      {/* Reminder Card */}
      <div className="px-3 pb-4">
        <div className="bg-white border border-border shadow-sm rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#e85a6b] font-semibold mb-2">
            <Heart className="w-4 h-4 fill-[#e85a6b]" />
            <span>Lembrete</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Seus sentimentos são válidos. Registrar ajuda você a se conhecer melhor.
          </p>
        </div>
      </div>

      {/* Logout Section */}
      <div className="px-3 pb-6 border-t border-border pt-4">

        <button 
          onClick={async () => {
            handleLinkClick()
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/'
          }}
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-800 transition-colors w-full cursor-pointer rounded-xl hover:bg-slate-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Sair</span>
        </button>
      </div>
    </aside>
  )
}
