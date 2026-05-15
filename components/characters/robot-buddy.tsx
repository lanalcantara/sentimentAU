'use client'

import { motion } from 'framer-motion'

interface RobotBuddyProps {
  mood?: 'happy' | 'thinking' | 'encouraging'
  message?: string
  className?: string
}

export function RobotBuddy({ mood = 'happy', message, className }: RobotBuddyProps) {
  const eyeVariants = {
    happy: { scaleY: 1 },
    thinking: { scaleY: 0.5 },
    encouraging: { scaleY: 1.2 },
  }

  return (
    <div className={className}>
      <div className="flex items-end gap-3">
        {/* Robot */}
        <motion.div 
          className="relative"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Body */}
          <div className="w-16 h-20 bg-primary rounded-2xl relative overflow-hidden">
            {/* Face */}
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-2">
              {/* Eyes */}
              <motion.div 
                className="w-3 h-3 bg-primary-foreground rounded-full"
                animate={eyeVariants[mood]}
                transition={{ duration: 0.3 }}
              />
              <motion.div 
                className="w-3 h-3 bg-primary-foreground rounded-full"
                animate={eyeVariants[mood]}
                transition={{ duration: 0.3 }}
              />
            </div>
            {/* Mouth */}
            <div className="absolute top-10 left-0 right-0 flex justify-center">
              <motion.div 
                className="w-6 h-2 bg-primary-foreground rounded-full"
                animate={{ 
                  scaleX: mood === 'happy' ? 1 : 0.7,
                  borderRadius: mood === 'happy' ? '9999px' : '4px'
                }}
              />
            </div>
            {/* Antenna */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="w-1 h-3 bg-primary-foreground/50" />
              <motion.div 
                className="w-3 h-3 bg-secondary rounded-full -mt-1 -ml-1"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </div>
          {/* Arms */}
          <motion.div 
            className="absolute top-8 -left-2 w-3 h-6 bg-primary rounded-full"
            animate={{ rotate: mood === 'encouraging' ? [0, 15, 0] : 0 }}
            transition={{ duration: 0.5, repeat: mood === 'encouraging' ? Infinity : 0 }}
          />
          <motion.div 
            className="absolute top-8 -right-2 w-3 h-6 bg-primary rounded-full"
            animate={{ rotate: mood === 'encouraging' ? [0, -15, 0] : 0 }}
            transition={{ duration: 0.5, repeat: mood === 'encouraging' ? Infinity : 0 }}
          />
        </motion.div>

        {/* Speech bubble */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="relative bg-card border-2 border-border rounded-2xl px-4 py-3 max-w-xs shadow-lg"
          >
            {/* Triangle pointer */}
            <div className="absolute left-0 top-4 -translate-x-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-border" />
            <div className="absolute left-0 top-4 -translate-x-1 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-card" />
            <p className="text-sm text-card-foreground leading-relaxed">{message}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
