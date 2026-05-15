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
  LogOut
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/novo-registo', label: 'Novo Registo', icon: PenLine },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-[#1e2a4a] text-white">
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#e85a6b] flex items-center justify-center">
            <span className="text-lg">&#128522;</span>
          </div>
          <span className="font-bold">sentimentAU</span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="w-5 h-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1e2a4a] text-white border-[#2a3a5a] w-72">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-[#e85a6b] flex items-center justify-center">
                <span className="text-lg">&#128522;</span>
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
                        onClick={() => setOpen(false)}
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
            <div className="mt-8">
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
            <button className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white transition-colors w-full mt-4">
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
