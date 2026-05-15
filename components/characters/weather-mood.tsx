'use client'

import { motion } from 'framer-motion'
import type { Sentiment } from '@/lib/types'

interface WeatherMoodProps {
  sentiment: Sentiment
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function WeatherMood({ sentiment, size = 'md', className }: WeatherMoodProps) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }

  if (sentiment === 'positive') {
    // Sun
    return (
      <motion.div 
        className={`${sizes[size]} relative ${className}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50" />
        {/* Rays */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-1 h-3 bg-yellow-400 rounded-full origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 45}deg) translateY(-${size === 'lg' ? 16 : size === 'md' ? 12 : 8}px)`,
            }}
            animate={{ scaleY: [1, 1.3, 1] }}
            transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
          />
        ))}
        {/* Face */}
        <div className="absolute inset-4 flex flex-col items-center justify-center">
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-yellow-700 rounded-full" />
            <div className="w-1.5 h-1.5 bg-yellow-700 rounded-full" />
          </div>
          <motion.div 
            className="w-3 h-1.5 bg-yellow-700 rounded-full mt-1"
            animate={{ scaleX: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    )
  }

  if (sentiment === 'neutral') {
    // Cloud
    return (
      <motion.div 
        className={`${sizes[size]} relative ${className}`}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute bottom-0 left-2 right-2 h-3/5 bg-blue-200 rounded-full" />
        <div className="absolute bottom-1/4 left-1 w-1/2 h-1/2 bg-blue-200 rounded-full" />
        <div className="absolute bottom-1/4 right-1 w-2/5 h-2/5 bg-blue-200 rounded-full" />
        {/* Face */}
        <div className="absolute bottom-1/4 left-0 right-0 flex flex-col items-center justify-center">
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </div>
          <div className="w-2 h-0.5 bg-blue-500 rounded-full mt-1" />
        </div>
      </motion.div>
    )
  }

  // Storm cloud for negative
  return (
    <motion.div 
      className={`${sizes[size]} relative ${className}`}
      animate={{ x: [-1, 1, -1] }}
      transition={{ duration: 0.5, repeat: Infinity }}
    >
      <div className="absolute bottom-2 left-2 right-2 h-3/5 bg-gray-400 rounded-full" />
      <div className="absolute bottom-1/4 left-1 w-1/2 h-1/2 bg-gray-400 rounded-full" />
      <div className="absolute bottom-1/4 right-1 w-2/5 h-2/5 bg-gray-400 rounded-full" />
      {/* Lightning */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
          <path d="M7 0L0 9H5L4 16L12 6H6L7 0Z" fill="#FCD34D" />
        </svg>
      </motion.div>
      {/* Face */}
      <div className="absolute bottom-1/4 left-0 right-0 flex flex-col items-center justify-center">
        <div className="flex gap-2">
          <div className="w-1.5 h-1 bg-gray-600 rounded-sm" />
          <div className="w-1.5 h-1 bg-gray-600 rounded-sm" />
        </div>
        <div className="w-2 h-1 bg-gray-600 rounded-full mt-1 rotate-180" style={{ borderRadius: '0 0 50% 50%' }} />
      </div>
    </motion.div>
  )
}
