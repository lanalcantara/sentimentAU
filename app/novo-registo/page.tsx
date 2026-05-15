'use client'

import { useRouter } from 'next/navigation'
import { DiaryWizard } from '@/components/diary/diary-wizard'
import type { SensoryTag, SentimentAnalysis } from '@/lib/types'

export default function NovoRegistoPage() {
  const router = useRouter()

  const handleComplete = (data: {
    content: string
    energyLevel: number
    comfortLevel: number
    sensoryTags: SensoryTag[]
    analysis: SentimentAnalysis
  }) => {
    // In a real app, save to database here
    console.log('[v0] New entry created:', data)
    
    // Navigate to dashboard after saving
    router.push('/?saved=true')
  }

  return <DiaryWizard onComplete={handleComplete} />
}
