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

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function Flower({ 
  sentiment, 
  riskLevel, 
  dayName,
  index,
  isToday
}: { 
  sentiment: Sentiment, 
  riskLevel?: string,
  dayName: string
  index: number
  isToday: boolean
}) {
  const flowerColors: Record<string, string> = {
    positive: '#f5c842', // Bright sun yellow
    neutral: '#7ec8e3',  // Calm blue
    negative: '#9ca3af', // Muted gray/purple for sadness, needing care
    empty: 'transparent',
  }

  const centerColors: Record<string, string> = {
    positive: '#e5a832',
    neutral: '#5eb8d3',
    negative: '#6b7280',
    empty: 'transparent',
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
          {/* Base Grass - always visible */}
          <path d="M12 32 Q15 25 18 32" stroke="#4ade80" strokeWidth="2" fill="none" opacity="0.6"/>
          <path d="M18 32 Q21 27 24 32" stroke="#4ade80" strokeWidth="2" fill="none" opacity="0.6"/>

          {/* STEM INSIDE SVG */}
          {sentiment !== 'empty' && (
            <rect 
              x="16.5" 
              y="28" 
              width="3" 
              height="14" 
              fill={isSad ? "#9ca3af" : "#4ade80"} 
              rx="1.5"
            />
          )}
          
          {/* Petals - 6 rounded petals */}
          {sentiment !== 'empty' && [0, 60, 120, 180, 240, 300].map((angle, i) => (
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
          {sentiment !== 'empty' && <circle cx="18" cy="18" r="6" fill={centerColor} />}
          
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
          {sentiment === 'neutral' && (
            <>
              <circle cx="15" cy="17" r="1" fill="#1e2a4a" />
              <circle cx="21" cy="17" r="1" fill="#1e2a4a" />
              <line x1="16" y1="21" x2="20" y2="21" stroke="#1e2a4a" strokeWidth="1" />
            </>
          )}
        </svg>
      </motion.div>
      
      {/* Day label */}
      <span className={cn(
        "text-xs font-bold px-2 py-0.5 rounded-full mt-1 transition-colors",
        isToday ? "bg-white text-[#1e2a4a] shadow-md ring-2 ring-white/50" : "text-[#2a4a4a]"
      )}>
        {isToday ? <strong>(Hoje)</strong> : dayName}
      </span>
    </motion.div>
  )
}

export function WellbeingGarden({ data, className }: WellbeingGardenProps) {
  // Pre-process data: Group by day and find the average/predominant sentiment
  const processedData: Record<number, FlowerData[]> = {}
  data.forEach(item => {
    const dateObj = new Date(item.date)
    const dayIndex = dateObj.getDay()
    
    if (!processedData[dayIndex]) {
      processedData[dayIndex] = []
    }
    processedData[dayIndex].push(item)
  })

  // We will iterate through 0 (Sunday) to 6 (Saturday)
  const todayIndex = new Date().getDay()
  const weekData = dayNames.map((dayName, idx) => {
    // Try to find if we have processed data for this day
    const entries = processedData[idx]
    
    if (!entries || entries.length === 0) {
      return {
        date: dayName,
        sentiment: 'empty' as any,
      }
    }
    
    if (entries.length === 1) {
      return {
        ...entries[0],
        date: dayName
      }
    }
    
    // Calculate average sentiment for the day
    let score = 0
    entries.forEach(e => {
      if (e.sentiment === 'positive') score += 5
      else if (e.sentiment === 'neutral') score += 3
      else score += 1
    })
    const avg = score / entries.length
    
    let predominantSentiment: Sentiment = 'neutral'
    if (avg >= 4) predominantSentiment = 'positive'
    else if (avg <= 2) predominantSentiment = 'negative'
    
    return {
      date: dayName,
      sentiment: predominantSentiment,
      riskLevel: entries[entries.length - 1].riskLevel, // use latest
      energyLevel: entries[entries.length - 1].energyLevel
    }
  })
  
  // Calculate progress bar (percentage of positive/neutral days out of days that HAVE entries)
  const validDays = weekData.filter(d => d.sentiment !== 'empty')
  const positiveNeutralCount = validDays.filter(d => d.sentiment !== 'negative').length
  const progressPercentage = validDays.length > 0 ? (positiveNeutralCount / validDays.length) * 100 : 0

  return (
    <div className={cn('bg-[#7ee8d0] rounded-2xl p-6 overflow-hidden', className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">&#127803;</span>
        <h3 className="text-lg font-bold text-[#1e2a4a]">Jardim do Bem-Estar</h3>
      </div>
      <p className="text-sm text-[#2a4a4a] mb-6">
        Seu jardim reflete as emoções registradas ao longo da semana.
      </p>
      
      {/* Flowers */}
      <div className="flex items-end justify-around pb-4 min-h-[140px]">
        {weekData.map((item, index) => {
          const isToday = index === todayIndex
          
          return (
            <Flower
              key={item.date}
              sentiment={item.sentiment}
              dayName={item.date}
              index={index}
              isToday={isToday}
            />
          )
        })}
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
          <span className="w-3 h-3 rounded-full bg-[#9ca3af]" /> Precisando ser regada
        </span>
      </div>
    </div>
  )
}
