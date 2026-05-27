'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FLOWERS } from '@/lib/flowers'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import { toast } from 'sonner'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles, Trophy } from 'lucide-react'

// Game Canvas Dimensions
const CANVAS_WIDTH = 384
const CANVAS_HEIGHT = 288
const PLAYER_SPEED = 2.2
const PLAYER_COLLISION_RADIUS = 9

interface Chest {
  id: string
  x: number // Pixel X
  y: number // Pixel Y
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
}

interface FlowerDetail {
  x: number
  y: number
  color: string
}

export function GardenRPG({ entriesCount, streak }: { entriesCount: number; streak: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Game state refs (prevents react re-render overhead at 60fps)
  const pxRef = useRef(100) // Start pixel X
  const pyRef = useRef(144) // Start pixel Y
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
  
  // Chest configuration
  const [chests, setChests] = useState<Chest[]>([
    { id: 'chest1', x: 50, y: 60, requiredEntries: 3, flowerId: 'orquidea', isOpened: false },
    { id: 'chest2', x: 190, y: 60, requiredEntries: 7, flowerId: 'lirio', isOpened: false },
    { id: 'chest3', x: 50, y: 220, requiredEntries: 14, flowerId: 'violeta', isOpened: false },
    { id: 'chest4', x: 330, y: 60, requiredEntries: 21, flowerId: 'hibisco', isOpened: false },
    { id: 'chest5', x: 190, y: 220, requiredEntries: 30, flowerId: 'trevo', isOpened: false },
  ])

  // Static organic trees
  const trees = useRef<StaticTree[]>([
    { x: 30, y: 30, r: 12, visualR: 24 },
    { x: 110, y: 25, r: 12, visualR: 22 },
    { x: 270, y: 30, r: 12, visualR: 24 },
    { x: 350, y: 25, r: 12, visualR: 22 },
    { x: 30, y: 260, r: 12, visualR: 24 },
    { x: 110, y: 265, r: 12, visualR: 22 },
    { x: 270, y: 260, r: 12, visualR: 24 },
    { x: 350, y: 265, r: 12, visualR: 22 },
    // Grouped central tree
    { x: 300, y: 150, r: 14, visualR: 28 },
  ])

  // Water pond collider
  const pond = { x: 260, y: 80, w: 100, h: 50 }

  // Scattered decorative flowers
  const decFlowers = useRef<FlowerDetail[]>([
    { x: 80, y: 80, color: '#f43f5e' },
    { x: 150, y: 110, color: '#eab308' },
    { x: 220, y: 80, color: '#a855f7' },
    { x: 120, y: 200, color: '#ec4899' },
    { x: 80, y: 160, color: '#3b82f6' },
    { x: 240, y: 210, color: '#f43f5e' },
  ])

  // Load user's unlocked flowers on mount
  useEffect(() => {
    async function loadUnlocked() {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        if (res.ok && data.user) {
          const unlocked = data.user.flores_desbloqueadas || ['semente']
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
  }, [])

  // Physics & Collisions Check
  const checkCollision = (x: number, y: number) => {
    // 1. Boundary check
    if (x < PLAYER_COLLISION_RADIUS || x > CANVAS_WIDTH - PLAYER_COLLISION_RADIUS) return true
    if (y < PLAYER_COLLISION_RADIUS || y > CANVAS_HEIGHT - PLAYER_COLLISION_RADIUS) return true

    // 2. Tree collisions (circular)
    for (const tree of trees.current) {
      const dx = x - tree.x
      const dy = y - tree.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < tree.r + PLAYER_COLLISION_RADIUS) {
        return true
      }
    }

    // 3. Pond collision (rectangular)
    const px = Math.max(pond.x, Math.min(x, pond.x + pond.w))
    const py = Math.max(pond.y, Math.min(y, pond.y + pond.h))
    const distPond = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
    if (distPond < PLAYER_COLLISION_RADIUS) return true

    // 4. Chest collisions (rectangular/box)
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

  // Interacting with near chests
  const handleInteract = async () => {
    const px = pxRef.current
    const py = pyRef.current
    
    // Find closest chest
    let closestChest: Chest | null = null
    let minDist = 40 // Interaction threshold distance (pixels)

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
      // Trigger Speech bubble above character
      const needed = targetChest.requiredEntries - entriesCount
      bubbleTextRef.current = `Preciso de +${needed} registros!`
      bubbleTimerRef.current = 150 // Display for 150 frames (~2.5s)
      return
    }

    // Unlock chest
    SensoryAudio.play('mc-levelup')
    createChestSparkles(targetChest.x, targetChest.y)

    setChests(prev => prev.map(c => c.id === targetChest.id ? { ...c, isOpened: true } : c))
    
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

  // Virtual controller simulation triggers
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

      // Keyboard & virtual direction inputs
      if (keysRef.current['arrowup'] || keysRef.current['w'] || keysRef.current['up']) {
        dy = -PLAYER_SPEED
        playerDirRef.current = 'up'
      }
      if (keysRef.current['arrowdown'] || keysRef.current['s'] || keysRef.current['down']) {
        dy = PLAYER_SPEED
        playerDirRef.current = 'down'
      }
      if (keysRef.current['arrowleft'] || keysRef.current['a'] || keysRef.current['left']) {
        dx = -PLAYER_SPEED
        playerDirRef.current = 'left'
      }
      if (keysRef.current['arrowright'] || keysRef.current['d'] || keysRef.current['right']) {
        dx = PLAYER_SPEED
        playerDirRef.current = 'right'
      }

      // Check walking cycle
      if (dx !== 0 || dy !== 0) {
        isWalkingRef.current = true
        walkCycleRef.current += 0.2
        
        // Audio tick (optional subtle click/walk sound)
        if (Math.floor(walkCycleRef.current) % 15 === 0 && Math.random() < 0.1) {
          SensoryAudio.play('water-drop')
        }

        // Try movement with sliding collision resolution
        const newX = pxRef.current + dx
        const newY = pyRef.current + dy

        if (!checkCollision(newX, newY)) {
          pxRef.current = newX
          pyRef.current = newY
        } else if (!checkCollision(newX, pyRef.current)) {
          pxRef.current = newX // Slide horizontally
        } else if (!checkCollision(pxRef.current, newY)) {
          pyRef.current = newY // Slide vertically
        }
      } else {
        isWalkingRef.current = false
      }

      // Update bubble timer
      if (bubbleTimerRef.current > 0) {
        bubbleTimerRef.current--
        if (bubbleTimerRef.current === 0) {
          bubbleTextRef.current = null
        }
      }
    }

    const render = () => {
      updatePhysics()

      // 1. Draw Ground (Pastel comfort green)
      ctx.fillStyle = '#dcfce7'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw decorative tufts and tiny grass pixels
      ctx.fillStyle = '#bbf7d0'
      for (let i = 0; i < CANVAS_WIDTH; i += 24) {
        for (let j = 0; j < CANVAS_HEIGHT; j += 24) {
          // pseudo-random but static offsets
          const ox = (i * 7 + j * 13) % 12
          const oy = (i * 3 + j * 17) % 12
          ctx.fillRect(i + ox, j + oy, 2, 2)
          ctx.fillRect(i + ox + 3, j + oy + 1, 1, 2)
        }
      }

      // 2. Draw Organic Sinuous Path (Dirt/Sand)
      ctx.fillStyle = '#fef08a' // Soft pastel sand yellow
      // Draw path curves
      ctx.beginPath()
      ctx.moveTo(80, 0)
      ctx.quadraticCurveTo(110, 100, 120, 144)
      ctx.quadraticCurveTo(130, 200, 100, CANVAS_HEIGHT)
      ctx.lineWidth = 26
      ctx.strokeStyle = '#fef08a'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      
      // Secondary path to pond
      ctx.beginPath()
      ctx.moveTo(120, 144)
      ctx.quadraticCurveTo(200, 144, 255, 110)
      ctx.lineWidth = 20
      ctx.strokeStyle = '#fef08a'
      ctx.stroke()

      // Draw path texture details (pebbles/dirt specs)
      ctx.fillStyle = '#eab308'
      ctx.fillRect(96, 60, 2, 2)
      ctx.fillRect(114, 120, 3, 2)
      ctx.fillRect(160, 140, 2, 2)
      ctx.fillRect(220, 130, 2, 2)

      // 3. Draw Water Pond
      ctx.fillStyle = '#93c5fd' // Pond background
      ctx.beginPath()
      ctx.ellipse(pond.x + pond.w / 2, pond.y + pond.h / 2, pond.w / 2, pond.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.lineWidth = 3
      ctx.strokeStyle = '#60a5fa' // Pond outline
      ctx.stroke()

      // Draw water lilies/ripples
      ctx.fillStyle = '#10b981'
      ctx.fillRect(pond.x + 30, pond.y + 15, 6, 4)
      ctx.fillRect(pond.x + 60, pond.y + 30, 8, 4)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(pond.x + 32, pond.y + 13, 2, 2) // tiny lotus flower

      // 4. Draw Scattered Decorative Flowers
      decFlowers.current.forEach(f => {
        ctx.fillStyle = f.color
        ctx.fillRect(f.x, f.y, 4, 4)
        ctx.fillRect(f.x - 2, f.y + 2, 2, 2)
        ctx.fillRect(f.x + 4, f.y + 2, 2, 2)
        ctx.fillRect(f.x + 1, f.y + 5, 2, 2)
        ctx.fillStyle = '#f5c842' // center
        ctx.fillRect(f.x + 1, f.y + 2, 2, 2)
      })

      // 5. Draw Chests
      chests.forEach(chest => {
        // Draw Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.fillRect(chest.x - 12, chest.y + 4, 24, 8)

        if (chest.isOpened) {
          // Open Chest
          ctx.fillStyle = '#71717a' // Base
          ctx.fillRect(chest.x - 10, chest.y - 2, 20, 12)
          ctx.fillStyle = '#a1a1aa' // Lid back
          ctx.fillRect(chest.x - 12, chest.y - 8, 24, 6)
          ctx.fillStyle = '#e4e4e7'
          ctx.fillRect(chest.x - 6, chest.y - 2, 12, 2) // open inside shine
        } else {
          // Closed Chest
          ctx.fillStyle = '#b45309' // Brown chest body
          ctx.fillRect(chest.x - 10, chest.y - 6, 20, 14)
          ctx.fillStyle = '#78350f' // Lid lid top
          ctx.fillRect(chest.x - 12, chest.y - 10, 24, 5)
          
          // Iron bands
          ctx.fillStyle = '#4b5563'
          ctx.fillRect(chest.x - 8, chest.y - 10, 2, 18)
          ctx.fillRect(chest.x + 6, chest.y - 10, 2, 18)
          
          // Gold latch
          ctx.fillStyle = '#fbbf24'
          ctx.fillRect(chest.x - 2, chest.y - 2, 4, 5)
          
          // Stand indicator / hint bubble when player is close
          const dx = chest.x - pxRef.current
          const dy = chest.y - pyRef.current
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 32) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
            ctx.fillRect(chest.x - 14, chest.y - 26, 28, 11)
            ctx.fillStyle = '#1e293b'
            ctx.font = 'bold 8px sans-serif'
            ctx.fillText('SPACE', chest.x - 12, chest.y - 18)
          }
        }
      })

      // 6. Draw Player (Animated sprout gardener)
      const px = pxRef.current
      const py = pyRef.current

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.beginPath()
      ctx.ellipse(px, py + 14, 8, 3, 0, 0, Math.PI * 2)
      ctx.fill()

      // Walk cycle calculations
      const bobY = isWalkingRef.current ? Math.sin(walkCycleRef.current) * 2.5 : 0
      const legOffset = isWalkingRef.current ? Math.sin(walkCycleRef.current) * 3 : 0

      // Sprout Body (Paste Green Drop)
      ctx.fillStyle = '#4ade80'
      ctx.beginPath()
      ctx.arc(px, py + 4 + bobY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // Face details (blushing and eyes)
      ctx.fillStyle = '#f472b6' // Blush pink cheeks
      ctx.fillRect(px - 6, py + 5 + bobY, 2, 2)
      ctx.fillRect(px + 4, py + 5 + bobY, 2, 2)

      ctx.fillStyle = '#1e293b' // Eyes
      if (playerDirRef.current === 'down') {
        ctx.fillRect(px - 4, py + 2 + bobY, 2, 2)
        ctx.fillRect(px + 2, py + 2 + bobY, 2, 2)
      } else if (playerDirRef.current === 'left') {
        ctx.fillRect(px - 5, py + 2 + bobY, 2, 2)
      } else if (playerDirRef.current === 'right') {
        ctx.fillRect(px + 3, py + 2 + bobY, 2, 2)
      }

      // Draw tiny brown gardener overalls
      ctx.fillStyle = '#78350f'
      ctx.fillRect(px - 6, py + 8 + bobY, 12, 5)

      // Tiny moving feet/legs
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(px - 4, py + 12 + (isWalkingRef.current ? legOffset : 0), 2, 2)
      ctx.fillRect(px + 2, py + 12 + (isWalkingRef.current ? -legOffset : 0), 2, 2)

      // Sprout head leaf (moves dynamically)
      const leafAngle = isWalkingRef.current ? Math.sin(walkCycleRef.current) * 0.25 : 0
      ctx.save()
      ctx.translate(px, py - 4 + bobY)
      ctx.rotate(leafAngle)
      ctx.fillStyle = '#15803d' // Dark forest green leaf
      ctx.beginPath()
      ctx.ellipse(0, -3, 3, 5, Math.PI / 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // 7. Draw Sparkle Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05 // Gravity
        p.alpha = Math.max(0, p.alpha - 0.02)
        p.life--
        
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fillRect(p.x, p.y, 3, 3)
        ctx.globalAlpha = 1.0
        
        return p.life > 0
      })

      // 8. Draw Organic Speech Bubble
      if (bubbleTextRef.current) {
        const text = bubbleTextRef.current
        ctx.font = 'bold 9px sans-serif'
        const textWidth = ctx.measureText(text).width
        const bw = textWidth + 14
        const bh = 18
        const bx = px - bw / 2
        const by = py - 32 + bobY

        // Speech Bubble Box
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#1e293b'
        ctx.lineWidth = 1.5
        
        // Rounded Rect
        ctx.beginPath()
        ctx.roundRect(bx, by, bw, bh, 6)
        ctx.fill()
        ctx.stroke()

        // Pointer triangle at bottom
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

        // Text
        ctx.fillStyle = '#1e293b'
        ctx.fillText(text, bx + 7, by + 12)
      }

      // 9. Draw Organic Trees (Pastel clumping forest layer)
      trees.current.forEach(tree => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.beginPath()
        ctx.ellipse(tree.x, tree.y + 12, tree.visualR - 4, 6, 0, 0, Math.PI * 2)
        ctx.fill()

        // Trunk
        ctx.fillStyle = '#78350f'
        ctx.fillRect(tree.x - 4, tree.y, 8, 14)

        // Leafy Crown (soft green)
        ctx.fillStyle = '#22c55e'
        ctx.beginPath()
        ctx.arc(tree.x, tree.y - 8, tree.visualR, 0, Math.PI * 2)
        ctx.fill()
        
        // Highlight layer
        ctx.fillStyle = '#4ade80'
        ctx.beginPath()
        ctx.arc(tree.x - 4, tree.y - 12, tree.visualR - 6, 0, Math.PI * 2)
        ctx.fill()
      })

      // Frame request
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationFrameId)
  }, [chests, entriesCount])

  return (
    <Card className="bg-card border-0 shadow-sm rounded-3xl p-6 space-y-4">
      <CardHeader className="p-0 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary animate-bounce" />
              Exploração Botânica: O Jardim Seguro
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Explore o bosque pixelizado. Aproxime-se dos baús e aperte ESPAÇO ou clique no botão interagir (🖐️) para ver se tem registros suficientes!
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-[#f0fdf4] border border-green-100 rounded-xl py-1 px-3">
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">🔥 Streak</span>
            <span className="bg-green-200 text-green-800 text-xs font-black px-2 py-0.5 rounded-md">
              {streak} dias
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col md:flex-row gap-6 items-center">
        {/* Game Canvas Board */}
        <div className="relative border-4 border-[#5ed8c0] rounded-2xl overflow-hidden bg-[#dcfce7] shadow-inner max-w-full">
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            className="block max-w-full mx-auto"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Game Controls Guide & Action Menu */}
        <div className="flex-1 w-full space-y-4">
          <div className="bg-muted p-4 rounded-2xl border border-border space-y-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              🎮 Controles de Exploração
            </h4>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1.5 leading-relaxed font-medium">
              <li>Use as setas do teclado ou as teclas <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">W</kbd> <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">A</kbd> <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">S</kbd> <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">D</kbd> para caminhar livremente em qualquer direção.</li>
              <li>Aproxime-se de um baú e aperte a tecla <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">SPACE</kbd> ou toque no botão central <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">🖐️</kbd> para interagir.</li>
              <li>Cada baú requer uma meta de registros no diário (<strong>{entriesCount} salvos</strong>) para liberar flores raras.</li>
            </ul>
          </div>

          {/* Virtual D-Pad for mobile responsiveness */}
          <div className="flex flex-col items-center pt-2">
            <span className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wide">Controle Móvel (D-Pad)</span>
            <div className="grid grid-cols-3 gap-2 w-32">
              <div />
              <button 
                onMouseDown={() => startVirtualMove('up')}
                onMouseUp={() => stopVirtualMove('up')}
                onMouseLeave={() => stopVirtualMove('up')}
                onTouchStart={(e) => { e.preventDefault(); startVirtualMove('up') }}
                onTouchEnd={(e) => { e.preventDefault(); stopVirtualMove('up') }}
                className="w-10 h-10 rounded-xl bg-[#eef2f6] active:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />

              <button 
                onMouseDown={() => startVirtualMove('left')}
                onMouseUp={() => stopVirtualMove('left')}
                onMouseLeave={() => stopVirtualMove('left')}
                onTouchStart={(e) => { e.preventDefault(); startVirtualMove('left') }}
                onTouchEnd={(e) => { e.preventDefault(); stopVirtualMove('left') }}
                className="w-10 h-10 rounded-xl bg-[#eef2f6] active:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {/* Interaction Center Button (Hand Icon) */}
              <button 
                onClick={handleInteract}
                className="w-10 h-10 rounded-xl bg-[#f5c842] active:bg-[#e5b832] text-slate-900 font-bold flex items-center justify-center cursor-pointer shadow-md transition-all scale-105 active:scale-95"
                title="Interagir / Abrir Baú"
              >
                <span className="text-lg">🖐️</span>
              </button>
              
              <button 
                onMouseDown={() => startVirtualMove('right')}
                onMouseUp={() => stopVirtualMove('right')}
                onMouseLeave={() => stopVirtualMove('right')}
                onTouchStart={(e) => { e.preventDefault(); startVirtualMove('right') }}
                onTouchEnd={(e) => { e.preventDefault(); stopVirtualMove('right') }}
                className="w-10 h-10 rounded-xl bg-[#eef2f6] active:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div />
              <button 
                onMouseDown={() => startVirtualMove('down')}
                onMouseUp={() => stopVirtualMove('down')}
                onMouseLeave={() => stopVirtualMove('down')}
                onTouchStart={(e) => { e.preventDefault(); startVirtualMove('down') }}
                onTouchEnd={(e) => { e.preventDefault(); stopVirtualMove('down') }}
                className="w-10 h-10 rounded-xl bg-[#eef2f6] active:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <div />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
