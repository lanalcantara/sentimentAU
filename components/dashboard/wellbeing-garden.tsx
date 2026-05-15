'use client'

import { motion } from 'framer-motion'
import type { Sentiment, RiskLevel } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

interface FlowerData {
  date: string
  sentiment: Sentiment
  riskLevel: RiskLevel
}

interface WellbeingGardenProps {
  data: FlowerData[]
  className?: string
}

function Flower({ 
  sentiment, 
  riskLevel, 
  index 
}: { 
  sentiment: Sentiment
  riskLevel: RiskLevel
  index: number 
}) {
  const flowerColors = {
    positive: 'fill-yellow-400',
    neutral: 'fill-blue-300',
    negative: 'fill-pink-400',
  }

  const stemHeight = 40 + Math.random() * 20
  const delay = index * 0.1

  return (
    <motion.div 
      className="relative flex flex-col items-center"
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
    >
      {/* Risk indicator */}
      {riskLevel === 'high' && (
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-yellow-500"
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Zap className="w-4 h-4 fill-yellow-500" />
        </motion.div>
      )}
      
      {/* Flower head */}
      <motion.svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32"
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 3, repeat: Infinity, delay }}
      >
        {/* Petals */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <ellipse
            key={i}
            cx="16"
            cy="16"
            rx="6"
            ry="10"
            className={cn(flowerColors[sentiment], 'opacity-80')}
            transform={`rotate(${angle} 16 16) translate(0 -6)`}
          />
        ))}
        {/* Center */}
        <circle 
          cx="16" 
          cy="16" 
          r="5" 
          className={sentiment === 'positive' ? 'fill-yellow-600' : sentiment === 'neutral' ? 'fill-blue-500' : 'fill-pink-600'} 
        />
      </motion.svg>
      
      {/* Stem */}
      <div 
        className="w-1 bg-green-500 rounded-b-full -mt-1"
        style={{ height: stemHeight }}
      />
    </motion.div>
  )
}

export function WellbeingGarden({ data, className }: WellbeingGardenProps) {
  return (
    <div className={cn('bg-gradient-to-b from-sky-100 to-green-100 rounded-2xl p-6 overflow-hidden', className)}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Jardim do Bem-Estar</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Cada flor representa um dia. Amarela = positivo, Azul = neutro, Rosa = difícil.
      </p>
      
      {/* Garden ground */}
      <div className="relative">
        {/* Grass */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-green-400 rounded-t-full" />
        
        {/* Flowers */}
        <div className="flex items-end justify-center gap-4 pb-4 min-h-[120px]">
          {data.slice(-7).map((item, index) => (
            <Flower
              key={item.date}
              sentiment={item.sentiment}
              riskLevel={item.riskLevel}
              index={index}
            />
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-400" /> Positivo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-300" /> Neutro
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-pink-400" /> Difícil
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 fill-yellow-500 text-yellow-500" /> Alerta
        </span>
      </div>
    </div>
  )
}
