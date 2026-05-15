'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  PenLine, 
  History, 
  Lightbulb,
  LogOut,
  Heart
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/novo-registo', label: 'Novo Registo', icon: PenLine },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#1e2a4a] text-white min-h-screen">
      {/* Logo */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e85a6b] flex items-center justify-center">
            <span className="text-xl">&#128522;</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">sentimentAU</h1>
            <p className="text-xs text-white/60">Diário Emocional Inteligente</p>
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
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    'hover:bg-white/10',
                    isActive && 'bg-[#f5c842] text-[#1e2a4a] font-semibold'
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
        <div className="bg-[#2a3a5a] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#e85a6b] font-semibold mb-2">
            <Heart className="w-4 h-4 fill-[#e85a6b]" />
            <span>Lembrete</span>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Os teus sentimentos são válidos. Registar ajuda-te a conhecer-te melhor.
          </p>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white transition-colors w-full">
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
