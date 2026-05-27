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
}

interface FlowerDetail {
  x: number
  y: number
  color: string
}

export function GardenRPG({ entriesCount, streak }: { entriesCount: number; streak: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Matrix Coordinates for Multi-Screen World
  const [mapX, setMapX] = useState(0)
  const [mapY, setMapY] = useState(0)

  // Touch navigation targets
  const targetXRef = useRef<number | null>(null)
  const targetYRef = useRef<number | null>(null)

  // Relaxation Room overlay state
  const [showRelaxationRoom, setShowRelaxationRoom] = useState(false)

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
  
  // Chest configuration distributed across maps
  const [chests, setChests] = useState<Chest[]>([
    { id: 'chest1', x: 60, y: 70, mapX: 0, mapY: 0, requiredEntries: 3, flowerId: 'orquidea', isOpened: false },
    { id: 'chest2', x: 180, y: 220, mapX: 0, mapY: 0, requiredEntries: 7, flowerId: 'lirio', isOpened: false },
    { id: 'chest3', x: 70, y: 50, mapX: 0, mapY: 1, requiredEntries: 14, flowerId: 'violeta', isOpened: false },
    { id: 'chest4', x: 280, y: 160, mapX: 0, mapY: 1, requiredEntries: 21, flowerId: 'hibisco', isOpened: false },
    { id: 'chest5', x: 320, y: 70, mapX: 1, mapY: 0, requiredEntries: 30, flowerId: 'trevo', isOpened: false },
    { id: 'chest6', x: 180, y: 220, mapX: 1, mapY: 0, requiredEntries: 40, flowerId: 'girassol', isOpened: false },
  ])

  // Progress milestones for path unlocks
  const isNorthUnlocked = entriesCount >= 5 || streak >= 3
  const isEastUnlocked = entriesCount >= 10 || streak >= 5

  // Map Biomes Configuration
  const getMapData = (mx: number, my: number) => {
    if (mx === 0 && my === 0) {
      return {
        name: 'Clareira Central (Bosque Inicial)',
        description: 'Um bosque aconchegante com estradas de terra ligando as demais áreas.',
        bgColor: '#dcfce7', // Soft green
        tuftColor: '#bbf7d0',
        treeColor: '#22c55e',
        treeHighlight: '#4ade80',
        trees: [
          { x: 30, y: 30, r: 12, visualR: 24 },
          { x: 270, y: 30, r: 12, visualR: 24 },
          { x: 30, y: 260, r: 12, visualR: 24 },
          { x: 350, y: 265, r: 12, visualR: 22 },
          { x: 300, y: 150, r: 14, visualR: 28 },
        ],
        decFlowers: [
          { x: 80, y: 80, color: '#f43f5e' },
          { x: 150, y: 110, color: '#eab308' },
          { x: 220, y: 80, color: '#a855f7' },
          { x: 120, y: 200, color: '#ec4899' },
          { x: 80, y: 160, color: '#3b82f6' },
          { x: 240, y: 210, color: '#f43f5e' },
        ],
      }
    } else if (mx === 0 && my === 1) {
      return {
        name: 'Vale do Norte (Floresta do Rio)',
        description: 'Lindo vale com cerejeiras cor-de-rosa, um rio e uma ponte rústica de madeira.',
        bgColor: '#fdf2f8', // Soft pinkish grass
        tuftColor: '#fbcfe8',
        treeColor: '#f472b6',
        treeHighlight: '#fbcfe8',
        trees: [
          { x: 30, y: 35, r: 12, visualR: 24 },
          { x: 180, y: 40, r: 12, visualR: 24 },
          { x: 320, y: 35, r: 12, visualR: 24 },
          { x: 350, y: 70, r: 12, visualR: 22 },
          { x: 40, y: 250, r: 12, visualR: 22 },
          { x: 180, y: 260, r: 12, visualR: 24 },
          { x: 340, y: 250, r: 12, visualR: 22 },
        ],
        decFlowers: [
          { x: 50, y: 150, color: '#f472b6' },
          { x: 130, y: 60, color: '#fda4af' },
          { x: 230, y: 55, color: '#f472b6' },
          { x: 310, y: 170, color: '#fda4af' },
          { x: 140, y: 220, color: '#f472b6' },
        ],
      }
    } else {
      // mx === 1 && my === 0
      return {
        name: 'Vale do Leste (Outono & Jardim)',
        description: 'Um belo vale de outono com árvores laranjas, um lago e um lindo canteiro florido.',
        bgColor: '#fff7ed', // Soft orange/autumn grass
        tuftColor: '#ffedd5',
        treeColor: '#f97316',
        treeHighlight: '#fbbf24',
        trees: [
          { x: 40, y: 40, r: 12, visualR: 24 },
          { x: 160, y: 30, r: 12, visualR: 22 },
          { x: 300, y: 40, r: 12, visualR: 24 },
          { x: 30, y: 250, r: 12, visualR: 22 },
          { x: 110, y: 260, r: 12, visualR: 24 },
        ],
        decFlowers: [
          { x: 80, y: 200, color: '#f43f5e' },
          { x: 180, y: 180, color: '#a855f7' },
          { x: 50, y: 90, color: '#f5c842' },
        ],
      }
    }
  }

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
    // 1. Boundary & Screen-to-Screen transitions
    if (mapX === 0 && mapY === 0) {
      // Top Edge (North exit path)
      if (y < PLAYER_COLLISION_RADIUS) {
        if (x >= 75 && x <= 125) {
          if (isNorthLocked) return true
        } else {
          return true
        }
      }
      // Right Edge (East exit path)
      if (x > CANVAS_WIDTH - PLAYER_COLLISION_RADIUS) {
        if (y >= 115 && y <= 165) {
          if (isEastLocked) return true
        } else {
          return true
        }
      }
      // Bottom & Left Edges are always solid
      if (y > CANVAS_HEIGHT - PLAYER_COLLISION_RADIUS || x < PLAYER_COLLISION_RADIUS) return true
    } 
    else if (mapX === 0 && mapY === 1) {
      // North Map boundary check
      // Bottom Edge (exit back to center)
      if (y > CANVAS_HEIGHT - PLAYER_COLLISION_RADIUS) {
        if (!(x >= 75 && x <= 125)) return true
      }
      // Other edges are always solid
      if (y < PLAYER_COLLISION_RADIUS || x < PLAYER_COLLISION_RADIUS || x > CANVAS_WIDTH - PLAYER_COLLISION_RADIUS) return true
    } 
    else if (mapX === 1 && mapY === 0) {
      // East Map boundary check
      // Left Edge (exit back to center)
      if (x < PLAYER_COLLISION_RADIUS) {
        if (!(y >= 115 && y <= 165)) return true
      }
      // Other edges are always solid
      if (x > CANVAS_WIDTH - PLAYER_COLLISION_RADIUS || y < PLAYER_COLLISION_RADIUS || y > CANVAS_HEIGHT - PLAYER_COLLISION_RADIUS) return true
    }

    // 2. Map-Specific Obstacle Collisions
    if (mapX === 0 && mapY === 0) {
      // Pond collision (Center Map)
      const pond = { x: 260, y: 80, w: 100, h: 50 }
      const px = Math.max(pond.x, Math.min(x, pond.x + pond.w))
      const py = Math.max(pond.y, Math.min(y, pond.y + pond.h))
      const distPond = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
      if (distPond < PLAYER_COLLISION_RADIUS) return true
    } 
    else if (mapX === 0 && mapY === 1) {
      // River collision (North Map)
      if (y >= 90 - PLAYER_COLLISION_RADIUS && y <= 125 + PLAYER_COLLISION_RADIUS) {
        const onBridge = x >= 84 && x <= 116
        if (!onBridge) return true
      }
    } 
    else if (mapX === 1 && mapY === 0) {
      // Autumn Lake collision (East Map)
      const dx = x - 384
      const dy = y - 288
      const distLake = Math.sqrt(dx * dx + dy * dy)
      if (distLake < 140 + PLAYER_COLLISION_RADIUS) return true
    }

    // 3. Tree collisions (active map trees)
    const mapData = getMapData(mapX, mapY)
    for (const tree of mapData.trees) {
      const dx = x - tree.x
      const dy = y - tree.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < tree.r + PLAYER_COLLISION_RADIUS) {
        return true
      }
    }

    // 4. Chest collisions (active map chests only)
    for (const chest of chests) {
      if (chest.mapX === mapX && chest.mapY === mapY) {
        const cx = Math.max(chest.x - 12, Math.min(x, chest.x + 12))
        const cy = Math.max(chest.y - 8, Math.min(y, chest.y + 8))
        const distChest = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        if (distChest < PLAYER_COLLISION_RADIUS + 6) return true
      }
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
  }, [chests, entriesCount, mapX, mapY])

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
      if (e.touches.length === 0) return
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const rect = canvas.getBoundingClientRect()
    // Calculate click coordinates in canvas resolution space
    const clickX = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH
    const clickY = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT

    targetXRef.current = clickX
    targetYRef.current = clickY
    
    SensoryAudio.play('water-drop')
  }

  // Interacting with near chests or triggering relaxation pond
  const handleInteract = async () => {
    const px = pxRef.current
    const py = pyRef.current
    
    // 1. Check if bordering the lake in Map [0,0]
    if (mapX === 0 && mapY === 0) {
      const dx = px - 310
      const dy = py - 105
      const distPond = Math.sqrt((dx / 50) ** 2 + (dy / 25) ** 2)
      if (distPond < 1.4) {
        SensoryAudio.play('chime')
        setShowRelaxationRoom(true)
        return
      }
    }

    // 2. Check if bordering the lake in Map [1,0] (Autumn Lake)
    if (mapX === 1 && mapY === 0) {
      const dx = px - 384
      const dy = py - 288
      const distLake = Math.sqrt(dx * dx + dy * dy)
      if (distLake >= 140 && distLake <= 168) {
        SensoryAudio.play('chime')
        setShowRelaxationRoom(true)
        return
      }
    }

    // 3. Find closest chest on current map
    let closestChest: Chest | null = null
    let minDist = 40 

    chests.forEach(chest => {
      if (chest.mapX === mapX && chest.mapY === mapY) {
        const dx = chest.x - px
        const dy = chest.y - py
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < minDist) {
          minDist = dist
          closestChest = chest
        }
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

        // Handle edge screen transitions
        const cX = pxRef.current
        const cY = pyRef.current

        if (mapX === 0 && mapY === 0) {
          if (cY < 4 && !isNorthLocked) {
            setMapY(1)
            pyRef.current = CANVAS_HEIGHT - 16
            SensoryAudio.play('bubble')
          } else if (cX > CANVAS_WIDTH - 4 && !isEastLocked) {
            setMapX(1)
            pxRef.current = 16
            SensoryAudio.play('bubble')
          }
        } 
        else if (mapX === 0 && mapY === 1) {
          if (cY > CANVAS_HEIGHT - 4) {
            setMapY(0)
            pyRef.current = 16
            SensoryAudio.play('bubble')
          }
        } 
        else if (mapX === 1 && mapY === 0) {
          if (cX < 4) {
            setMapX(0)
            pxRef.current = CANVAS_WIDTH - 16
            SensoryAudio.play('bubble')
          }
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
            // Cancel movement if stuck
            targetXRef.current = null
            targetYRef.current = null
            isWalkingRef.current = false
          }

          // Edge Transitions
          const cX = pxRef.current
          const cY = pyRef.current

          if (mapX === 0 && mapY === 0) {
            if (cY < 4 && !isNorthLocked) {
              setMapY(1)
              pyRef.current = CANVAS_HEIGHT - 16
              targetXRef.current = null
              targetYRef.current = null
              SensoryAudio.play('bubble')
            } else if (cX > CANVAS_WIDTH - 4 && !isEastLocked) {
              setMapX(1)
              pxRef.current = 16
              targetXRef.current = null
              targetYRef.current = null
              SensoryAudio.play('bubble')
            }
          } else if (mapX === 0 && mapY === 1) {
            if (cY > CANVAS_HEIGHT - 4) {
              setMapY(0)
              pyRef.current = 16
              targetXRef.current = null
              targetYRef.current = null
              SensoryAudio.play('bubble')
            }
          } else if (mapX === 1 && mapY === 0) {
            if (cX < 4) {
              setMapX(0)
              pxRef.current = CANVAS_WIDTH - 16
              targetXRef.current = null
              targetYRef.current = null
              SensoryAudio.play('bubble')
            }
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
    }

    const render = () => {
      updatePhysics()

      const mapData = getMapData(mapX, mapY)

      // 1. Draw Ground (Color varies by biome)
      ctx.fillStyle = mapData.bgColor
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw decorative tufts and tiny grass pixels
      ctx.fillStyle = mapData.tuftColor
      for (let i = 0; i < CANVAS_WIDTH; i += 24) {
        for (let j = 0; j < CANVAS_HEIGHT; j += 24) {
          const ox = (i * 7 + j * 13) % 12
          const oy = (i * 3 + j * 17) % 12
          ctx.fillRect(i + ox, j + oy, 2, 2)
          ctx.fillRect(i + ox + 3, j + oy + 1, 1, 2)
        }
      }

      // Biome-Specific Ground Decoration (North Map petals)
      if (mapX === 0 && mapY === 1) {
        ctx.fillStyle = '#fbcfe8' 
        ctx.fillRect(60, 50, 3, 2)
        ctx.fillRect(140, 160, 2, 2)
        ctx.fillRect(220, 230, 3, 2)
        ctx.fillRect(320, 140, 2, 2)
        ctx.fillRect(250, 45, 2, 2)
      }

      // 2. Draw Roads (Dirt path)
      ctx.fillStyle = '#fef08a' 
      
      if (mapX === 0 && mapY === 0) {
        // Center paths: Vertical + East branch
        ctx.beginPath()
        ctx.moveTo(100, 0)
        ctx.quadraticCurveTo(110, 144, 100, CANVAS_HEIGHT)
        ctx.lineWidth = 26
        ctx.strokeStyle = '#fef08a'
        ctx.lineCap = 'round'
        ctx.stroke()
        
        ctx.beginPath()
        ctx.moveTo(100, 144)
        ctx.quadraticCurveTo(240, 144, CANVAS_WIDTH, 144)
        ctx.lineWidth = 20
        ctx.strokeStyle = '#fef08a'
        ctx.stroke()
      } 
      else if (mapX === 0 && mapY === 1) {
        // North paths: Bottom to bridge, bridge to clearing
        ctx.beginPath()
        ctx.moveTo(100, CANVAS_HEIGHT)
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
      } 
      else if (mapX === 1 && mapY === 0) {
        // East path: Left edge to central garden
        ctx.beginPath()
        ctx.moveTo(0, 144)
        ctx.quadraticCurveTo(120, 144, 160, 144)
        ctx.lineWidth = 26
        ctx.strokeStyle = '#fef08a'
        ctx.stroke()
      }

      // Draw path texture details (pebbles/dirt specs)
      ctx.fillStyle = '#eab308'
      ctx.fillRect(96, 60, 2, 2)
      ctx.fillRect(114, 120, 3, 2)
      if (mapX === 0 && mapY === 0) {
        ctx.fillRect(160, 140, 2, 2)
        ctx.fillRect(220, 130, 2, 2)
      }

      // 3. Draw Water Elements (Ponds & Lakes updated with slate stone borders and aquatics)
      if (mapX === 0 && mapY === 0) {
        // Botanical Pond
        const pond = { x: 260, y: 80, w: 100, h: 50 }
        
        // Water Fill
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
        
        ctx.fillStyle = '#fda4af' // Pink water lily flower
        ctx.fillRect(pond.x + 34, pond.y + 16, 3, 3)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(pond.x + 35, pond.y + 17, 1, 1)

        // Green reeds (aquatic plants)
        ctx.fillStyle = '#065f46'
        ctx.fillRect(pond.x + 20, pond.y + 15, 2, 8)
        ctx.fillRect(pond.x + 23, pond.y + 10, 2, 12)
        ctx.fillRect(pond.x + 85, pond.y + 15, 2, 10)
        ctx.fillRect(pond.x + 88, pond.y + 18, 2, 8)
      } 
      else if (mapX === 0 && mapY === 1) {
        // North River
        ctx.fillStyle = '#60a5fa'
        ctx.fillRect(0, 90, CANVAS_WIDTH, 35)
        // River ripples
        ctx.fillStyle = '#93c5fd'
        ctx.fillRect(40, 100, 30, 2)
        ctx.fillRect(200, 115, 45, 2)
        ctx.fillRect(300, 98, 20, 2)

        // Wooden Bridge
        ctx.fillStyle = '#b45309'
        ctx.fillRect(80, 85, 40, 45)
        ctx.fillStyle = '#78350f' // Planks lines
        for (let by = 90; by <= 125; by += 7) {
          ctx.fillRect(80, by, 40, 2)
        }
        ctx.fillStyle = '#d97706' // Handrails
        ctx.fillRect(77, 85, 3, 45)
        ctx.fillRect(120, 85, 3, 45)
      } 
      else if (mapX === 1 && mapY === 0) {
        // East Autumn Lake
        ctx.fillStyle = '#bae6fd'
        ctx.beginPath()
        ctx.arc(384, 288, 140, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 3
        ctx.stroke()

        // Stone border
        ctx.fillStyle = '#94a3b8'
        const lakeStoneCount = 25
        for (let i = 0; i <= lakeStoneCount; i++) {
          const angle = Math.PI + (i / lakeStoneCount) * (Math.PI / 2)
          const sx = 384 + Math.cos(angle) * 141
          const sy = 288 + Math.sin(angle) * 141
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
        ctx.fillRect(260, 220, 2, 12)
        ctx.fillRect(263, 215, 2, 16)
        ctx.fillRect(290, 250, 2, 10)
        
        // Lily pad
        ctx.fillStyle = '#10b981'
        ctx.beginPath()
        ctx.arc(310, 240, 6, 0, Math.PI * 1.7)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(309, 238, 2, 2)

        // Wildflower Garden Patch
        ctx.fillStyle = '#86efac' 
        ctx.fillRect(100, 60, 80, 50)
        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth = 2
        ctx.strokeRect(100, 60, 80, 50)

        // Multi-colored flowers in garden patch
        const flowerColors = ['#f43f5e', '#a855f7', '#fbbf24', '#3b82f6', '#ec4899']
        for (let fi = 106; fi < 174; fi += 12) {
          for (let fj = 66; fj < 104; fj += 10) {
            const idx = (fi * 3 + fj * 7) % flowerColors.length
            ctx.fillStyle = flowerColors[idx]
            ctx.fillRect(fi, fj, 4, 4)
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(fi + 1, fj + 1, 2, 2)
          }
        }
      }

      // 4. Draw Scattered Decorative Flowers
      mapData.decFlowers.forEach(f => {
        ctx.fillStyle = f.color
        ctx.fillRect(f.x, f.y, 4, 4)
        ctx.fillRect(f.x - 2, f.y + 2, 2, 2)
        ctx.fillRect(f.x + 4, f.y + 2, 2, 2)
        ctx.fillRect(f.x + 1, f.y + 5, 2, 2)
        ctx.fillStyle = '#f5c842' // center
        ctx.fillRect(f.x + 1, f.y + 2, 2, 2)
      })

      // 5. Draw Exit Barriers (Gates / Hedges) on Center Map
      if (mapX === 0 && mapY === 0) {
        if (isNorthLocked) {
          ctx.fillStyle = '#78350f'
          for (let fx = 75; fx <= 125; fx += 10) {
            ctx.fillRect(fx, 4, 4, 14) 
          }
          ctx.fillRect(75, 7, 50, 3)
          ctx.fillRect(75, 12, 50, 3)
          ctx.fillStyle = '#ef4444'
          ctx.font = 'bold 8px sans-serif'
          ctx.fillText('🔒 Meta: Reg. 5 ou Streak 3', 60, 30)
        }

        if (isEastLocked) {
          ctx.fillStyle = '#78350f'
          for (let fy = 115; fy <= 165; fy += 10) {
            ctx.fillRect(372, fy, 12, 4)
          }
          ctx.fillRect(375, 115, 3, 50)
          ctx.fillRect(380, 115, 3, 50)
          ctx.fillStyle = '#ef4444'
          ctx.font = 'bold 8px sans-serif'
          ctx.fillText('🔒 Meta:', 330, 110)
          ctx.fillText('Reg. 10 / Streak 5', 300, 120)
        }
      }

      // 6. Draw Map-Specific Chests
      chests.forEach(chest => {
        if (chest.mapX !== mapX || chest.mapY !== mapY) return

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
          ctx.fillRect(chest.x - 6, chest.y - 2, 12, 2)
        } else {
          // Closed Chest
          ctx.fillStyle = '#b45309'
          ctx.fillRect(chest.x - 10, chest.y - 6, 20, 14)
          ctx.fillStyle = '#78350f'
          ctx.fillRect(chest.x - 12, chest.y - 10, 24, 5)
          
          // Iron bands
          ctx.fillStyle = '#4b5563'
          ctx.fillRect(chest.x - 8, chest.y - 10, 2, 18)
          ctx.fillRect(chest.x + 6, chest.y - 10, 2, 18)
          
          // Gold latch
          ctx.fillStyle = '#fbbf24'
          ctx.fillRect(chest.x - 2, chest.y - 2, 4, 5)
          
          // Hover instruction when close
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

      // 7. Draw Player (Animated Sprout)
      const px = pxRef.current
      const py = pyRef.current

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.beginPath()
      ctx.ellipse(px, py + 14, 8, 3, 0, 0, Math.PI * 2)
      ctx.fill()

      // Bobbing & leg animation
      const bobY = isWalkingRef.current ? Math.sin(walkCycleRef.current) * 2.5 : 0
      const legOffset = isWalkingRef.current ? Math.sin(walkCycleRef.current) * 3 : 0

      // Body (Green Sprout)
      ctx.fillStyle = '#4ade80'
      ctx.beginPath()
      ctx.arc(px, py + 4 + bobY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // Cheeks (blush)
      ctx.fillStyle = '#f472b6'
      ctx.fillRect(px - 6, py + 5 + bobY, 2, 2)
      ctx.fillRect(px + 4, py + 5 + bobY, 2, 2)

      // Eyes
      ctx.fillStyle = '#1e293b'
      if (playerDirRef.current === 'down') {
        ctx.fillRect(px - 4, py + 2 + bobY, 2, 2)
        ctx.fillRect(px + 2, py + 2 + bobY, 2, 2)
      } else if (playerDirRef.current === 'left') {
        ctx.fillRect(px - 5, py + 2 + bobY, 2, 2)
      } else if (playerDirRef.current === 'right') {
        ctx.fillRect(px + 3, py + 2 + bobY, 2, 2)
      }

      // Overalls
      ctx.fillStyle = '#78350f'
      ctx.fillRect(px - 6, py + 8 + bobY, 12, 5)

      // Legs
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

      // 8. Draw Particle Effects (Sparkles on unlock)
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
      mapData.trees.forEach(tree => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.beginPath()
        ctx.ellipse(tree.x, tree.y + 12, tree.visualR - 4, 6, 0, 0, Math.PI * 2)
        ctx.fill()

        // Trunk
        ctx.fillStyle = '#78350f'
        ctx.fillRect(tree.x - 4, tree.y, 8, 14)

        // Leafy Crown
        ctx.fillStyle = mapData.treeColor
        ctx.beginPath()
        ctx.arc(tree.x, tree.y - 8, tree.visualR, 0, Math.PI * 2)
        ctx.fill()
        
        // Highlight layer
        ctx.fillStyle = mapData.treeHighlight
        ctx.beginPath()
        ctx.arc(tree.x - 4, tree.y - 12, tree.visualR - 6, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationFrameId)
  }, [chests, entriesCount, mapX, mapY, streak])

  const mapData = getMapData(mapX, mapY)

  return (
    <Card className="relative bg-card border-0 shadow-sm rounded-3xl p-6 space-y-4 overflow-hidden">
      
      {/* SENSORY RELAXATION SPACE OVERLAY (FONTE DO RELAXAMENTO) */}
      {showRelaxationRoom && (
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/95 to-blue-50/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-50 rounded-3xl animate-in fade-in duration-300">
          <div className="space-y-4 max-w-sm flex flex-col items-center">
            
            {/* Smooth expanding water ripple animation */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-2">
              <div className="absolute inset-0 rounded-full border-2 border-teal-300/40 animate-ping" style={{ animationDuration: '3.5s' }} />
              <div className="absolute inset-4 rounded-full border border-teal-400/50 animate-ping" style={{ animationDuration: '2.5s' }} />
              <div className="absolute inset-8 rounded-full border border-teal-500/30 animate-pulse" />
              
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center shadow-sm">
                <span className="text-3xl animate-bounce" style={{ animationDuration: '3s' }}>🪷</span>
              </div>
            </div>
            
            <h3 className="text-lg font-extrabold text-teal-900 flex items-center gap-1.5 justify-center">
              <span>Fonte do Relaxamento</span>
              <span className="animate-pulse">💧</span>
            </h3>
            
            <p className="text-xs text-teal-700/80 leading-relaxed font-medium">
              Respire fundo... Sinta as ondas da água e ouça os sons suaves da natureza para se autorregular.
            </p>
            
            <div className="pt-2 w-full">
              <Button 
                onClick={() => {
                  SensoryAudio.play('bubble')
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
              <span>Exploração Botânica: {mapData.name}</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {mapData.description} Toque em qualquer ponto do gramado para caminhar suavemente até lá! Aproxime-se dos baús e toque no botão 🖐️ para abri-los.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-[#f0fdf4] border border-green-100 rounded-xl py-1 px-3 self-start sm:self-center">
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">🔥 Streak</span>
            <span className="bg-green-200 text-green-800 text-xs font-black px-2 py-0.5 rounded-md">
              {streak} dias
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col lg:flex-row gap-6 items-center">
        {/* Game Canvas Board */}
        <div className="relative border-4 border-[#5ed8c0] rounded-2xl overflow-hidden bg-[#dcfce7] shadow-inner max-w-full">
          <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            onMouseDown={handleCanvasClickOrTouch}
            onTouchStart={handleCanvasClickOrTouch}
            className="block max-w-full mx-auto cursor-pointer"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Floating Action Button (Hand Icon) - Mobile Ergonomic Overlay */}
          <button 
            onClick={(e) => {
              e.stopPropagation() // Prevent click walk trigger
              handleInteract()
            }}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-[#f5c842]/90 hover:bg-[#f5c842] active:scale-95 text-slate-900 font-bold flex items-center justify-center shadow-lg border border-white/40 cursor-pointer transition-all md:hidden z-20"
            title="Interagir / Abrir Baú"
          >
            <span className="text-2xl leading-none">🖐️</span>
          </button>
        </div>

        {/* Game Controls Guide & Action Menu */}
        <div className="flex-1 w-full space-y-4">
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

          {/* Desktop/Large Screen Only Controls: Virtual D-Pad is hidden on mobile screens */}
          <div className="hidden md:flex flex-col items-center pt-2">
            <span className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wide">Controles do Painel</span>
            <div className="grid grid-cols-3 gap-2 w-32">
              <div />
              <button 
                onMouseDown={() => startVirtualMove('up')}
                onMouseUp={() => stopVirtualMove('up')}
                onMouseLeave={() => stopVirtualMove('up')}
                className="w-10 h-10 rounded-xl bg-[#eef2f6] active:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />

              <button 
                onMouseDown={() => startVirtualMove('left')}
                onMouseUp={() => stopVirtualMove('left')}
                onMouseLeave={() => stopVirtualMove('left')}
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
                className="w-10 h-10 rounded-xl bg-[#eef2f6] active:bg-[#dfe5eb] text-slate-700 font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div />
              <button 
                onMouseDown={() => startVirtualMove('down')}
                onMouseUp={() => stopVirtualMove('down')}
                onMouseLeave={() => stopVirtualMove('down')}
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
