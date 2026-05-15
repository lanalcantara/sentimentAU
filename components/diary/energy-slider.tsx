'use client'

import { cn } from '@/lib/utils'

interface EnergySliderProps {
  value: number
  onChange: (value: number) => void
  label: string
  lowLabel: string
  highLabel: string
  className?: string
}

const energyEmojis = ['😴', '😕', '😐', '🙂', '😄']
const comfortEmojis = ['😰', '😟', '😐', '😌', '🤗']

export function EnergySlider({ 
  value, 
  onChange, 
  label,
  lowLabel,
  highLabel,
  className 
}: EnergySliderProps) {
  const emojis = label.toLowerCase().includes('energia') ? energyEmojis : comfortEmojis

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-2xl">{emojis[value - 1]}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-16">{lowLabel}</span>
        <div className="flex-1 flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={cn(
                'flex-1 h-10 rounded-xl transition-all duration-200',
                'hover:scale-105 active:scale-95',
                level <= value 
                  ? 'bg-primary shadow-md' 
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              <span className="sr-only">Nível {level}</span>
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground w-16 text-right">{highLabel}</span>
      </div>
    </div>
  )
}
