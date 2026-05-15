'use client'

import { Sidebar } from './sidebar'
import { MobileNav } from './mobile-nav'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
