'use client'

import { useState } from 'react'
import { PixelGarden } from './pixel-garden'
import { SensoryAudio } from '@/lib/services/sensory-audio'

interface ProfileGardenViewProps {
  targetUserId: string
  username: string
  unlockedFlowers: string[]
  initialWatered: boolean
  isVisiting: boolean
}

export function ProfileGardenView({
  targetUserId,
  username,
  unlockedFlowers,
  initialWatered,
  isVisiting,
}: ProfileGardenViewProps) {
  const [hasWatered, setHasWatered] = useState(initialWatered)

  const handleWater = async () => {
    if (hasWatered || !isVisiting) return
    setHasWatered(true)
    SensoryAudio.play('water-drop')

    try {
      await fetch('/api/community/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      })
    } catch (err) {
      console.error('Failed to water garden', err)
      setHasWatered(false)
    }
  }

  return (
    <div className="space-y-3">
      <PixelGarden
        unlockedFlowers={unlockedFlowers}
        username={username}
        onWater={handleWater}
        hasWatered={hasWatered || !isVisiting}
      />
      {!isVisiting && (
        <p className="text-center text-xs text-muted-foreground italic">
          Este é o seu próprio jardim. 🌱 Continue registrando para conquistar mais flores!
        </p>
      )}
    </div>
  )
}
