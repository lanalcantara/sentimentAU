'use client'

import { motion } from 'framer-motion'
import { Cloud } from 'lucide-react'

interface CloudBuddyProps {
  mood?: 'happy' | 'thinking' | 'encouraging'
  message?: string
  className?: string
}

export function CloudBuddy({ mood = 'happy', message, className }: CloudBuddyProps) {
  const eyeVariants = {
    happy: { scaleY: 1, y: 0 },
    thinking: { scaleY: 0.5, y: -1 },
    encouraging: { scaleY: 1.2, y: 0 },
  }

  return (
    <div className={className}>
      <div className="flex items-end gap-3">
        {/* Cloud Mascot */}
        <motion.div 
          className="relative w-16 h-16 flex items-center justify-center bg-[#f0f4f8] rounded-full shadow-sm border border-blue-100"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Main Cloud Body with soft rounded aesthetic */}
          <Cloud className="w-12 h-12 text-[#94a3b8]" strokeWidth={1.5} />
          
          {/* Subtle face overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <div className="flex justify-center gap-2">
              <motion.div 
                className="w-1.5 h-1.5 bg-[#475569] rounded-full"
                animate={eyeVariants[mood]}
                transition={{ duration: 0.3 }}
              />
              <motion.div 
                className="w-1.5 h-1.5 bg-[#475569] rounded-full"
                animate={eyeVariants[mood]}
                transition={{ duration: 0.3 }}
              />
            </div>
            {/* Small subtle mouth */}
            <motion.div 
              className="w-2 h-0.5 mt-1 bg-[#475569] rounded-full"
              animate={{ 
                scaleX: mood === 'happy' ? 1.5 : 1,
                borderRadius: mood === 'happy' ? '9999px' : '4px'
              }}
            />
          </div>
        </motion.div>

        {/* Speech bubble */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="relative bg-[#f8fafc] border border-blue-50/50 rounded-2xl px-5 py-3 max-w-xs shadow-sm"
          >
            {/* Soft Triangle pointer */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-[#f8fafc]" />
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium tracking-wide">{message}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
