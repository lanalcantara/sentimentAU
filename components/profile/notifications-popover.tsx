'use client'

import { useEffect, useState } from 'react'
import { Bell, Heart, UserPlus, Trash2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        if (res.ok) {
          setNotifications(data.notifications || [])
          setUnreadCount(data.notifications.filter((n: any) => !n.lido).length)
        }
      } catch (err) {
        console.error('Failed to load notifications', err)
      }
    }
    fetchNotifications()
    // A real app would use Supabase realtime subscriptions here
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      SensoryAudio.playClick()
      if (unreadCount > 0) {
        try {
          await fetch('/api/notifications', { method: 'PUT' })
          setUnreadCount(0)
        } catch (err) {
          console.error(err)
        }
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse border border-[#1e2a4a]" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2 rounded-2xl shadow-lg border-[#eaeef5]" align="end">
        <div className="p-4 border-b border-[#eaeef5] flex items-center justify-between bg-[#f8fafc] rounded-t-2xl">
          <h3 className="font-bold text-[#1e2a4a]">Notificações</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-[#e8f5e9] text-green-700 font-bold px-2 py-0.5 rounded-full">
              {unreadCount} novas
            </span>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#6a7a9a]">
              Seu jardim está tranquilo no momento.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 border-b border-[#eaeef5] last:border-0 hover:bg-[#f8fafc] transition-colors ${!n.lido ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {n.tipo === 'hug' ? (
                        <div className="w-8 h-8 rounded-full bg-[#fdf2f8] flex items-center justify-center">
                          <Heart className="w-4 h-4 text-[#db2777]" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#f0f9ff] flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-[#0284c7]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#1e2a4a] leading-snug">
                        {n.tipo === 'hug'
                          ? <span><strong>{n.remetente}</strong> enviou um <strong>abraço tátil</strong> para o seu jardim! 🫂</span>
                          : <span><strong>{n.remetente}</strong> começou a seguir o seu jardim! 🌱</span>
                        }
                      </p>
                      <p className="text-[10px] text-[#6a7a9a] mt-1 font-medium uppercase tracking-wider">
                        {formatDistanceToNow(new Date(n.data), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
