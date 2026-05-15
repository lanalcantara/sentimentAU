'use client'

import { cn } from '@/lib/utils'
import type { SensoryTag } from '@/lib/types'
import { SENSORY_TAGS } from '@/lib/types'
import { Sparkles } from 'lucide-react'

interface SensoryTagSelectorProps {
  selected: SensoryTag[]
  onChange: (tags: SensoryTag[]) => void
  suggested?: SensoryTag[]
  className?: string
}

export function SensoryTagSelector({ 
  selected, 
  onChange, 
  suggested = [],
  className 
}: SensoryTagSelectorProps) {
  const toggleTag = (tag: SensoryTag) => {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3', className)}>
      {(Object.entries(SENSORY_TAGS) as [SensoryTag, typeof SENSORY_TAGS[SensoryTag]][]).map(([tag, meta]) => {
        const isSelected = selected.includes(tag)
        const isSuggested = suggested.includes(tag)
        
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={cn(
              'relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isSelected 
                ? 'bg-primary/20 border-primary text-primary-foreground' 
                : 'bg-card/50 border-transparent hover:border-border text-card-foreground',
            )}
          >
            {isSuggested && !isSelected && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-secondary-foreground" />
              </span>
            )}
            <span className="text-2xl">{meta.emoji}</span>
            <span className="text-xs font-medium text-center leading-tight">{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}
