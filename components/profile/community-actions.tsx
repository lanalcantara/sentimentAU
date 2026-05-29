'use client'

import { useState } from 'react'
import { Heart, UserPlus, UserCheck, CloudRain } from 'lucide-react'
import { SensoryAudio } from '@/lib/services/sensory-audio'

export function CommunityActions({ 
  targetUserId, 
  targetUsername,
  initialFollowing = false,
  initialHugged = false,
  initialWatered = false
}: { 
  targetUserId: string
  targetUsername: string
  initialFollowing?: boolean
  initialHugged?: boolean
  initialWatered?: boolean
}) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [hasHugged, setHasHugged] = useState(initialHugged)
  const [hasWatered, setHasWatered] = useState(initialWatered)
  const [isHoveringHug, setIsHoveringHug] = useState(false)
  const [isHoveringWater, setIsHoveringWater] = useState(false)

  const handleFollow = async () => {
    SensoryAudio.playClick()
    setIsFollowing(!isFollowing)
    
    try {
      await fetch('/api/community/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      })
    } catch (error) {
      console.error('Failed to follow', error)
      setIsFollowing(isFollowing) // revert
    }
  }

  const handleHug = async () => {
    if (hasHugged) return
    SensoryAudio.playClick()
    setHasHugged(true)
    
    try {
      await fetch('/api/community/hug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      })
    } catch (error) {
      console.error('Failed to send hug', error)
      setHasHugged(false) // revert
    }
  }

  const handleWater = async () => {
    if (hasWatered) return
    SensoryAudio.play('water-drop') // special aquatic sensory sound!
    setHasWatered(true)
    
    try {
      await fetch('/api/community/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      })
    } catch (error) {
      console.error('Failed to water garden', error)
      setHasWatered(false) // revert
    }
  }

  return (
    <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
      <button 
        onClick={handleFollow}
        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
          isFollowing 
            ? 'bg-[#e0f2fe] text-[#0284c7]' 
            : 'bg-[#f0f9ff] text-[#0284c7] hover:bg-[#e0f2fe]'
        }`}
      >
        {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} 
        {isFollowing ? 'Seguindo' : 'Seguir Jardim'}
      </button>

      <button 
        onClick={handleWater}
        onMouseEnter={() => setIsHoveringWater(true)}
        onMouseLeave={() => setIsHoveringWater(false)}
        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
          hasWatered 
            ? 'bg-[#e0fdf4] text-[#16a34a] scale-95' 
            : 'bg-[#f0fdf4] text-[#16a34a] hover:bg-[#e0fdf4] hover:scale-105'
        }`}
      >
        <CloudRain className={`w-4 h-4 ${hasWatered || isHoveringWater ? 'fill-[#16a34a]' : ''}`} /> 
        {hasWatered ? 'Jardim Regado! 💧' : 'Regar este Jardim'}
      </button>
      
      <button 
        onClick={handleHug}
        onMouseEnter={() => setIsHoveringHug(true)}
        onMouseLeave={() => setIsHoveringHug(false)}
        className={`community-support-button flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
          hasHugged 
            ? 'bg-[#fce7f3] text-[#db2777] scale-95' 
            : 'bg-[#fdf2f8] text-[#db2777] hover:bg-[#fce7f3] hover:scale-105'
        }`}
      >
        <Heart className={`w-4 h-4 ${hasHugged || isHoveringHug ? 'fill-[#db2777]' : ''} ${hasHugged ? 'animate-ping' : ''}`} style={hasHugged ? { animationIterationCount: 1 } : {}} /> 
        {hasHugged ? 'Abraço Enviado!' : 'Enviar Abraço'}
      </button>
    </div>
  )
}
