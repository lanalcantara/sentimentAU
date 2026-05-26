'use client'

import { motion } from 'framer-motion'
import type { Sentiment, RiskLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FlowerData {
  date: string
  sentiment: Sentiment
  riskLevel?: RiskLevel
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
  dayName: string
  index: number 
}) {
  const flowerColors = {
    positive: '#f5c842', // Bright sun yellow
    neutral: '#7ec8e3',  // Calm blue
    negative: '#9ca3af', // Muted gray/purple for sadness, needing care
  }

  const centerColors = {
    positive: '#e5a832',
    neutral: '#5eb8d3',
    negative: '#6b7280',
  }

  const delay = index * 0.1
  const color = flowerColors[sentiment]
  const centerColor = centerColors[sentiment]
  
  const isSad = sentiment === 'negative'
  const isHappy = sentiment === 'positive'

  return (
    <motion.div 
      className="relative flex flex-col items-center gap-1"
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
    >
      {/* Flower head container - animates droop if sad */}
      <motion.div
        animate={{ 
          rotate: isSad ? [20, 25, 20] : [-3, 3, -3],
          y: isSad ? [5, 7, 5] : 0
        }}
        transition={{ duration: isSad ? 6 : 4, repeat: Infinity, delay }}
        style={{ transformOrigin: 'bottom center' }}
      >
        <svg 
          width="36" 
          height="36" 
          viewBox="0 0 36 36"
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
          
          {/* Inner face */}
          {isHappy && (
            <>
              <circle cx="15" cy="17" r="1" fill="#1e2a4a" />
              <circle cx="21" cy="17" r="1" fill="#1e2a4a" />
              <path d="M15 20 Q18 23 21 20" stroke="#1e2a4a" strokeWidth="1" fill="none" />
            </>
          )}
          {isSad && (
            <>
              <path d="M15 18 Q16 17 17 18" stroke="#1e2a4a" strokeWidth="1" fill="none" />
              <path d="M19 18 Q20 17 21 18" stroke="#1e2a4a" strokeWidth="1" fill="none" />
              <path d="M15 22 Q18 20 21 22" stroke="#1e2a4a" strokeWidth="1" fill="none" />
              <circle cx="16" cy="21" r="1" fill="#60a5fa" /> {/* little tear */}
            </>
          )}
          {!isHappy && !isSad && (
            <>
              <circle cx="15" cy="17" r="1" fill="#1e2a4a" />
              <circle cx="21" cy="17" r="1" fill="#1e2a4a" />
              <line x1="16" y1="21" x2="20" y2="21" stroke="#1e2a4a" strokeWidth="1" />
            </>
          )}
        </svg>
      </motion.div>
      
      {/* Stem - droops if sad */}
      <motion.div 
        className={cn("w-1 h-8 rounded-full -mt-2 z-[-1]", isSad ? "bg-[#9ca3af]" : "bg-[#4ade80]")}
        animate={{ 
          rotate: isSad ? [10, 15, 10] : 0,
          scaleY: isSad ? 0.8 : 1
        }}
        style={{ transformOrigin: 'bottom center' }}
        transition={{ duration: 6, repeat: Infinity, delay }}
      />
      
      {/* Day label */}
      <span className="text-xs font-bold text-[#2a4a4a] mt-1">{dayName}</span>
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
          <span className="w-3 h-3 rounded-full bg-[#f5c842]" /> Florescendo
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#7ec8e3]" /> Estável
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#9ca3af]" /> Precisando de Carinho
        </span>
      </div>
    </div>
  )
}
