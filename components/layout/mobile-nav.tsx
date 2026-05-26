'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  PenLine, 
  History, 
  Lightbulb,
  Menu,
  Heart,
  LogOut,
  User
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import { FLOWERS } from '@/lib/flowers'
import { NotificationsPopover } from '@/components/profile/notifications-popover'

const navItems = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/novo-registo', label: 'Novo Registro', icon: PenLine },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
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
      console.error('[MobileNav] Error loading profile:', err)
    }
  }

  useEffect(() => {
    loadProfile()
    
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
    <header className="lg:hidden sticky top-0 z-50 bg-[#14532d] text-white">
      <div className="flex items-center justify-between p-4">
        <Link href="/" onClick={handleLinkClick} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#e85a6b] flex items-center justify-center">
            <span className="text-lg">{FLOWERS[florAvatar]?.emoji || '🌱'}</span>
          </div>
          <span className="font-bold">sentimentAU</span>
        </Link>
 
        <div className="flex items-center gap-1">
          <NotificationsPopover />
          {/* Small Top Right Avatar preview on mobile header */}
          {username && (
            <div className="w-9 h-9 rounded-full bg-card/10 flex items-center justify-center border border-white/20 text-lg shadow-inner shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>{FLOWERS[florAvatar]?.emoji || '🌱'}</span>
              )}
            </div>
          )}

          <Sheet open={open} onOpenChange={(o) => {
            handleLinkClick()
            setOpen(o)
          }}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-card/10">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#14532d] text-white border-[#14532d] w-72 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-[#e85a6b] flex items-center justify-center">
                    <span className="text-lg">{FLOWERS[florAvatar]?.emoji || '🌱'}</span>
                  </div>
                  <div>
                    <span className="font-bold">sentimentAU</span>
                    <p className="text-xs text-white/60">Diário Emocional Inteligente</p>
                  </div>
                </div>

                <nav className="flex-1">
                  <ul className="space-y-1">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => {
                              handleLinkClick()
                              setOpen(false)
                            }}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                              'hover:bg-card/10',
                              isActive && 'bg-[#f5c842] text-foreground font-semibold'
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
                <div className="mt-8">
                  <div className="bg-[#2a3a5a] rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[#e85a6b] font-semibold mb-2">
                      <Heart className="w-4 h-4 fill-[#e85a6b]" />
                      <span>Lembrete</span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Seus sentimentos são válidos. Registrar ajuda você a se conhecer melhor.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile & Logout at mobile sidebar bottom */}
              <div className="border-t border-[#2a3a5a] pt-4 space-y-2">
                {username && (
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-10 h-10 rounded-full bg-card/10 flex items-center justify-center border border-white/20 text-xl shadow-inner shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span>{FLOWERS[florAvatar]?.emoji || '🌱'}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-white/90 capitalize truncate">{username}</span>
                  </div>
                )}

                <button 
                  onClick={async () => {
                    handleLinkClick()
                    setOpen(false)
                    await fetch('/api/auth/logout', { method: 'POST' })
                    window.location.href = '/'
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white transition-colors w-full cursor-pointer rounded-xl hover:bg-card/5"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Sair</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
