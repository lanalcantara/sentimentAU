'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  PenLine, 
  History, 
  BarChart3, 
  Settings,
  Sparkles
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/novo-registo', label: 'Novo Registo', icon: PenLine },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/definicoes', label: 'Definições', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight">sentimentAU</h1>
            <p className="text-xs text-sidebar-foreground/60">Diário Emocional</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    'hover:bg-sidebar-accent',
                    isActive && 'bg-sidebar-primary text-sidebar-primary-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-xl p-4">
          <p className="text-sm text-sidebar-foreground/80 mb-2">
            Como te sentes hoje?
          </p>
          <Link
            href="/novo-registo"
            className="inline-flex items-center gap-2 text-sm font-medium text-sidebar-primary hover:underline"
          >
            <PenLine className="w-4 h-4" />
            Criar registo
          </Link>
        </div>
      </div>
    </aside>
  )
}
