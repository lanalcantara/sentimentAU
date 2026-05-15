'use client'

import { motion } from 'framer-motion'
import type { Sentiment, RiskLevel } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Flame } from 'lucide-react'

interface FlowerData {
  date: string
  sentiment: Sentiment
  riskLevel: RiskLevel
  energyLevel?: number
}

interface WellbeingGardenProps {
  data: FlowerData[]
  className?: string
}

const dayNames = ['Sáb', 'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex']

function Flower({ 
  sentiment, 
  riskLevel, 
  dayName,
  index 
}: { 
  sentiment: Sentiment
  riskLevel: RiskLevel
  dayName: string
  index: number 
}) {
  const flowerColors = {
    positive: '#f5c842',
    neutral: '#7ec8e3',
    negative: '#e85a6b',
  }

  const centerColors = {
    positive: '#e5a832',
    neutral: '#5eb8d3',
    negative: '#d84a5b',
  }

  const delay = index * 0.1
  const color = flowerColors[sentiment]
  const centerColor = centerColors[sentiment]

  return (
    <motion.div 
      className="relative flex flex-col items-center gap-1"
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
    >
      {/* Risk indicator (flame) */}
      {riskLevel === 'high' && (
        <motion.div
          className="absolute -top-6 left-1/2 -translate-x-1/2"
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Flame className="w-4 h-4 text-orange-500 fill-orange-400" />
        </motion.div>
      )}
      
      {/* Flower head */}
      <motion.svg 
        width="36" 
        height="36" 
        viewBox="0 0 36 36"
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 4, repeat: Infinity, delay }}
      >
        {/* Petals - 6 rounded petals */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <ellipse
            key={i}
            cx="18"
            cy="18"
            rx="7"
            ry="11"
            fill={color}
            transform={`rotate(${angle} 18 18) translate(0 -7)`}
          />
        ))}
        {/* Center circle */}
        <circle cx="18" cy="18" r="6" fill={centerColor} />
        {/* Inner smile/face for positive */}
        {sentiment === 'positive' && (
          <>
            <circle cx="15" cy="17" r="1" fill="#1e2a4a" />
            <circle cx="21" cy="17" r="1" fill="#1e2a4a" />
            <path d="M15 20 Q18 23 21 20" stroke="#1e2a4a" strokeWidth="1" fill="none" />
          </>
        )}
      </motion.svg>
      
      {/* Stem */}
      <div className="w-1 h-8 bg-[#4ade80] rounded-full -mt-1" />
      
      {/* Day label */}
      <span className="text-xs text-[#4a5a7a] mt-1">{dayName}</span>
    </motion.div>
  )
}

export function WellbeingGarden({ data, className }: WellbeingGardenProps) {
  const recentData = data.slice(-7)
  
  // Calculate progress bar (percentage of positive/neutral days)
  const positiveNeutralCount = recentData.filter(d => d.sentiment !== 'negative').length
  const progressPercentage = (positiveNeutralCount / recentData.length) * 100

  return (
    <div className={cn('bg-[#7ee8d0] rounded-2xl p-6 overflow-hidden', className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">&#127803;</span>
        <h3 className="text-lg font-bold text-[#1e2a4a]">Jardim do Bem-Estar</h3>
      </div>
      <p className="text-sm text-[#2a4a4a] mb-6">
        Histórico semanal - cada flor é um dia
      </p>
      
      {/* Flowers */}
      <div className="flex items-end justify-around pb-4 min-h-[140px]">
        {recentData.map((item, index) => (
          <Flower
            key={item.date}
            sentiment={item.sentiment}
            riskLevel={item.riskLevel}
            dayName={dayNames[index % 7]}
            index={index}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-[#5ed8c0] rounded-full overflow-hidden mb-4">
        <motion.div 
          className="h-full bg-[#4ade80] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-[#2a4a4a]">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#f5c842]" /> Positivo
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#7ec8e3]" /> Neutro
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#e85a6b]" /> Difícil
        </span>
        <span className="flex items-center gap-2">
          <Flame className="w-3 h-3 text-orange-500 fill-orange-400" /> Alerta
        </span>
      </div>
    </div>
  )
}
