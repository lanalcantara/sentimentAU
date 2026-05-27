'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FLOWERS } from '@/lib/flowers'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import { toast } from 'sonner'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles, Trophy, Lock } from 'lucide-react'

// Game Grid Settings
const COLS = 12
const ROWS = 9
const TILE_SIZE = 32 // 32x32px tiles
const CANVAS_WIDTH = COLS * TILE_SIZE // 384px
const CANVAS_HEIGHT = ROWS * TILE_SIZE // 288px

interface Chest {
  id: string
  x: number
  y: number
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

export function GardenRPG({ entriesCount, streak }: { entriesCount: number; streak: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Game states
  const [playerX, setPlayerX] = useState(1) // Start tile X
  const [playerY, setPlayerY] = useState(4) // Start tile Y
  const [playerDir, setPlayerDir] = useState<'down' | 'up' | 'left' | 'right'>('down')
  const [isMoving, setIsMoving] = useState(false)
  const [unlockedFlowers, setUnlockedFlowers] = useState<string[]>([])
  
  // Chest configuration
  const [chests, setChests] = useState<Chest[]>([
    { id: 'chest1', x: 1, y: 1, requiredEntries: 3, flowerId: 'orquidea', isOpened: false },
    { id: 'chest2', x: 10, y: 1, requiredEntries: 7, flowerId: 'lirio', isOpened: false },
    { id: 'chest3', x: 1, y: 7, requiredEntries: 14, flowerId: 'violeta', isOpened: false },
    { id: 'chest4', x: 10, y: 7, requiredEntries: 21, flowerId: 'hibisco', isOpened: false },
    { id: 'chest5', x: 5, y: 1, requiredEntries: 30, flowerId: 'trevo', isOpened: false },
  ])

  // Particles for opening animation
  const particlesRef = useRef<Particle[]>([])

  // Load user's unlocked flowers on mount
  useEffect(() => {
    async function loadUnlocked() {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        if (res.ok && data.user) {
          const unlocked = data.user.flores_desbloqueadas || ['semente']
          setUnlockedFlowers(unlocked)
          
          // Mark chests as opened if already in user's profile
          setChests(prev => prev.map(c => ({
            ...c,
            isOpened: unlocked.includes(c.flowerId)
          })))
        }
      } catch (err) {
        console.error('Failed to load profile for RPG minigame', err)
      }
    }
    loadUnlocked()
  }, [])

  // Map Tile Design Definition
  // 0: Grass (Walkable)
  // 1: Path (Walkable)
  // 2: Trees (Wall/Obstacle)
  // 3: Water (Wall/Obstacle)
  // 4: Fence (Wall/Obstacle)
  // 5: Barrier 1 (Blocks Chest 2, clears at entries >= 7)
  // 6: Barrier 2 (Blocks Chest 3, clears at entries >= 14)
  // 7: Barrier 3 (Blocks Chest 4, clears at entries >= 21)
  // 8: Barrier 4 (Blocks Chest 5, clears at entries >= 30)
  const mapData = [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 0, 1, 0, 0, 0, 0, 0, 0, 5, 0, 2],
    [2, 0, 1, 0, 2, 2, 2, 2, 0, 2, 0, 2],
    [2, 0, 1, 0, 2, 3, 3, 2, 0, 2, 0, 2],
    [2, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 2],
    [2, 0, 1, 0, 2, 3, 3, 2, 0, 2, 0, 2],
    [2, 6, 1, 0, 2, 2, 2, 2, 0, 2, 7, 2],
    [2, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
  ]

  // Check if tile is walkable
  const isTileWalkable = (x: number, y: number) => {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false
    const tileType = mapData[y][x]
    
    // Chest tiles are obstacles unless already opened (even then, keep them solid so you click/stand next to them)
    const isChest = chests.some(c => c.x === x && c.y === y)
    if (isChest) return false

    if (tileType === 2 || tileType === 3 || tileType === 4) return false
    
    // Dynamic gates/barriers based on total entries milestones
    if (tileType === 5 && entriesCount < 7) return false
    if (tileType === 6 && entriesCount < 14) return false
    if (tileType === 7 && entriesCount < 21) return false
    if (tileType === 8 && entriesCount < 30) return false
    
    return true
  }

  // Handle Movement Logic
  const movePlayer = (dx: number, dy: number, dir: 'up' | 'down' | 'left' | 'right') => {
    setPlayerDir(dir)
    const targetX = playerX + dx
    const targetY = playerY + dy
    
    if (isTileWalkable(targetX, targetY)) {
      SensoryAudio.play('bubble')
      setIsMoving(true)
      setPlayerX(targetX)
      setPlayerY(targetY)
      setTimeout(() => setIsMoving(false), 120)
    }
  }

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMoving) return
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          movePlayer(0, -1, 'up')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          movePlayer(0, 1, 'down')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          movePlayer(-1, 0, 'left')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          movePlayer(1, 0, 'right')
          break
        case ' ':
          e.preventDefault()
          handleInteract()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [playerX, playerY, isMoving, chests, entriesCount])

  // Sparkles Generator
  const createChestSparkles = (cx: number, cy: number) => {
    const colors = ['#f5c842', '#a5f3fc', '#f472b6', '#34d399', '#fb7185']
    const px = cx * TILE_SIZE + TILE_SIZE / 2
    const py = cy * TILE_SIZE + TILE_SIZE / 2
    
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 4
      particlesRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 30 + Math.floor(Math.random() * 20)
      })
    }
  }

  // Handle interacting (opening chests)
  const handleInteract = async () => {
    // Check if player is standing next to any chest
    const adjacentChests = chests.filter(c => {
      const dist = Math.abs(c.x - playerX) + Math.abs(c.y - playerY)
      return dist === 1
    })

    if (adjacentChests.length === 0) {
      toast.info('Aproxime-se de um baú para interagir!')
      return
    }

    const targetChest = adjacentChests[0]

    if (targetChest.isOpened) {
      toast.success('Este baú já foi aberto!')
      return
    }

    if (entriesCount < targetChest.requiredEntries) {
      SensoryAudio.play('mc-anvil')
      toast.error(`Este baú requer pelo menos ${targetChest.requiredEntries} registros no diário! (Você tem ${entriesCount})`)
      return
    }

    // Success: Unlock the flower!
    SensoryAudio.play('mc-levelup')
    createChestSparkles(targetChest.x, targetChest.y)

    // Mark as opened locally
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

  // Animation Loop / Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.imageSmoothingEnabled = false

    let animationFrameId: number

    const render = () => {
      // Clear Screen
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // 1. Draw Map Tiles
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const type = mapData[r][c]
          const x = c * TILE_SIZE
          const y = r * TILE_SIZE

          if (type === 2) {
            // Tree Obstacle (Zen Green and trunk)
            ctx.fillStyle = '#65a30d' // Green crown
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 6)
            ctx.fillStyle = '#78350f' // Trunk
            ctx.fillRect(x + 12, y + TILE_SIZE - 4, 8, 4)
          } else if (type === 3) {
            // Water (Zen light blue)
            ctx.fillStyle = '#93c5fd'
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
            // Water ripples
            ctx.fillStyle = '#60a5fa'
            ctx.fillRect(x + 6, y + 10, 8, 2)
            ctx.fillRect(x + 18, y + 22, 8, 2)
          } else if (type === 5 && entriesCount < 7) {
            // Thorns / Barriers (Reddish spikes)
            ctx.fillStyle = '#b45309'
            ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8)
            ctx.fillStyle = '#991b1b'
            ctx.fillRect(x + 10, y + 10, 12, 12)
          } else if (type === 6 && entriesCount < 14) {
            ctx.fillStyle = '#b45309'
            ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8)
            ctx.fillStyle = '#991b1b'
            ctx.fillRect(x + 10, y + 10, 12, 12)
          } else if (type === 7 && entriesCount < 21) {
            ctx.fillStyle = '#b45309'
            ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8)
            ctx.fillStyle = '#991b1b'
            ctx.fillRect(x + 10, y + 10, 12, 12)
          } else if (type === 8 && entriesCount < 30) {
            ctx.fillStyle = '#b45309'
            ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8)
            ctx.fillStyle = '#991b1b'
            ctx.fillRect(x + 10, y + 10, 12, 12)
          } else if (type === 1) {
            // Dirt Path
            ctx.fillStyle = '#eab308' // Pastel sand yellow
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
            // Path pebbles
            ctx.fillStyle = '#ca8a04'
            ctx.fillRect(x + 8, y + 8, 2, 2)
            ctx.fillRect(x + 20, y + 18, 3, 2)
          } else {
            // Grass
            ctx.fillStyle = '#86efac' // Pastel green
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
            // Tiny grass tufts
            ctx.fillStyle = '#4ade80'
            ctx.fillRect(x + 4, y + 6, 2, 4)
            ctx.fillRect(x + 18, y + 20, 2, 4)
          }
        }
      }

      // 2. Draw Barriers Text Labels overlay (if locked)
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const type = mapData[r][c]
          const x = c * TILE_SIZE
          const y = r * TILE_SIZE
          
          if (type === 5 && entriesCount < 7) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
            ctx.fillStyle = '#fff'
            ctx.font = '8px monospace'
            ctx.fillText('🔒 7', x + 4, y + 20)
          } else if (type === 6 && entriesCount < 14) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
            ctx.fillStyle = '#fff'
            ctx.font = '8px monospace'
            ctx.fillText('🔒 14', x + 2, y + 20)
          } else if (type === 7 && entriesCount < 21) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
            ctx.fillStyle = '#fff'
            ctx.font = '8px monospace'
            ctx.fillText('🔒 21', x + 2, y + 20)
          } else if (type === 8 && entriesCount < 30) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
            ctx.fillStyle = '#fff'
            ctx.font = '8px monospace'
            ctx.fillText('🔒 30', x + 2, y + 20)
          }
        }
      }

      // 3. Draw Chests
      chests.forEach(chest => {
        const x = chest.x * TILE_SIZE
        const y = chest.y * TILE_SIZE

        if (chest.isOpened) {
          // Open Chest (Grayish opened box)
          ctx.fillStyle = '#71717a'
          ctx.fillRect(x + 4, y + 10, TILE_SIZE - 8, TILE_SIZE - 14)
          ctx.fillStyle = '#d4d4d8' // Lid tilted back
          ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 8)
        } else {
          // Closed Chest (Wooden brown box)
          ctx.fillStyle = '#a16207'
          ctx.fillRect(x + 4, y + 6, TILE_SIZE - 8, TILE_SIZE - 12)
          // Golden clasp
          ctx.fillStyle = '#f5c842'
          ctx.fillRect(x + 14, y + 16, 4, 6)
          // Iron bands
          ctx.fillStyle = '#4b5563'
          ctx.fillRect(x + 6, y + 6, 2, TILE_SIZE - 12)
          ctx.fillRect(x + TILE_SIZE - 8, y + 6, 2, TILE_SIZE - 12)
          
          // Lock symbol if player has insufficient entries
          if (entriesCount < chest.requiredEntries) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
            ctx.fillRect(x + 4, y + 6, TILE_SIZE - 8, TILE_SIZE - 12)
            ctx.fillStyle = '#ef4444'
            ctx.font = '10px sans-serif'
            ctx.fillText('🔒', x + 10, y + 20)
          }
        }
      })

      // 4. Draw Player (Gardener Sprite)
      const px = playerX * TILE_SIZE
      const py = playerY * TILE_SIZE
      
      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.beginPath()
      ctx.ellipse(px + 16, py + 28, 10, 4, 0, 0, Math.PI * 2)
      ctx.fill()

      // Character body (Zen blue overalls)
      ctx.fillStyle = '#0284c7'
      ctx.fillRect(px + 8, py + 14, 16, 14)

      // Character head / face (Peach tone)
      ctx.fillStyle = '#fed7aa'
      ctx.fillRect(px + 10, py + 6, 12, 8)

      // Eyes based on direction
      ctx.fillStyle = '#1e293b'
      if (playerDir === 'down') {
        ctx.fillRect(px + 12, py + 9, 2, 2)
        ctx.fillRect(px + 18, py + 9, 2, 2)
      } else if (playerDir === 'left') {
        ctx.fillRect(px + 11, py + 9, 2, 2)
      } else if (playerDir === 'right') {
        ctx.fillRect(px + 19, py + 9, 2, 2)
      }

      // Straw Hat (Yellow/tan)
      ctx.fillStyle = '#eab308'
      ctx.fillRect(px + 4, py + 2, 24, 4) // Hat brim
      ctx.fillStyle = '#ca8a04'
      ctx.fillRect(px + 10, py - 1, 12, 3) // Hat cap

      // 5. Draw Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05 // Gravity effect
        p.alpha = Math.max(0, p.alpha - 0.03)
        p.life--
        
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fillRect(p.x, p.y, 3, 3)
        ctx.globalAlpha = 1.0 // Reset alpha
        
        return p.life > 0
      })

      // Frame continuation
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationFrameId)
  }, [playerX, playerY, playerDir, chests, entriesCount])

  return (
    <Card className="bg-card border-0 shadow-sm rounded-3xl p-6 space-y-4">
      <CardHeader className="p-0 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              RPG Botânico: O Jardim Seguro
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Explore o jardim em pixel art. O total de registros limpa barreiras e libera baús contendo flores raras!
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
        <div className="relative border-4 border-[#5ed8c0] rounded-2xl overflow-hidden bg-[#86efac] shadow-inner max-w-full">
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
              🎮 Instruções de Jogo
            </h4>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1.5 leading-relaxed font-medium">
              <li>Use as setas do teclado ou as teclas <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">W</kbd> <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">A</kbd> <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">S</kbd> <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">D</kbd> para caminhar.</li>
              <li>Aproxime-se de um baú e clique em <strong>Abrir Baú</strong> ou aperte <kbd className="px-1.5 py-0.5 bg-card rounded border text-[10px]">SPACE</kbd>.</li>
              <li>Sua contagem total de registros do Supabase (<strong>{entriesCount} salvos</strong>) abre novas passagens de nível.</li>
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleInteract}
              className="w-full font-bold bg-[#f5c842] hover:bg-[#e5b832] text-slate-900 rounded-xl gap-2 shadow-sm cursor-pointer py-5"
            >
              <Sparkles className="w-4 h-4 fill-slate-900/10" />
              Abrir Baú Próximo
            </Button>
          </div>

          {/* Virtual D-Pad for mobile responsiveness */}
          <div className="flex flex-col items-center pt-2">
            <span className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wide">Controle Virtual (Mobile)</span>
            <div className="grid grid-cols-3 gap-2 w-28">
              <div />
              <button 
                onClick={() => movePlayer(0, -1, 'up')}
                className="w-8 h-8 rounded-lg bg-[#eef2f6] hover:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div />

              <button 
                onClick={() => movePlayer(-1, 0, 'left')}
                className="w-8 h-8 rounded-lg bg-[#eef2f6] hover:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 font-extrabold">🎮</div>
              <button 
                onClick={() => movePlayer(1, 0, 'right')}
                className="w-8 h-8 rounded-lg bg-[#eef2f6] hover:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div />
              <button 
                onClick={() => movePlayer(0, 1, 'down')}
                className="w-8 h-8 rounded-lg bg-[#eef2f6] hover:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <div />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
