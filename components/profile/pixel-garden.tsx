'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { SensoryAudio } from '@/lib/services/sensory-audio'
import { FLOWERS } from '@/lib/flowers'

interface PixelGardenProps {
  unlockedFlowers: string[]
  username: string
  onWater: () => void
  hasWatered: boolean
}

// Pixel art color palette
const COLORS = {
  grass: '#5a8c3c',
  grassLight: '#6ea84a',
  grassDark: '#4a7430',
  path: '#b8926a',
  pathDark: '#9a7554',
  soil: '#6b3e26',
  soilLight: '#7d4f34',
  water: '#5bc8e8',
  waterLight: '#7ad6f0',
  wood: '#8b5e3c',
  woodDark: '#6b4428',
  glass: '#b8e4f0',
  glassTint: '#d6f0f8',
  stone: '#8a8a8a',
  stoneDark: '#6a6a6a',
  stoneLight: '#aaaaaa',
  leafGreen: '#3a9c3a',
  leafLight: '#4dc44d',
  fruit: '#e84040',
  treeGreen: '#2d7d2d',
  treeDark: '#1e5e1e',
  sky: '#e8f4e8',
  wheelbarrowBody: '#8b5e3c',
  canGray: '#7a8a9a',
}

// Flower sprite colors per flower type
const FLOWER_COLORS: Record<string, { stem: string; petals: string; center: string }> = {
  semente: { stem: '#5a8c3c', petals: '#a8d868', center: '#f5e642' },
  broto:   { stem: '#3d7a2a', petals: '#78c83c', center: '#c8e850' },
  margarida: { stem: '#5a8c3c', petals: '#ffffff', center: '#f5d842' },
  girassol:  { stem: '#5a8c3c', petals: '#f5c842', center: '#8b4513' },
  rosa:      { stem: '#5a8c3c', petals: '#e84070', center: '#c02050' },
  tulipa:    { stem: '#5a8c3c', petals: '#e85890', center: '#c03870' },
  lotus:     { stem: '#5a8c3c', petals: '#e880d8', center: '#f5d8f0' },
  cerejeira: { stem: '#5a8c3c', petals: '#f5a8c8', center: '#e87890' },
  orquidea:  { stem: '#5a8c3c', petals: '#d868e8', center: '#f0c8f5' },
  lirio:     { stem: '#5a8c3c', petals: '#f0e8d0', center: '#f5e842' },
  violeta:   { stem: '#5a8c3c', petals: '#9858e8', center: '#c898f5' },
  hibisco:   { stem: '#5a8c3c', petals: '#e85838', center: '#f5e842' },
  trevo:     { stem: '#5a8c3c', petals: '#58d858', center: '#f0ffd0' },
  cacto:     { stem: '#5a9c40', petals: '#5aac40', center: '#f5f5a8' },
  cogumelo:  { stem: '#e8c890', petals: '#e83838', center: '#f5f5f0' },
  arvore:    { stem: '#8b5e3c', petals: '#3a9c3a', center: '#2d7d2d' },
}

function drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

function drawGrass(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Base grass fill
  drawPixelRect(ctx, 0, 0, W, H, COLORS.grass)

  // Grass texture tufts (pseudo-random but deterministic)
  for (let gx = 0; gx < W; gx += 8) {
    for (let gy = 0; gy < H; gy += 8) {
      const hash = (gx * 7 + gy * 13) % 5
      if (hash === 0) {
        drawPixelRect(ctx, gx + 2, gy + 2, 2, 3, COLORS.grassLight)
        drawPixelRect(ctx, gx + 4, gy + 1, 2, 4, COLORS.grassDark)
      } else if (hash === 1) {
        drawPixelRect(ctx, gx + 1, gy + 3, 3, 2, COLORS.grassLight)
      } else if (hash === 2) {
        drawPixelRect(ctx, gx + 3, gy + 2, 2, 3, COLORS.grassDark)
      }
    }
  }
}

function drawPath(ctx: CanvasRenderingContext2D) {
  // Dirt path - diagonal from top-left to bottom-right area
  ctx.fillStyle = COLORS.path
  // Horizontal path near bottom
  drawPixelRect(ctx, 30, 160, 340, 20, COLORS.path)
  drawPixelRect(ctx, 30, 162, 340, 16, COLORS.pathDark)

  // Pebbles on path
  ctx.fillStyle = COLORS.stone
  const pebbles = [[60,165],[120,168],[180,163],[240,167],[300,164],[340,168]]
  pebbles.forEach(([px, py]) => {
    drawPixelRect(ctx, px, py, 4, 3, COLORS.stoneLight)
    drawPixelRect(ctx, px+1, py+1, 2, 1, COLORS.stone)
  })
}

function drawGreenhouse(ctx: CanvasRenderingContext2D) {
  // Greenhouse at top-left (x:20, y:20)
  const gx = 20, gy = 20

  // Base wooden frame
  drawPixelRect(ctx, gx, gy + 20, 80, 50, COLORS.wood)
  drawPixelRect(ctx, gx, gy + 20, 80, 4, COLORS.woodDark)

  // Glass walls
  drawPixelRect(ctx, gx + 4, gy + 24, 72, 42, COLORS.glass)
  drawPixelRect(ctx, gx + 4, gy + 24, 72, 4, COLORS.glassTint)

  // Roof (triangular shape via rectangles)
  drawPixelRect(ctx, gx + 30, gy + 8, 20, 12, COLORS.wood)
  drawPixelRect(ctx, gx + 20, gy + 12, 40, 8, COLORS.wood)
  drawPixelRect(ctx, gx + 10, gy + 16, 60, 6, COLORS.wood)

  // Roof glass
  drawPixelRect(ctx, gx + 12, gy + 18, 56, 4, COLORS.glassTint)

  // Wooden frame cross beams
  drawPixelRect(ctx, gx + 39, gy + 24, 2, 42, COLORS.woodDark) // vertical center
  drawPixelRect(ctx, gx + 4, gy + 43, 72, 2, COLORS.woodDark)  // horizontal mid

  // Plants inside greenhouse
  const plantColors = ['#78c83c', '#5a8c3c', '#e84070', '#f5c842']
  plantColors.forEach((color, i) => {
    const px = gx + 8 + i * 16
    drawPixelRect(ctx, px, gy + 56, 6, 8, '#6b3e26')  // pot
    drawPixelRect(ctx, px + 2, gy + 50, 2, 8, '#5a8c3c') // stem
    drawPixelRect(ctx, px, gy + 46, 6, 6, color) // leaf
  })

  // Door
  drawPixelRect(ctx, gx + 30, gy + 45, 20, 25, COLORS.woodDark)
  drawPixelRect(ctx, gx + 32, gy + 47, 16, 23, COLORS.glass)
  drawPixelRect(ctx, gx + 48, gy + 57, 3, 4, COLORS.stone) // handle
}

function drawTrees(ctx: CanvasRenderingContext2D) {
  // Tree 1 - top right
  const t1x = 330, t1y = 30
  drawPixelRect(ctx, t1x + 12, t1y + 36, 8, 20, COLORS.wood)
  drawPixelRect(ctx, t1x, t1y + 18, 32, 22, COLORS.treeGreen)
  drawPixelRect(ctx, t1x + 4, t1y + 10, 24, 12, COLORS.leafGreen)
  drawPixelRect(ctx, t1x + 8, t1y + 4, 16, 8, COLORS.leafLight)
  drawPixelRect(ctx, t1x, t1y + 30, 32, 8, COLORS.treeDark)
  // Fruit
  drawPixelRect(ctx, t1x + 6, t1y + 20, 6, 6, COLORS.fruit)
  drawPixelRect(ctx, t1x + 18, t1y + 24, 6, 6, COLORS.fruit)
  drawPixelRect(ctx, t1x + 12, t1y + 14, 5, 5, '#f8a840')

  // Tree 2 - right side
  const t2x = 340, t2y = 95
  drawPixelRect(ctx, t2x + 10, t2y + 32, 8, 24, COLORS.wood)
  drawPixelRect(ctx, t2x, t2y + 14, 28, 22, COLORS.leafGreen)
  drawPixelRect(ctx, t2x + 4, t2y + 6, 20, 12, COLORS.treeGreen)
  drawPixelRect(ctx, t2x + 8, t2y, 12, 8, COLORS.leafLight)
  drawPixelRect(ctx, t2x, t2y + 28, 28, 6, COLORS.treeDark)
  drawPixelRect(ctx, t2x + 8, t2y + 16, 5, 5, COLORS.fruit)
  drawPixelRect(ctx, t2x + 14, t2y + 22, 5, 5, '#f8a840')
}

function drawFountain(ctx: CanvasRenderingContext2D) {
  // Stone fountain at bottom-right (x:270, y:170)
  const fx = 270, fy = 170

  // Base basin
  drawPixelRect(ctx, fx, fy + 20, 64, 12, COLORS.stone)
  drawPixelRect(ctx, fx + 2, fy + 22, 60, 8, COLORS.water)
  drawPixelRect(ctx, fx + 4, fy + 22, 56, 2, COLORS.waterLight)

  // Basin walls
  drawPixelRect(ctx, fx, fy + 20, 4, 12, COLORS.stoneDark)
  drawPixelRect(ctx, fx + 60, fy + 20, 4, 12, COLORS.stoneDark)
  drawPixelRect(ctx, fx, fy + 30, 64, 2, COLORS.stoneDark)

  // Central column
  drawPixelRect(ctx, fx + 28, fy + 8, 8, 14, COLORS.stone)
  drawPixelRect(ctx, fx + 24, fy + 4, 16, 6, COLORS.stoneLight)
  drawPixelRect(ctx, fx + 26, fy + 6, 12, 4, COLORS.stoneDark)

  // Water droplets (animated-looking)
  ctx.fillStyle = COLORS.water
  [[fx+29, fy+18],[fx+32, fy+16],[fx+31, fy+20]].forEach(([dx, dy]) => {
    drawPixelRect(ctx, dx, dy, 2, 3, COLORS.water)
    drawPixelRect(ctx, dx, dy, 2, 1, COLORS.waterLight)
  })

  // Pixel bird on edge
  drawPixelRect(ctx, fx + 50, fy + 18, 10, 6, '#e8c890') // body
  drawPixelRect(ctx, fx + 58, fy + 16, 5, 5, '#e8a860') // head
  drawPixelRect(ctx, fx + 62, fy + 18, 4, 2, '#f5c842') // beak
  drawPixelRect(ctx, fx + 50, fy + 21, 10, 3, '#c89870') // wing
  drawPixelRect(ctx, fx + 59, fy + 17, 2, 2, '#1a1a1a') // eye
}

function drawTools(ctx: CanvasRenderingContext2D) {
  // Wheelbarrow near path (x:135, y:152)
  const wx = 135, wy = 150
  // Wheel
  ctx.fillStyle = COLORS.woodDark
  ctx.beginPath()
  ctx.arc(wx + 6, wy + 20, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = COLORS.stone
  ctx.beginPath()
  ctx.arc(wx + 6, wy + 20, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = COLORS.woodDark
  ctx.beginPath()
  ctx.arc(wx + 6, wy + 20, 2, 0, Math.PI * 2)
  ctx.fill()
  // Tray
  drawPixelRect(ctx, wx + 8, wy + 6, 38, 18, COLORS.wheelbarrowBody)
  drawPixelRect(ctx, wx + 10, wy + 8, 34, 12, '#c89060') // inside lighter
  drawPixelRect(ctx, wx + 6, wy + 20, 44, 2, COLORS.woodDark) // bottom rail
  // Handles
  drawPixelRect(ctx, wx + 42, wy + 12, 24, 3, COLORS.wood)
  drawPixelRect(ctx, wx + 42, wy + 18, 24, 3, COLORS.wood)
  // Soil in tray
  drawPixelRect(ctx, wx + 12, wy + 10, 30, 8, COLORS.soil)

  // Watering can (x:200, y:152)
  const cx = 200, cy = 152
  drawPixelRect(ctx, cx, cy + 8, 28, 20, COLORS.canGray) // body
  drawPixelRect(ctx, cx + 2, cy + 10, 24, 16, '#8a9ab0') // highlight
  drawPixelRect(ctx, cx + 28, cy + 10, 16, 4, '#6a7a8a') // spout
  drawPixelRect(ctx, cx + 44, cy + 8, 4, 8, '#5a6a7a') // tip row
  drawPixelRect(ctx, cx + 4, cy + 6, 20, 4, COLORS.canGray) // top
  drawPixelRect(ctx, cx + 6, cy + 2, 16, 6, '#7a8a9a') // handle arch
  drawPixelRect(ctx, cx + 6, cy + 2, 4, 6, COLORS.canGray) // left handle
  drawPixelRect(ctx, cx + 18, cy + 2, 4, 6, COLORS.canGray) // right handle
}

function drawFlowerBed(ctx: CanvasRenderingContext2D, fx: number, fy: number, flowerId: string, tick: number) {
  const fc = FLOWER_COLORS[flowerId] || FLOWER_COLORS['semente']

  // Soil plot
  drawPixelRect(ctx, fx, fy + 10, 24, 16, COLORS.soilLight)
  drawPixelRect(ctx, fx + 2, fy + 12, 20, 12, COLORS.soil)

  // Stem
  drawPixelRect(ctx, fx + 10, fy + 2, 4, 10, fc.stem)

  if (flowerId === 'cacto') {
    // Cactus shape
    drawPixelRect(ctx, fx + 8, fy - 8, 8, 22, fc.petals)
    drawPixelRect(ctx, fx + 4, fy + 2, 6, 4, fc.petals)
    drawPixelRect(ctx, fx + 14, fy + 4, 6, 4, fc.petals)
    drawPixelRect(ctx, fx + 10, fy - 10, 4, 4, fc.center)
  } else if (flowerId === 'arvore') {
    // Mini tree
    drawPixelRect(ctx, fx + 9, fy - 4, 6, 14, fc.stem)
    drawPixelRect(ctx, fx + 4, fy - 10, 16, 8, fc.petals)
    drawPixelRect(ctx, fx + 2, fy - 4, 20, 8, fc.center)
  } else {
    // Flower head (petals around center)
    drawPixelRect(ctx, fx + 6, fy - 6, 12, 12, fc.petals)
    // Petals top/bottom/left/right
    drawPixelRect(ctx, fx + 8, fy - 10, 8, 4, fc.petals)
    drawPixelRect(ctx, fx + 8, fy + 6, 8, 4, fc.petals)
    drawPixelRect(ctx, fx + 2, fy - 2, 4, 8, fc.petals)
    drawPixelRect(ctx, fx + 18, fy - 2, 4, 8, fc.petals)
    // Center
    drawPixelRect(ctx, fx + 8, fy - 2, 8, 8, fc.center)
    // Subtle shimmer
    if ((tick % 60) < 30) {
      ctx.globalAlpha = 0.3
      drawPixelRect(ctx, fx + 9, fy - 1, 3, 3, '#ffffff')
      ctx.globalAlpha = 1
    }
  }
}

function drawFlowerBeds(ctx: CanvasRenderingContext2D, unlockedFlowers: string[], tick: number) {
  // Grid layout: 4 columns × 4 rows of flower plots
  const cols = 4
  const startX = 30
  const startY = 70
  const cellW = 72
  const cellH = 48

  unlockedFlowers.forEach((flowerId, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const px = startX + col * cellW
    const py = startY + row * cellH
    drawFlowerBed(ctx, px, py, flowerId, tick)
  })

  // Empty soil plots for remaining slots (up to 16 total)
  const maxSlots = Math.max(8, Math.ceil(unlockedFlowers.length / cols) * cols)
  for (let i = unlockedFlowers.length; i < maxSlots; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const px = startX + col * cellW + 4
    const py = startY + row * cellH + 16
    drawPixelRect(ctx, px, py, 16, 10, COLORS.soilLight)
    drawPixelRect(ctx, px + 2, py + 2, 12, 6, COLORS.soil)
  }
}

function drawRainAnimation(ctx: CanvasRenderingContext2D, W: number, H: number, frame: number) {
  // Cloud
  const cloudY = 10 + Math.sin(frame * 0.05) * 8
  ctx.fillStyle = 'rgba(180, 220, 255, 0.9)'
  ;[[80, cloudY, 60, 24], [100, cloudY - 10, 80, 32], [130, cloudY, 70, 24]].forEach(([cx, cy, cw, ch]) => {
    ctx.beginPath()
    ctx.ellipse(cx, cy, cw / 2, ch / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  })

  // Rain drops
  ctx.fillStyle = '#5bc8e8'
  for (let d = 0; d < 20; d++) {
    const dropX = 40 + (d * 37 + frame * 3) % 300
    const dropY = 40 + (frame * 4 + d * 23) % (H - 40)
    drawPixelRect(ctx, dropX, dropY, 2, 6, COLORS.water)
    drawPixelRect(ctx, dropX, dropY, 2, 2, COLORS.waterLight)
  }

  // Sparkles on flowers
  if (frame % 8 < 4) {
    ctx.fillStyle = '#ffffff'
    const sparkles = [[60,80],[132,80],[204,80],[276,80],[60,128],[132,128]]
    sparkles.forEach(([sx, sy]) => {
      drawPixelRect(ctx, sx, sy, 2, 2, '#f5e842')
      drawPixelRect(ctx, sx - 1, sy + 1, 1, 1, '#ffffff')
      drawPixelRect(ctx, sx + 3, sy + 1, 1, 1, '#ffffff')
    })
  }
}

const CANTEIRO_CENTERS = [
  { flowerId: 'semente', cx: 175, cy: 200 },
  { flowerId: 'broto', cx: 263, cy: 300 },
  { flowerId: 'margarida', cx: 315, cy: 271 },
  { flowerId: 'girassol', cx: 383, cy: 114 },
  { flowerId: 'rosa', cx: 468, cy: 158 },
  { flowerId: 'tulipa', cx: 223, cy: 112 },
  { flowerId: 'lotus', cx: 341, cy: 121 },
  { flowerId: 'cerejeira', cx: 151, cy: 128 },
]

export function PixelGarden({ unlockedFlowers, username, onWater, hasWatered }: PixelGardenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tickRef = useRef(0)
  const animFrameRef = useRef<number>()
  const [isRaining, setIsRaining] = useState(false)
  const rainFrameRef = useRef(0)

  // Preload assets for isometric scene
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [emptyCanteiroImage, setEmptyCanteiroImage] = useState<HTMLImageElement | null>(null)
  const [hoveredFlower, setHoveredFlower] = useState<{ label: string; x: number; y: number } | null>(null)

  useEffect(() => {
    const bg = new Image()
    bg.src = '/approved_canvas.png'
    bg.onload = () => setBgImage(bg)

    const emp = new Image()
    emp.src = '/empty_canteiro.png'
    emp.onload = () => setEmptyCanteiroImage(emp)
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.imageSmoothingEnabled = false
    tickRef.current++

    // 1. Draw approved isometric scene background
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, W, H)
    } else {
      // Fallback green background while loading
      ctx.fillStyle = '#5a8c3c'
      ctx.fillRect(0, 0, W, H)
    }

    // 2. Overlay empty canteiro sprites dynamically for locked flowers
    if (emptyCanteiroImage) {
      CANTEIRO_CENTERS.forEach(({ flowerId, cx, cy }) => {
        const isUnlocked = unlockedFlowers.includes(flowerId)
        if (!isUnlocked) {
          // empty_canteiro has width 100, height 75. Center is (54, 62)
          ctx.drawImage(emptyCanteiroImage, cx - 54, cy - 62)
        }
      })
    }

    // 3. Rain overlay
    if (isRaining) {
      ctx.fillStyle = 'rgba(100, 160, 220, 0.15)'
      ctx.fillRect(0, 0, W, H)
      drawRainAnimation(ctx, W, H, rainFrameRef.current)
      rainFrameRef.current++
    }

    animFrameRef.current = requestAnimationFrame(render)
  }, [unlockedFlowers, isRaining, bgImage, emptyCanteiroImage])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [render])

  const handleWaterClick = () => {
    if (hasWatered) return
    onWater()
    SensoryAudio.play('water-drop')
    setIsRaining(true)
    rainFrameRef.current = 0
    setTimeout(() => setIsRaining(false), 3500)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()

    // Map screen mouse position to canvas drawing resolution coordinates
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height

    let found = false
    for (const c of CANTEIRO_CENTERS) {
      const dx = mouseX - c.cx
      const dy = mouseY - c.cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Canteiro is click-sensitive in a 30px radius
      if (dist < 32) {
        const isUnlocked = unlockedFlowers.includes(c.flowerId)
        const flowerInfo = FLOWERS[c.flowerId]

        const pctX = (c.cx / canvas.width) * 100
        const pctY = ((c.cy - 38) / canvas.height) * 100 // place slightly above the flower center

        setHoveredFlower({
          label: isUnlocked
            ? `${flowerInfo?.emoji} ${flowerInfo?.label}`
            : '🔒 Canteiro Bloqueado',
          x: pctX,
          y: pctY,
        })
        found = true
        break
      }
    }

    if (!found) {
      setHoveredFlower(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredFlower(null)
  }

  return (
    <div className="space-y-3">
      {/* Canvas Scene */}
      <div className="relative rounded-2xl overflow-hidden border-4 border-[#5a8c3c] shadow-inner bg-[#4a7430]">
        <canvas
          ref={canvasRef}
          width={668}
          height={365}
          className="block w-full cursor-crosshair"
          style={{ imageRendering: 'pixelated' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {/* Hover Tooltip Overlay */}
        {hoveredFlower && (
          <div
            className="absolute bg-black/85 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-lg border border-white/10 pointer-events-none -translate-x-1/2 -translate-y-full transition-all duration-200 z-30 whitespace-nowrap"
            style={{ left: `${hoveredFlower.x}%`, top: `${hoveredFlower.y}%` }}
          >
            {hoveredFlower.label}
            <div className="absolute left-1/2 bottom-0 w-2 h-2 bg-black border-r border-b border-white/10 rotate-45 -translate-x-1/2 translate-y-1/2" />
          </div>
        )}
        {/* Overlay label */}
        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg">
          🌿 Jardim de {username}
        </div>
        {/* Flower count badge */}
        <div className="absolute bottom-2 left-2 bg-[#5a8c3c]/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
          🌸 {unlockedFlowers.length} flores plantadas
        </div>
      </div>

      {/* Watering Button */}
      <button
        onClick={handleWaterClick}
        disabled={hasWatered}
        className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm transition-all duration-300 water-confirm-button ${
          hasWatered
            ? 'bg-[#e0f2fe] text-[#0369a1] cursor-not-allowed opacity-90'
            : 'bg-gradient-to-r from-[#5bc8e8] to-[#0284c7] text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
        }`}
      >
        <span className="text-lg">{hasWatered ? '✅' : '💧'}</span>
        <span>{hasWatered ? 'Jardim Regado com Carinho!' : 'Deixar uma Gota de Chuva'}</span>
      </button>
    </div>
  )
}
