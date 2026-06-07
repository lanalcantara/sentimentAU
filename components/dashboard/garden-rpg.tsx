'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FLOWERS } from '@/lib/flowers'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import { useCalmMode } from '@/lib/context/calm-mode-context'
import { toast } from 'sonner'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles, Trophy } from 'lucide-react'

// Game Canvas Dimensions
const CANVAS_WIDTH = 384
const CANVAS_HEIGHT = 288
const MAP_WIDTH = 768
const MAP_HEIGHT = 576
const PLAYER_SPEED = 2.2
const PLAYER_COLLISION_RADIUS = 9

const FLOWER_POSITIONS: Record<string, { x: number; y: number; emoji: string }> = {
  'semente': { x: 35, y: 75 + 288, emoji: '🌱' },
  'broto': { x: 55, y: 105 + 288, emoji: '🌿' },
  'margarida': { x: 30, y: 180 + 288, emoji: '🌼' },
  'girassol': { x: 60, y: 220 + 288, emoji: '🌻' },
  'rosa': { x: 180, y: 45 + 288, emoji: '🌹' },
  'tulipa': { x: 220, y: 45 + 288, emoji: '🌷' },
  'lotus': { x: 242, y: 105 + 288, emoji: '🪷' },
  'cerejeira': { x: 320, y: 62 + 288, emoji: '🌸' },
  'orquidea': { x: 200, y: 90 + 288, emoji: '🏵️' },
  'lirio': { x: 145, y: 190 + 288, emoji: '⚜️' },
  'violeta': { x: 225, y: 235 + 288, emoji: '🪻' },
  'hibisco': { x: 275, y: 200 + 288, emoji: '🌺' },
  'trevo': { x: 345, y: 165 + 288, emoji: '🍀' },
  'cacto': { x: 25, y: 135 + 288, emoji: '🌵' },
  'cogumelo': { x: 330, y: 225 + 288, emoji: '🍄' },
  'arvore': { x: 150, y: 70 + 288, emoji: '🌳' },
}

const UNIFIED_TREES = [
  // Clareira Central trees (added Y + 288)
  { x: 30, y: 30 + 288, r: 12, visualR: 24, type: 'central' },
  { x: 270, y: 30 + 288, r: 12, visualR: 24, type: 'central' },
  { x: 30, y: 260 + 288, r: 12, visualR: 24, type: 'central' },
  { x: 350, y: 265 + 288, r: 12, visualR: 22, type: 'central' },
  { x: 300, y: 150 + 288, r: 14, visualR: 28, type: 'central' },
  
  // Vale do Norte trees (same coordinates)
  { x: 30, y: 35, r: 12, visualR: 24, type: 'north' },
  { x: 180, y: 40, r: 12, visualR: 24, type: 'north' },
  { x: 320, y: 35, r: 12, visualR: 24, type: 'north' },
  { x: 350, y: 70, r: 12, visualR: 22, type: 'north' },
  { x: 40, y: 250, r: 12, visualR: 22, type: 'north' },
  { x: 180, y: 260, r: 12, visualR: 24, type: 'north' },
  { x: 340, y: 250, r: 12, visualR: 22, type: 'north' },
  
  // Vale do Leste trees (added X + 384, Y + 288)
  { x: 40 + 384, y: 40 + 288, r: 12, visualR: 24, type: 'east' },
  { x: 160 + 384, y: 30 + 288, r: 12, visualR: 22, type: 'east' },
  { x: 300 + 384, y: 40 + 288, r: 12, visualR: 24, type: 'east' },
  { x: 30 + 384, y: 250 + 288, r: 12, visualR: 22, type: 'east' },
  { x: 110 + 384, y: 260 + 288, r: 12, visualR: 24, type: 'east' },
  
  // Vale do Nordeste / Quadrant 4 trees (384 <= X <= 768, 0 <= Y <= 288)
  { x: 420, y: 40, r: 12, visualR: 24, type: 'northeast' },
  { x: 520, y: 30, r: 12, visualR: 22, type: 'northeast' },
  { x: 720, y: 40, r: 12, visualR: 24, type: 'northeast' },
  { x: 730, y: 150, r: 12, visualR: 22, type: 'northeast' },
  { x: 450, y: 220, r: 12, visualR: 24, type: 'northeast' },
  { x: 680, y: 250, r: 12, visualR: 22, type: 'northeast' },
]

const UNIFIED_DEC_FLOWERS = [
  // Central (added Y + 288)
  { x: 80, y: 80 + 288, color: '#f43f5e', type: 'central' },
  { x: 150, y: 110 + 288, color: '#eab308', type: 'central' },
  { x: 220, y: 80 + 288, color: '#a855f7', type: 'central' },
  { x: 120, y: 200 + 288, color: '#ec4899', type: 'central' },
  { x: 80, y: 160 + 288, color: '#3b82f6', type: 'central' },
  { x: 240, y: 210 + 288, color: '#f43f5e', type: 'central' },
  
  // North (same coordinates)
  { x: 50, y: 150, color: '#f472b6', type: 'north' },
  { x: 130, y: 60, color: '#fda4af', type: 'north' },
  { x: 230, y: 55, color: '#f472b6', type: 'north' },
  { x: 310, y: 170, color: '#fda4af', type: 'north' },
  { x: 140, y: 220, color: '#f472b6', type: 'north' },
  
  // East (added X + 384, Y + 288)
  { x: 80 + 384, y: 200 + 288, color: '#f43f5e', type: 'east' },
  { x: 180 + 384, y: 180 + 288, color: '#a855f7', type: 'east' },
  { x: 50 + 384, y: 90 + 288, color: '#f5c842', type: 'east' },
  
  // Northeast (added X + 384, Y: 0..288)
  { x: 80 + 384, y: 150, color: '#f472b6', type: 'northeast' },
  { x: 130 + 384, y: 60, color: '#fda4af', type: 'northeast' },
  { x: 230 + 384, y: 55, color: '#fda4af', type: 'northeast' },
  { x: 310 + 384, y: 170, color: '#f472b6', type: 'northeast' },
  { x: 140 + 384, y: 220, color: '#fda4af', type: 'northeast' },
]

interface Chest {
  id: string
  x: number // Pixel X
  y: number // Pixel Y
  mapX: number
  mapY: number
  requiredEntries: number
  flowerId: string
  isOpened: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  alpha: number
  life: number
}

interface StaticTree {
  x: number
  y: number
  r: number // Collision radius
  visualR: number // Visual crown size
  type?: string
}

interface FlowerDetail {
  x: number
  y: number
  color: string
  type?: string
}

export function GardenRPG({ entriesCount, streak }: { entriesCount: number; streak: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { calmMode } = useCalmMode()
  
  // Biome Display Names
  const [currentBiomeName, setCurrentBiomeName] = useState('Clareira Central (Bosque Inicial)')
  const [currentBiomeDesc, setCurrentBiomeDesc] = useState('Um bosque aconchegante com estradas de terra ligando as demais áreas.')

  // Touch navigation targets
  const targetXRef = useRef<number | null>(null)
  const targetYRef = useRef<number | null>(null)

  // Relaxation Room overlay state
  const [showRelaxationRoom, setShowRelaxationRoom] = useState(false)

  // Game state refs (prevents react re-render overhead at 60fps)
  const pxRef = useRef(100) // Start pixel X
  const pyRef = useRef(432) // Start Y (Clareira Central Y: 288..576)
  const keysRef = useRef<{ [key: string]: boolean }>({})
  const walkCycleRef = useRef(0)
  const isWalkingRef = useRef(false)
  const playerDirRef = useRef<'down' | 'up' | 'left' | 'right'>('down')
  const particlesRef = useRef<Particle[]>([])
  
  // Speech bubble state for canvas rendering
  const bubbleTextRef = useRef<string | null>(null)
  const bubbleTimerRef = useRef<number>(0)
  
  // Sync state to trigger React re-renders only for unlocking feedback if needed
  const [unlockedFlowers, setUnlockedFlowers] = useState<string[]>([])
  
  // Chest configuration distributed across maps
  const [chests, setChests] = useState<Chest[]>([
    { id: 'chest1', x: 60, y: 358, mapX: 0, mapY: 0, requiredEntries: 3, flowerId: 'orquidea', isOpened: false },
    { id: 'chest2', x: 180, y: 508, mapX: 0, mapY: 0, requiredEntries: 7, flowerId: 'lirio', isOpened: false },
    { id: 'chest3', x: 70, y: 50, mapX: 0, mapY: 1, requiredEntries: 14, flowerId: 'violeta', isOpened: false },
    { id: 'chest4', x: 280, y: 160, mapX: 0, mapY: 1, requiredEntries: 21, flowerId: 'hibisco', isOpened: false },
    { id: 'chest5', x: 704, y: 358, mapX: 1, mapY: 0, requiredEntries: 30, flowerId: 'trevo', isOpened: false },
    { id: 'chest6', x: 564, y: 508, mapX: 1, mapY: 0, requiredEntries: 40, flowerId: 'girassol', isOpened: false },
  ])

  // Progress milestones for path unlocks
  const isNorthUnlocked = entriesCount >= 5 || streak >= 3
  const isEastUnlocked = entriesCount >= 10 || streak >= 5
  // Inverse aliases used throughout the component
  const isNorthLocked = !isNorthUnlocked
  const isEastLocked = !isEastUnlocked

  // Biome retrieval helper based on coordinates
  const getBiomeAt = (x: number, y: number) => {
    if (x < 384 && y < 288) {
      return {
        name: 'Vale do Norte (Floresta do Rio)',
        description: 'Lindo vale com cerejeiras cor-de-rosa, um rio e uma ponte rústica de madeira.',
      }
    } else if (x >= 384 && y < 288) {
      return {
        name: 'Recanto Zen (Vale do Nordeste)',
        description: 'Um jardim sereno de meditação com cerejeiras e caminhos de pedra que ligam os vales.',
      }
    } else if (x >= 384 && y >= 288) {
      return {
        name: 'Vale do Leste (Outono & Jardim)',
        description: 'Um belo vale de outono com árvores laranjas, um lago e um lindo canteiro florido.',
      }
    } else {
      return {
        name: 'Clareira Central (Bosque Inicial)',
        description: 'Um bosque aconchegante com estradas de terra ligando as demais áreas.',
      }
    }
  }

  // Load user's unlocked flowers on mount and custom events
  useEffect(() => {
    async function loadUnlocked() {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        if (res.ok && data.user) {
          let unlocked = data.user.flores_desbloqueadas || ['semente']
          
          // Sync client-side with entriesCount if they are missing
          const syncedUnlocked = [...unlocked]
          if (entriesCount >= 1 && !syncedUnlocked.includes('broto')) syncedUnlocked.push('broto')
          if (entriesCount >= 3 && !syncedUnlocked.includes('margarida')) syncedUnlocked.push('margarida')
          if (entriesCount >= 7 && !syncedUnlocked.includes('girassol')) syncedUnlocked.push('girassol')
          if (entriesCount >= 14 && !syncedUnlocked.includes('tulipa')) syncedUnlocked.push('tulipa')
          if (entriesCount >= 30 && !syncedUnlocked.includes('cerejeira')) syncedUnlocked.push('cerejeira')
          
          if (syncedUnlocked.length !== unlocked.length) {
            unlocked = syncedUnlocked
            await fetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ flores_desbloqueadas: syncedUnlocked })
            })
          }
          
          setUnlockedFlowers(unlocked)
          
          setChests(prev => prev.map(c => ({
            ...c,
            isOpened: unlocked.includes(c.flowerId)
          })))
        }
      } catch (err) {
        console.error('Failed to load profile for RPG', err)
      }
    }
    loadUnlocked()

    const handleFlowerUnlocked = () => {
      loadUnlocked()
    }
    window.addEventListener('flower_unlocked', handleFlowerUnlocked)
    return () => {
      window.removeEventListener('flower_unlocked', handleFlowerUnlocked)
    }
  }, [entriesCount])

  // Auto-play Nature Sounds Loop in relaxation space
  useEffect(() => {
    if (!showRelaxationRoom) return

    // Immediately play first relaxation sound
    SensoryAudio.play('water-drop')

    const soundLoop = setInterval(() => {
      SensoryAudio.play(Math.random() > 0.5 ? 'water-drop' : 'bubble')
    }, 2800)

    return () => clearInterval(soundLoop)
  }, [showRelaxationRoom])

  // Physics & Collisions Check (Dynamic and map-aware)
  const checkCollision = (x: number, y: number) => {
    // 1. Boundary check for 768x576 unified map
    if (x < PLAYER_COLLISION_RADIUS || x > MAP_WIDTH - PLAYER_COLLISION_RADIUS) return true
    if (y < PLAYER_COLLISION_RADIUS || y > MAP_HEIGHT - PLAYER_COLLISION_RADIUS) return true

    // 2. Divider between Top and Bottom halves in right half (X >= 384)
    if (x >= 384) {
      const isNearBoundaryY = y > 288 - PLAYER_COLLISION_RADIUS && y < 288 + PLAYER_COLLISION_RADIUS
      if (isNearBoundaryY) {
        const inRoadX = x >= 595 && x <= 645 // road crossing Y=288
        if (!inRoadX) {
          return true
        }
        // If either North is locked or East is locked, restrict movement accordingly
        if (isNorthLocked && y < 288 + PLAYER_COLLISION_RADIUS) {
          return true
        }
        if (isEastLocked && y > 288 - PLAYER_COLLISION_RADIUS) {
          return true
        }
      }
    }

    // 3. Divider between Left and Right halves in bottom half (Y > 288)
    if (y > 288) {
      const isNearBoundaryX = x > 384 - PLAYER_COLLISION_RADIUS && x < 384 + PLAYER_COLLISION_RADIUS
      if (isNearBoundaryX) {
        const inRoadY = y >= 403 && y <= 453
        if (!inRoadY) {
          return true
        }
        if (isEastLocked && x > 384 - PLAYER_COLLISION_RADIUS) {
          return true
        }
      }
    }

    // 4. Divider between Top and Bottom halves in left half (X < 384)
    if (x < 384) {
      const isNearBoundaryY = y > 288 - PLAYER_COLLISION_RADIUS && y < 288 + PLAYER_COLLISION_RADIUS
      if (isNearBoundaryY) {
        const inRoadX = x >= 75 && x <= 125
        if (!inRoadX) {
          return true
        }
        if (isNorthLocked && y < 288 + PLAYER_COLLISION_RADIUS) {
          return true
        }
      }
    }

    // 5. Pond collision (Center Map quadrant)
    const pond = { x: 260, y: 80 + 288, w: 100, h: 50 }
    const px = Math.max(pond.x, Math.min(x, pond.x + pond.w))
    const py = Math.max(pond.y, Math.min(y, pond.y + pond.h))
    const distPond = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
    if (distPond < PLAYER_COLLISION_RADIUS) return true

    // 6. River collision (North Map quadrants 1 and 4)
    if (y >= 90 - PLAYER_COLLISION_RADIUS && y <= 125 + PLAYER_COLLISION_RADIUS) {
      const onBridge1 = x >= 84 && x <= 116
      const onBridge2 = x >= 584 && x <= 616
      if (!onBridge1 && !onBridge2) return true
    }
    
    // 7. Special Blooming Spot collision (North Map quadrant)
    if (x < 384 && y < 288) {
      const dx = x - 140
      const dy = y - 35
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < PLAYER_COLLISION_RADIUS + 4) return true
    }

    // 8. Autumn Lake collision (East Map quadrant: center 768, 576)
    const dx = x - 768
    const dy = y - 576
    const distLake = Math.sqrt(dx * dx + dy * dy)
    if (distLake < 140 + PLAYER_COLLISION_RADIUS) return true

    // 9. Tree collisions (active map trees)
    for (const tree of UNIFIED_TREES) {
      // Safety guard: skip undefined/malformed entries
      if (!tree || typeof tree.x === 'undefined' || typeof tree.y === 'undefined') continue
      const dxTree = x - tree.x
      const dyTree = y - tree.y
      const distTree = Math.sqrt(dxTree * dxTree + dyTree * dyTree)
      if (distTree < tree.r + PLAYER_COLLISION_RADIUS) {
        return true
      }
    }

    // 10. Chest collisions
    for (const chest of chests) {
      const cx = Math.max(chest.x - 12, Math.min(x, chest.x + 12))
      const cy = Math.max(chest.y - 8, Math.min(y, chest.y + 8))
      const distChest = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (distChest < PLAYER_COLLISION_RADIUS + 6) return true
    }

    return false
  }

  // Handle Keyboard movement states
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        handleInteract()
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        keysRef.current[e.key.toLowerCase()] = true
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        keysRef.current[e.key.toLowerCase()] = false
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [chests, entriesCount])

  // Sparkles Generator
  const createChestSparkles = (cx: number, cy: number) => {
    const colors = ['#f5c842', '#a5f3fc', '#f472b6', '#34d399', '#fb7185']
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 4
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 30 + Math.floor(Math.random() * 20)
      })
    }
  }

  // Handle Touch/Click on Canvas for movement
  const handleCanvasClickOrTouch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    let clientX = 0
    let clientY = 0

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      if (!touch) return
      clientX = touch.clientX
      clientY = touch.clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const rect = canvas.getBoundingClientRect()
    const clickX = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH
    const clickY = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT

    // Calculate camera offset (quadrant-locked screen transition)
    const cameraX = pxRef.current < 384 ? 0 : 384
    const cameraY = pyRef.current < 288 ? 0 : 288

    targetXRef.current = clickX + cameraX
    targetYRef.current = clickY + cameraY
    
    SensoryAudio.playClick()
  }

  // Interacting with near chests or triggering relaxation pond
  const handleInteract = async () => {
    const px = pxRef.current
    const py = pyRef.current
    
    // 1. Check if bordering the lake in Clareira Central
    if (px < 384 && py >= 288) {
      const dx = px - 310
      const dy = py - (105 + 288)
      const distPond = Math.sqrt((dx / 50) ** 2 + (dy / 25) ** 2)
      if (distPond < 1.4) {
        SensoryAudio.play('chime')
        setShowRelaxationRoom(true)
        return
      }
    }

    // 2. Check if bordering the Autumn Lake in East Map
    if (px >= 384 && py >= 288) {
      const dx = px - 768
      const dy = py - 576
      const distLake = Math.sqrt(dx * dx + dy * dy)
      if (distLake >= 140 && distLake <= 168) {
        SensoryAudio.play('chime')
        setShowRelaxationRoom(true)
        return
      }
    }

    // 2.1. Check if bordering the Special Blooming Spot in North Map
    if (px < 384 && py < 288) {
      const dx = px - 140
      const dy = py - 35
      const distSpot = Math.sqrt(dx * dx + dy * dy)
      if (distSpot < 32) {
        if (entriesCount > 10) {
          SensoryAudio.play('mc-levelup')
          createChestSparkles(140, 35)
          bubbleTextRef.current = 'Obrigado por compartilhar sua jornada! 🌟'
          bubbleTimerRef.current = 150
          toast.success('✨ Você fez o Cantinho do Norte florescer! Um portal de luz e paz se abriu aqui. 🌸')
        } else {
          SensoryAudio.play('mc-anvil')
          bubbleTextRef.current = 'Preciso de mais de 10 registros!'
          bubbleTimerRef.current = 150
          toast.info('Este cantinho está esperando você registrar mais momentos para florescer! 🌿')
        }
        return
      }
    }

    // 3. Find closest chest
    let closestChest: Chest | null = null
    let minDist = 40 

    chests.forEach(chest => {
      const dx = chest.x - px
      const dy = chest.y - py
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDist) {
        minDist = dist
        closestChest = chest
      }
    })

    if (!closestChest) return

    const targetChest = closestChest as Chest

    if (targetChest.isOpened) {
      toast.success('Este baú já foi aberto!')
      return
    }

    if (entriesCount < targetChest.requiredEntries) {
      SensoryAudio.play('mc-anvil')
      const needed = targetChest.requiredEntries - entriesCount
      bubbleTextRef.current = `Preciso de +${needed} registros!`
      bubbleTimerRef.current = 150 
      return
    }

    // Unlock chest
    const activeSound = SensoryAudio.getClickSound()
    const rewardSound = activeSound.startsWith('mc-') ? activeSound : 'mc-levelup'
    SensoryAudio.play(rewardSound)
    createChestSparkles(targetChest.x, targetChest.y)

    setChests(prev => prev.map(c => c.id === targetChest.id ? { ...c, isOpened: true } : c))
    
    // Add flower to unlockedFlowers state immediately for local canvas updates
    setUnlockedFlowers(prev => {
      if (prev.includes(targetChest.flowerId)) return prev
      return [...prev, targetChest.flowerId]
    })
    
    const flower = FLOWERS[targetChest.flowerId]
    toast.success(`🏵️ Baú aberto! Você desbloqueou a flor: ${flower?.label} ${flower?.emoji}!`, {
      description: flower?.description,
      duration: 6000
    })

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlockFlowerId: targetChest.flowerId })
      })
      if (res.ok) {
        window.dispatchEvent(new Event('avatar_updated'))
      }
    } catch (err) {
      console.error('[RPG] Error saving flower unlock:', err)
    }
  }

  // Virtual controller simulation triggers (Desktop D-pad only)
  const startVirtualMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    keysRef.current[dir] = true
  }
  const stopVirtualMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    keysRef.current[dir] = false
  }

  // Game Loop Animation & Physics Updates
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = false
    let animationFrameId: number

    const updatePhysics = () => {
      let dx = 0
      let dy = 0
      let keyActive = false

      // Keyboard direction inputs
      if (keysRef.current['arrowup'] || keysRef.current['w'] || keysRef.current['up']) {
        dy = -PLAYER_SPEED
        playerDirRef.current = 'up'
        keyActive = true
      }
      if (keysRef.current['arrowdown'] || keysRef.current['s'] || keysRef.current['down']) {
        dy = PLAYER_SPEED
        playerDirRef.current = 'down'
        keyActive = true
      }
      if (keysRef.current['arrowleft'] || keysRef.current['a'] || keysRef.current['left']) {
        dx = -PLAYER_SPEED
        playerDirRef.current = 'left'
        keyActive = true
      }
      if (keysRef.current['arrowright'] || keysRef.current['d'] || keysRef.current['right']) {
        dx = PLAYER_SPEED
        playerDirRef.current = 'right'
        keyActive = true
      }

      if (keyActive) {
        // Cancel touch destination on keyboard override
        targetXRef.current = null
        targetYRef.current = null

        isWalkingRef.current = true
        walkCycleRef.current += 0.2
        
        if (Math.floor(walkCycleRef.current) % 15 === 0 && Math.random() < 0.1) {
          SensoryAudio.play('water-drop')
        }

        const newX = pxRef.current + dx
        const newY = pyRef.current + dy

        if (!checkCollision(newX, newY)) {
          pxRef.current = newX
          pyRef.current = newY
        } else if (!checkCollision(newX, pyRef.current)) {
          pxRef.current = newX 
        } else if (!checkCollision(pxRef.current, newY)) {
          pyRef.current = newY 
        }
      } 
      // Touch navigation physics
      else if (targetXRef.current !== null && targetYRef.current !== null) {
        const tx = targetXRef.current
        const ty = targetYRef.current
        const cx = pxRef.current
        const cy = pyRef.current

        const tdx = tx - cx
        const tdy = ty - cy
        const distance = Math.sqrt(tdx * tdx + tdy * tdy)

        if (distance > 4) {
          isWalkingRef.current = true
          walkCycleRef.current += 0.2

          const vx = (tdx / distance) * PLAYER_SPEED
          const vy = (tdy / distance) * PLAYER_SPEED

          if (Math.abs(vx) > Math.abs(vy)) {
            playerDirRef.current = vx > 0 ? 'right' : 'left'
          } else {
            playerDirRef.current = vy > 0 ? 'down' : 'up'
          }

          const nextX = cx + vx
          const nextY = cy + vy

          if (!checkCollision(nextX, nextY)) {
            pxRef.current = nextX
            pyRef.current = nextY
          } else if (!checkCollision(nextX, cy)) {
            pxRef.current = nextX 
          } else if (!checkCollision(cx, nextY)) {
            pyRef.current = nextY 
          } else {
            targetXRef.current = null
            targetYRef.current = null
            isWalkingRef.current = false
          }
        } else {
          targetXRef.current = null
          targetYRef.current = null
          isWalkingRef.current = false
        }
      }
      else {
        isWalkingRef.current = false
      }

      // Update bubble timer
      if (bubbleTimerRef.current > 0) {
        bubbleTimerRef.current--
        if (bubbleTimerRef.current === 0) {
          bubbleTextRef.current = null
        }
      }

      // Update current biome state if it changed
      const biome = getBiomeAt(pxRef.current, pyRef.current)
      if (biome.name !== currentBiomeName) {
        setCurrentBiomeName(biome.name)
        setCurrentBiomeDesc(biome.description)
      }
    }

    const render = () => {
      updatePhysics()

      // Calculate camera coordinates (quadrant-locked screen transition)
      const cameraX = pxRef.current < 384 ? 0 : 384
      const cameraY = pyRef.current < 288 ? 0 : 288

      // 1. Draw Ground (Clear screen first, then draw quadrants)
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      ctx.save()
      ctx.translate(-cameraX, -cameraY)

      // Quadrant 1: Vale do Norte (0, 0)
      ctx.fillStyle = '#fdf2f8'
      ctx.fillRect(0, 0, 384, 288)

      // Quadrant 2: Clareira Central (0, 288)
      ctx.fillStyle = '#8bae96'
      ctx.fillRect(0, 288, 384, 288)

      // Quadrant 3: Vale do Leste (384, 288)
      ctx.fillStyle = '#fff7ed'
      ctx.fillRect(384, 288, 384, 288)

      // Quadrant 4: Vale do Nordeste (384, 0) - Pink grass continuation
      ctx.fillStyle = '#fdf2f8'
      ctx.fillRect(384, 0, 384, 288)

      // Draw decorative tufts per quadrant
      // Vale do Norte (Q1)
      ctx.fillStyle = '#fbcfe8'
      for (let i = 0; i < 384; i += 24) {
        for (let j = 0; j < 288; j += 24) {
          const ox = (i * 7 + j * 13) % 12
          const oy = (i * 3 + j * 17) % 12
          ctx.fillRect(i + ox, j + oy, 2, 2)
          ctx.fillRect(i + ox + 3, j + oy + 1, 1, 2)
        }
      }

      // Vale do Nordeste (Q4)
      ctx.fillStyle = '#fbcfe8'
      for (let i = 384; i < 768; i += 24) {
        for (let j = 0; j < 288; j += 24) {
          const ox = (i * 7 + j * 13) % 12
          const oy = (i * 3 + j * 17) % 12
          ctx.fillRect(i + ox, j + oy, 2, 2)
          ctx.fillRect(i + ox + 3, j + oy + 1, 1, 2)
        }
      }

      // Clareira Central
      ctx.fillStyle = '#a0c0ab'
      for (let i = 0; i < 384; i += 24) {
        for (let j = 288; j < 576; j += 24) {
          const ox = (i * 7 + j * 13) % 12
          const oy = (i * 3 + j * 17) % 12
          ctx.fillRect(i + ox, j + oy, 2, 2)
          ctx.fillRect(i + ox + 3, j + oy + 1, 1, 2)
        }
      }

      // Vale do Leste
      ctx.fillStyle = '#ffedd5'
      for (let i = 384; i < 768; i += 24) {
        for (let j = 288; j < 576; j += 24) {
          const ox = (i * 7 + j * 13) % 12
          const oy = (i * 3 + j * 17) % 12
          ctx.fillRect(i + ox, j + oy, 2, 2)
          ctx.fillRect(i + ox + 3, j + oy + 1, 1, 2)
        }
      }

      // 2. Draw Roads (Dirt path)
      ctx.fillStyle = '#fef08a' 
      
      // Clareira Central paths
      ctx.beginPath()
      ctx.moveTo(100, 288)
      ctx.quadraticCurveTo(110, 432, 100, 576)
      ctx.lineWidth = 26
      ctx.strokeStyle = '#fef08a'
      ctx.lineCap = 'round'
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(100, 432)
      ctx.quadraticCurveTo(240, 432, 384, 432)
      ctx.lineWidth = 20
      ctx.strokeStyle = '#fef08a'
      ctx.stroke()

      // Vale do Norte paths
      ctx.beginPath()
      ctx.moveTo(100, 288)
      ctx.quadraticCurveTo(100, 200, 100, 125)
      ctx.lineWidth = 26
      ctx.strokeStyle = '#fef08a'
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(100, 90)
      ctx.quadraticCurveTo(100, 45, 140, 35)
      ctx.lineWidth = 22
      ctx.strokeStyle = '#fef08a'
      ctx.stroke()

      // Vale do Leste path
      ctx.beginPath()
      ctx.moveTo(384, 432)
      ctx.quadraticCurveTo(504, 432, 544, 432)
      ctx.lineWidth = 26
      ctx.strokeStyle = '#fef08a'
      ctx.stroke()

      // Northeast paths (Quadrant 4)
      // Path connecting bridges above river
      ctx.beginPath()
      ctx.moveTo(100, 85)
      ctx.quadraticCurveTo(340, 50, 580, 85)
      ctx.lineWidth = 16
      ctx.strokeStyle = '#fef08a'
      ctx.stroke()

      // Path below river connecting bridge 1 and bridge 2
      ctx.beginPath()
      ctx.moveTo(100, 130)
      ctx.quadraticCurveTo(340, 180, 580, 130)
      ctx.lineWidth = 18
      ctx.strokeStyle = '#fef08a'
      ctx.stroke()

      // Path going down from bridge 2 to Vale do Leste
      ctx.beginPath()
      ctx.moveTo(580, 130)
      ctx.quadraticCurveTo(620, 288, 544, 432)
      ctx.lineWidth = 20
      ctx.strokeStyle = '#fef08a'
      ctx.stroke()

      // Draw path texture details (pebbles/dirt specs)
      ctx.fillStyle = '#eab308'
      ctx.fillRect(96, 60, 2, 2)
      ctx.fillRect(114, 120, 3, 2)
      ctx.fillRect(96, 60 + 288, 2, 2)
      ctx.fillRect(114, 120 + 288, 3, 2)
      ctx.fillRect(160, 432 - 4, 2, 2)
      ctx.fillRect(220, 432 - 14, 2, 2)

      // 3. Draw Water Elements
      // Botanical Pond in Clareira Central
      const pond = { x: 260, y: 80 + 288, w: 100, h: 50 }
      ctx.fillStyle = '#bae6fd' 
      ctx.beginPath()
      ctx.ellipse(pond.x + pond.w / 2, pond.y + pond.h / 2, pond.w / 2, pond.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#38bdf8'
      ctx.stroke()

      // Slate Stone Border
      const stoneCount = 18
      ctx.fillStyle = '#94a3b8' 
      for (let i = 0; i < stoneCount; i++) {
        const angle = (i / stoneCount) * Math.PI * 2
        const sx = pond.x + pond.w / 2 + Math.cos(angle) * (pond.w / 2 + 1)
        const sy = pond.y + pond.h / 2 + Math.sin(angle) * (pond.h / 2 + 1)
        const sr = 3.5 + (Math.sin(i * 1.7) * 1.5) 
        ctx.beginPath()
        ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#64748b'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Lilies and flowers
      ctx.fillStyle = '#10b981' 
      ctx.beginPath()
      ctx.arc(pond.x + 35, pond.y + 20, 5, 0, Math.PI * 1.7)
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(pond.x + 70, pond.y + 35, 6, 0.2, Math.PI * 1.9)
      ctx.fill()
      
      ctx.fillStyle = '#fda4af'
      ctx.fillRect(pond.x + 34, pond.y + 16, 3, 3)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(pond.x + 35, pond.y + 17, 1, 1)

      // Green reeds
      ctx.fillStyle = '#065f46'
      ctx.fillRect(pond.x + 20, pond.y + 15, 2, 8)
      ctx.fillRect(pond.x + 23, pond.y + 10, 2, 12)
      ctx.fillRect(pond.x + 85, pond.y + 15, 2, 10)
      ctx.fillRect(pond.x + 88, pond.y + 18, 2, 8)

      // North River (spans across both North quadrants: X: 0 to 768)
      ctx.fillStyle = '#60a5fa'
      ctx.fillRect(0, 90, 768, 35)
      ctx.fillStyle = '#93c5fd'
      ctx.fillRect(40, 100, 30, 2)
      ctx.fillRect(200, 115, 45, 2)
      ctx.fillRect(300, 98, 20, 2)
      ctx.fillRect(450, 105, 40, 2)
      ctx.fillRect(600, 112, 35, 2)
      ctx.fillRect(700, 98, 25, 2)

      // Wooden Bridge 1 (Quadrant 1)
      ctx.fillStyle = '#b45309'
      ctx.fillRect(80, 85, 40, 45)
      ctx.fillStyle = '#78350f'
      for (let by = 90; by <= 125; by += 7) {
        ctx.fillRect(80, by, 40, 2)
      }
      ctx.fillStyle = '#d97706'
      ctx.fillRect(77, 85, 3, 45)
      ctx.fillRect(120, 85, 3, 45)

      // Wooden Bridge 2 (Quadrant 4)
      ctx.fillStyle = '#b45309'
      ctx.fillRect(580, 85, 40, 45)
      ctx.fillStyle = '#78350f'
      for (let by = 90; by <= 125; by += 7) {
        ctx.fillRect(580, by, 40, 2)
      }
      ctx.fillStyle = '#d97706'
      ctx.fillRect(577, 85, 3, 45)
      ctx.fillRect(620, 85, 3, 45)

      // Special Blooming Spot in North Map
      ctx.save()
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.beginPath()
      ctx.ellipse(140, 39, 8, 4, 0, 0, Math.PI * 2)
      ctx.fill()

      if (entriesCount > 10) {
        const grad = ctx.createRadialGradient(140, 35, 2, 140, 35, 12)
        grad.addColorStop(0, 'rgba(253, 224, 71, 0.4)')
        grad.addColorStop(1, 'rgba(253, 224, 71, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(140, 35, 12, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = '14px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('✨', 140, 32)
        ctx.fillText('🌸', 140, 35)
      } else {
        ctx.font = '12px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🔒', 140, 35)
      }

      // Show interact key prompt if close
      const distToSpot = Math.sqrt((140 - pxRef.current) ** 2 + (35 - pyRef.current) ** 2)
      if (distToSpot < 32) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
        ctx.fillRect(140 - 14, 35 - 26, 28, 11)
        ctx.fillStyle = '#1e293b'
        ctx.font = 'bold 8px sans-serif'
        ctx.fillText('SPACE', 140 - 12, 35 - 18)
      }
      ctx.restore()

      // East Autumn Lake
      ctx.fillStyle = '#bae6fd'
      ctx.beginPath()
      ctx.arc(768, 576, 140, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 3
      ctx.stroke()

      // Stone border
      ctx.fillStyle = '#94a3b8'
      const lakeStoneCount = 25
      for (let i = 0; i <= lakeStoneCount; i++) {
        const angle = Math.PI + (i / lakeStoneCount) * (Math.PI / 2)
        const sx = 768 + Math.cos(angle) * 141
        const sy = 576 + Math.sin(angle) * 141
        const sr = 4.5 + (Math.sin(i * 2.3) * 1.5)
        ctx.beginPath()
        ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#64748b'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Reeds and aquatic plants
      ctx.fillStyle = '#065f46'
      ctx.fillRect(260 + 384, 220 + 288, 2, 12)
      ctx.fillRect(263 + 384, 215 + 288, 2, 16)
      ctx.fillRect(290 + 384, 250 + 288, 2, 10)
      
      // Lily pad
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(310 + 384, 240 + 288, 6, 0, Math.PI * 1.7)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(309 + 384, 238 + 288, 2, 2)

      // Wildflower Garden Patch
      ctx.fillStyle = '#86efac' 
      ctx.fillRect(100 + 384, 60 + 288, 80, 50)
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 2
      ctx.strokeRect(100 + 384, 60 + 288, 80, 50)

      // Multi-colored flowers in garden patch
      const flowerColors = ['#f43f5e', '#a855f7', '#fbbf24', '#3b82f6', '#ec4899']
      for (let fi = 106; fi < 174; fi += 12) {
        for (let fj = 66; fj < 104; fj += 10) {
          const idx = (fi * 3 + fj * 7) % flowerColors.length
          ctx.fillStyle = flowerColors[idx]
          ctx.fillRect(fi + 384, fj + 288, 4, 4)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(fi + 1 + 384, fj + 1 + 288, 2, 2)
        }
      }

      // 4. Draw Scattered Decorative Flowers
      UNIFIED_DEC_FLOWERS.forEach(f => {
        ctx.fillStyle = f.color
        ctx.fillRect(f.x, f.y, 4, 4)
        ctx.fillRect(f.x - 2, f.y + 2, 2, 2)
        ctx.fillRect(f.x + 4, f.y + 2, 2, 2)
        ctx.fillRect(f.x + 1, f.y + 5, 2, 2)
        ctx.fillStyle = '#f5c842'
        ctx.fillRect(f.x + 1, f.y + 2, 2, 2)
      })

      // 4.1. Draw Unlocked Botanical Flowers (drawn on Clareira Central Y: 288..576)
      ctx.save()
      Object.entries(FLOWER_POSITIONS).forEach(([id, pos]) => {
        if (unlockedFlowers.includes(id)) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
          ctx.beginPath()
          ctx.ellipse(pos.x, pos.y + 4, 6, 3, 0, 0, Math.PI * 2)
          ctx.fill()

          ctx.font = '12px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(pos.emoji, pos.x, pos.y)
        }
      })
      ctx.restore()

      // 5. Draw Exit Barriers on Center Map (Y = 288 boundary and X = 384 boundary)
      if (isNorthLocked) {
        ctx.fillStyle = '#78350f'
        for (let fx = 75; fx <= 125; fx += 10) {
          ctx.fillRect(fx, 288 - 6, 4, 12) 
        }
        ctx.fillRect(75, 288 - 4, 50, 3)
        ctx.fillStyle = '#ef4444'
        ctx.font = 'bold 8px sans-serif'
        ctx.fillText('🔒 Meta: Reg. 5 ou Streak 3', 60, 310)
      }

      if (isEastLocked) {
        ctx.fillStyle = '#78350f'
        for (let fy = 403; fy <= 453; fy += 10) {
          ctx.fillRect(384 - 6, fy, 12, 4)
        }
        ctx.fillRect(384 - 4, 403, 3, 50)
        ctx.fillStyle = '#ef4444'
        ctx.font = 'bold 8px sans-serif'
        ctx.fillText('🔒 Meta:', 330, 395)
        ctx.fillText('Reg. 10 / Streak 5', 300, 405)
      }

      // 6. Draw Map Chests
      chests.forEach(chest => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.fillRect(chest.x - 12, chest.y + 4, 24, 8)

        if (chest.isOpened) {
          ctx.fillStyle = '#71717a'
          ctx.fillRect(chest.x - 10, chest.y - 2, 20, 12)
          ctx.fillStyle = '#a1a1aa'
          ctx.fillRect(chest.x - 12, chest.y - 8, 24, 6)
          ctx.fillStyle = '#e4e4e7'
          ctx.fillRect(chest.x - 6, chest.y - 2, 12, 2)
        } else {
          ctx.fillStyle = '#b45309'
          ctx.fillRect(chest.x - 10, chest.y - 6, 20, 14)
          ctx.fillStyle = '#78350f'
          ctx.fillRect(chest.x - 12, chest.y - 10, 24, 5)
          
          ctx.fillStyle = '#4b5563'
          ctx.fillRect(chest.x - 8, chest.y - 10, 2, 18)
          ctx.fillRect(chest.x + 6, chest.y - 10, 2, 18)
          
          ctx.fillStyle = '#fbbf24'
          ctx.fillRect(chest.x - 2, chest.y - 2, 4, 5)
          
          // Interact prompt when close
          const distToChest = Math.sqrt((chest.x - pxRef.current) ** 2 + (chest.y - pyRef.current) ** 2)
          if (distToChest < 32) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
            ctx.fillRect(chest.x - 14, chest.y - 26, 28, 11)
            ctx.fillStyle = '#1e293b'
            ctx.font = 'bold 8px sans-serif'
            ctx.fillText('SPACE', chest.x - 12, chest.y - 18)
          }
        }
      })

      // 7. Draw Player (Animated Sprout)
      const px = pxRef.current
      const py = pyRef.current

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.beginPath()
      ctx.ellipse(px, py + 14, 8, 3, 0, 0, Math.PI * 2)
      ctx.fill()

      const bobY = isWalkingRef.current ? Math.sin(walkCycleRef.current) * 2.5 : 0
      const legOffset = isWalkingRef.current ? Math.sin(walkCycleRef.current) * 3 : 0

      // Body (Green Sprout)
      ctx.fillStyle = '#4ade80'
      ctx.beginPath()
      ctx.arc(px, py + 4 + bobY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#f472b6'
      ctx.fillRect(px - 6, py + 5 + bobY, 2, 2)
      ctx.fillRect(px + 4, py + 5 + bobY, 2, 2)

      ctx.fillStyle = '#1e293b'
      if (playerDirRef.current === 'down') {
        ctx.fillRect(px - 4, py + 2 + bobY, 2, 2)
        ctx.fillRect(px + 2, py + 2 + bobY, 2, 2)
      } else if (playerDirRef.current === 'left') {
        ctx.fillRect(px - 5, py + 2 + bobY, 2, 2)
      } else if (playerDirRef.current === 'right') {
        ctx.fillRect(px + 3, py + 2 + bobY, 2, 2)
      }

      ctx.fillStyle = '#78350f'
      ctx.fillRect(px - 6, py + 8 + bobY, 12, 5)

      ctx.fillStyle = '#1e293b'
      ctx.fillRect(px - 4, py + 12 + (isWalkingRef.current ? legOffset : 0), 2, 2)
      ctx.fillRect(px + 2, py + 12 + (isWalkingRef.current ? -legOffset : 0), 2, 2)

      // Leaf on top
      const leafAngle = isWalkingRef.current ? Math.sin(walkCycleRef.current) * 0.25 : 0
      ctx.save()
      ctx.translate(px, py - 4 + bobY)
      ctx.rotate(leafAngle)
      ctx.fillStyle = '#15803d'
      ctx.beginPath()
      ctx.ellipse(0, -3, 3, 5, Math.PI / 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // 8. Draw Particle Effects
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.alpha = Math.max(0, p.alpha - 0.02)
        p.life--
        
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fillRect(p.x, p.y, 3, 3)
        ctx.globalAlpha = 1.0
        
        return p.life > 0
      })

      // 9. Draw Speech Bubble
      if (bubbleTextRef.current) {
        const text = bubbleTextRef.current
        ctx.font = 'bold 9px sans-serif'
        const textWidth = ctx.measureText(text).width
        const bw = textWidth + 14
        const bh = 18
        const bx = px - bw / 2
        const by = py - 32 + bobY

        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#1e293b'
        ctx.lineWidth = 1.5
        
        ctx.beginPath()
        ctx.roundRect(bx, by, bw, bh, 6)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.moveTo(px - 4, by + bh)
        ctx.lineTo(px, by + bh + 4)
        ctx.lineTo(px + 4, by + bh)
        ctx.fill()
        
        ctx.beginPath()
        ctx.moveTo(px - 4, by + bh)
        ctx.lineTo(px, by + bh + 4)
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(px + 4, by + bh)
        ctx.lineTo(px, by + bh + 4)
        ctx.stroke()

        ctx.fillStyle = '#1e293b'
        ctx.fillText(text, bx + 7, by + 12)
      }

      // 10. Draw Organic Trees on Top (Y-sorting simulation)
      UNIFIED_TREES.forEach(tree => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.beginPath()
        ctx.ellipse(tree.x, tree.y + 12, tree.visualR - 4, 6, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#78350f'
        ctx.fillRect(tree.x - 4, tree.y, 8, 14)

        // Leafy Crown color varies by quadrant
        let treeColor = '#22c55e'
        let treeHighlight = '#4ade80'
        
        if (tree.y < 288) { // North or Northeast (Cherry Blossoms!)
          treeColor = '#f472b6'
          treeHighlight = '#fbcfe8'
        } else if (tree.x >= 384 && tree.y >= 288) { // East (Autumn)
          treeColor = '#f97316'
          treeHighlight = '#fbbf24'
        }

        ctx.fillStyle = treeColor
        ctx.beginPath()
        ctx.arc(tree.x, tree.y - 8, tree.visualR, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = treeHighlight
        ctx.beginPath()
        ctx.arc(tree.x - 4, tree.y - 12, tree.visualR - 6, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.restore()
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationFrameId)
  }, [chests, entriesCount, streak])

  return (
    <Card className="relative bg-card border-0 shadow-sm rounded-3xl p-6 space-y-4 overflow-hidden">
      
      {/* SENSORY RELAXATION SPACE OVERLAY (FONTE DO RELAXAMENTO) */}
      {showRelaxationRoom && (
        <div className={`absolute inset-0 ${
          calmMode 
            ? 'bg-gradient-to-br from-[#1A2421]/95 to-[#1E1E1E]/95' 
            : 'bg-gradient-to-br from-teal-50/95 to-blue-50/95'
        } backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-50 rounded-3xl animate-in fade-in duration-300`}>
          <div className="space-y-4 max-w-sm flex flex-col items-center">
            
            {/* Smooth expanding water ripple animation */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-2">
              <div className={`absolute inset-0 rounded-full border-2 ${calmMode ? 'border-teal-500/20' : 'border-teal-300/40'} animate-ping`} style={{ animationDuration: '3.5s' }} />
              <div className={`absolute inset-4 rounded-full border ${calmMode ? 'border-teal-500/30' : 'border-teal-400/50'} animate-ping`} style={{ animationDuration: '2.5s' }} />
              <div className={`absolute inset-8 rounded-full border ${calmMode ? 'border-teal-500/40' : 'border-teal-500/30'} animate-pulse`} />
              
              <div className={`w-16 h-16 rounded-full ${calmMode ? 'bg-teal-950/60' : 'bg-teal-100'} flex items-center justify-center shadow-sm`}>
                <span className="text-3xl animate-bounce" style={{ animationDuration: '3s' }}>🪷</span>
              </div>
            </div>
            
            <h3 className="relaxation-title text-lg font-extrabold flex items-center gap-1.5 justify-center">
              <span>Fonte do Relaxamento</span>
              <span className="animate-pulse">💧</span>
            </h3>
            
            <p className="relaxation-desc text-xs leading-relaxed font-medium">
              Respire fundo... Sinta as ondas da água e ouça os sons suaves da natureza para se autorregular.
            </p>
            
            <div className="pt-2 w-full">
              <Button 
                onClick={() => {
                  SensoryAudio.playClick()
                  setShowRelaxationRoom(false)
                }}
                className="w-full rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 shadow-md transition-colors cursor-pointer"
              >
                Voltar para o Jardim
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardHeader className="p-0 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary animate-bounce shrink-0" />
              <span>Exploração Botânica: {currentBiomeName}</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {currentBiomeDesc} Toque em qualquer ponto do gramado para caminhar suavemente até lá! Aproxime-se dos baús e toque no botão 🖐️ para abri-los.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-[#f0fdf4] border border-green-100 rounded-xl py-1 px-3 self-start sm:self-center rpg-streak-badge">
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">🔥 Streak</span>
            <span className="bg-green-200 text-green-800 text-xs font-black px-2 py-0.5 rounded-md">
              {streak} dias
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col lg:flex-row items-center lg:items-start gap-6">
        {/* Game Canvas Board */}
        <div className="relative border-4 border-[#8bae96] rounded-2xl overflow-hidden bg-[#F4F6F0] shadow-inner w-full max-w-[384px] shrink-0">
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            onMouseDown={handleCanvasClickOrTouch}
            onTouchStart={handleCanvasClickOrTouch}
            className="block w-full h-auto cursor-pointer"
            style={{ imageRendering: 'pixelated', touchAction: 'none' }}
          />

          {/* Floating Action Button (Hand Icon) - Mobile Ergonomic Overlay */}
          <button 
            onClick={(e) => {
              e.stopPropagation() // Prevent click walk trigger
              handleInteract()
            }}
            className="rpg-control-btn absolute bottom-4 right-4 w-12 h-12 rounded-full bg-[#f5c842]/90 hover:bg-[#f5c842] active:scale-95 text-slate-900 font-bold flex items-center justify-center shadow-lg border border-white/40 cursor-pointer transition-all md:hidden z-20"
            title="Interagir / Abrir Baú"
          >
            <span className="text-2xl leading-none">🖐️</span>
          </button>
        </div>

        {/* Game Controls Guide & Action Menu */}
        <div className="w-full flex-1 grid grid-cols-1 gap-4 items-start">
          <div className="bg-muted p-4 rounded-2xl border border-border space-y-2 text-xs">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              🎮 Exploração de Mundo Aberto
            </h4>
            <div className="space-y-1.5 text-muted-foreground leading-relaxed">
              <p>Mova-se com as teclas <kbd className="px-1 py-0.5 bg-card rounded border text-[10px]">W</kbd><kbd className="px-1 py-0.5 bg-card rounded border text-[10px]">A</kbd><kbd className="px-1 py-0.5 bg-card rounded border text-[10px]">S</kbd><kbd className="px-1 py-0.5 bg-card rounded border text-[10px]">D</kbd> ou toque diretamente no gramado.</p>
              <p><strong>Caminhos Desbloqueáveis:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 pl-1 font-medium">
                <li className={isNorthLocked ? 'text-red-500' : 'text-green-600'}>
                  Estrada Norte (Cerejeiras): {isNorthLocked ? '🔒 Bloqueado (Meta: 5 registros ou 3 dias streak)' : '🔓 Liberado!'}
                </li>
                <li className={isEastLocked ? 'text-red-500' : 'text-green-600'}>
                  Estrada Leste (Vale de Outono): {isEastLocked ? '🔒 Bloqueado (Meta: 10 registros ou 5 dias streak)' : '🔓 Liberado!'}
                </li>
              </ul>
              <p className="mt-1">Registros totais no diário: <strong className="text-foreground">{entriesCount} salvos</strong>.</p>
            </div>
          </div>

          {/* Controls: Virtual D-Pad visible on both Mobile and Desktop */}
          <div className="flex flex-col items-center pt-2 w-full">
            <span className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wide">Controles do Painel</span>
            <div className="grid grid-cols-3 gap-2 w-32">
              <div />
              <button 
                onMouseDown={() => startVirtualMove('up')}
                onMouseUp={() => stopVirtualMove('up')}
                onMouseLeave={() => stopVirtualMove('up')}
                onTouchStart={(e) => { e.preventDefault(); startVirtualMove('up'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopVirtualMove('up'); }}
                className="rpg-control-btn rpg-dpad-arrow w-10 h-10 rounded-xl bg-[#eef2f6] active:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
                title="Mover para Cima"
              >
                <ArrowUp className="w-5 h-5 text-gray-800" />
              </button>
              <div />

              <button 
                onMouseDown={() => startVirtualMove('left')}
                onMouseUp={() => stopVirtualMove('left')}
                onMouseLeave={() => stopVirtualMove('left')}
                onTouchStart={(e) => { e.preventDefault(); startVirtualMove('left'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopVirtualMove('left'); }}
                className="rpg-control-btn rpg-dpad-arrow w-10 h-10 rounded-xl bg-[#eef2f6] active:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
                title="Mover para Esquerda"
              >
                <ArrowLeft className="w-5 h-5 text-gray-800" />
              </button>
              
              {/* Interaction Center Button (Hand Icon) */}
              <button 
                onClick={handleInteract}
                onTouchStart={(e) => { e.preventDefault(); handleInteract(); }}
                className="rpg-control-btn w-10 h-10 rounded-xl bg-[#f5c842] active:bg-[#e5b832] text-slate-900 font-bold flex items-center justify-center cursor-pointer shadow-md transition-all scale-105 active:scale-95"
                title="Interagir / Abrir Baú"
              >
                <span className="text-lg">🖐️</span>
              </button>
              
              <button 
                onMouseDown={() => startVirtualMove('right')}
                onMouseUp={() => stopVirtualMove('right')}
                onMouseLeave={() => stopVirtualMove('right')}
                onTouchStart={(e) => { e.preventDefault(); startVirtualMove('right'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopVirtualMove('right'); }}
                className="rpg-control-btn rpg-dpad-arrow w-10 h-10 rounded-xl bg-[#eef2f6] active:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
                title="Mover para Direita"
              >
                <ArrowRight className="w-5 h-5 text-gray-800" />
              </button>

              <div />
              <button 
                onMouseDown={() => startVirtualMove('down')}
                onMouseUp={() => stopVirtualMove('down')}
                onMouseLeave={() => stopVirtualMove('down')}
                onTouchStart={(e) => { e.preventDefault(); startVirtualMove('down'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopVirtualMove('down'); }}
                className="rpg-control-btn rpg-dpad-arrow w-10 h-10 rounded-xl bg-[#eef2f6] active:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
                title="Mover para Baixo"
              >
                <ArrowDown className="w-5 h-5 text-gray-800" />
              </button>
              <div />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
