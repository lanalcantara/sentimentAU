'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Bell, Heart, UserPlus, Trash2, CloudRain, Droplets } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchNotifications = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Parse current user ID from cookie for the realtime filter
    const getCookieValue = (name: string): string | null => {
      const match = document.cookie
        .split(';')
        .find(c => c.trim().startsWith(`${name}=`))
      return match ? decodeURIComponent(match.split('=')[1].trim()) : null
    }
    const currentUserId = getCookieValue('session_user_id')

    if (currentUserId && supabase) {
      // Clean up any existing channel before creating a new one
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }

      // Subscribe to INSERT events on sentiment_notifications for this user
      const channel = supabase
        .channel(`notifs-${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sentiment_notifications',
            filter: `receiver_id=eq.${currentUserId}`,
          },
          (payload) => {
            // Play a sound and refresh immediately
            SensoryAudio.play('chime')
            fetchNotifications()
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] Notifications channel subscribed for user:', currentUserId)
          }
        })

      channelRef.current = channel
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchNotifications])

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      SensoryAudio.playClick()
      if (unreadCount > 0) {
        try {
          await fetch('/api/notifications', { method: 'PUT' })
          setUnreadCount(0)
          setNotifications(prev => prev.map(n => ({ ...n, lido: true })))
        } catch (err) {
          console.error(err)
        }
      }
    }
  }

  const getNotifIcon = (tipo: string) => {
    if (tipo === 'hug' || tipo === 'abraco' || tipo === 'abraco_tatil') {
      return (
        <div className="w-8 h-8 rounded-full bg-[#fdf2f8] flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4 text-[#db2777]" />
        </div>
      )
    }
    if (tipo === 'regar' || tipo === 'water') {
      return (
        <div className="w-8 h-8 rounded-full bg-[#e0f2fe] flex items-center justify-center shrink-0">
          <Droplets className="w-4 h-4 text-[#0284c7]" />
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-full bg-[#f0f9ff] flex items-center justify-center shrink-0">
        <UserPlus className="w-4 h-4 text-[#0284c7]" />
      </div>
    )
  }

  const getNotifMessage = (n: any) => {
    const tipo = n.tipo
    if (tipo === 'hug' || tipo === 'abraco' || tipo === 'abraco_tatil') {
      return n.mensagem
        ? <span><strong>{n.remetente}</strong>: {n.mensagem} 🫂</span>
        : <span><strong>{n.remetente}</strong> enviou um <strong>abraço tátil</strong> para o seu jardim! 🫂</span>
    }
    if (tipo === 'regar' || tipo === 'water') {
      return (
        <span><strong>{n.remetente}</strong> regou o seu jardim! 💧</span>
      )
    }
    return (
      <span><strong>{n.remetente}</strong> {n.mensagem || 'começou a seguir o seu jardim! 🌱'}</span>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Notificações"
          id="notifications-bell-btn"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse border border-background" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2 rounded-2xl shadow-lg border-[#eaeef5]" align="end">
        <div className="p-4 border-b border-[#eaeef5] flex items-center justify-between bg-[#f8fafc] rounded-t-2xl calm-popover-header">
          <h3 className="font-bold text-foreground calm-notif-title">Notificações</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="text-xs bg-[#e8f5e9] text-green-700 font-bold px-2 py-0.5 rounded-full calm-popover-badge-new">
                {unreadCount} novas
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100 calm-popover-badge-realtime">
              ⚡ Em tempo real
            </span>
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#6a7a9a] calm-popover-empty">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <span className="calm-notif-body">Seu jardim está tranquilo no momento.</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 border-b border-[#eaeef5] last:border-0 hover:bg-[#f8fafc] transition-colors calm-popover-item ${!n.lido ? 'bg-blue-50/30 calm-popover-item-unread' : ''}`}>
                  <div className="flex items-start gap-3">
                    {getNotifIcon(n.tipo)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        {getNotifMessage(n)}
                      </p>
                      <p className="text-[10px] text-[#6a7a9a] mt-1 font-medium uppercase tracking-wider">
                        {formatDistanceToNow(new Date(n.data), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {!n.lido && (
                      <div className="w-2 h-2 rounded-full bg-[#b1d156] shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-[#eaeef5] bg-[#f8fafc] rounded-b-2xl calm-popover-footer">
          <Link
            href="/meu-jardim"
            className="block text-center text-xs font-bold text-[#16a34a] hover:text-[#15803d] transition-colors py-1"
          >
            Ver Meu Jardim completo →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
