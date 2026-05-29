'use client'

import { useRouter } from 'next/navigation'
import { DiaryWizard } from '@/components/diary/diary-wizard'
import type { SensoryTag, SentimentAnalysis } from '@/lib/types'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function NovoRegistoPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleComplete = async (data: {
    content: string
    energyLevel: number
    comfortLevel: number
    sensoryTags: SensoryTag[]
    analysis: SentimentAnalysis
    isPublic: boolean
  }) => {
    setIsSaving(true)
    setSaveError('')
    
    try {
      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Falha ao salvar o registro no banco de dados.')
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('diary_updated'))
      }

      router.push('/?saved=true')
    } catch (e: any) {
      console.error('[NovoRegisto] Saving error:', e)
      throw new Error(e.message || 'Não foi possível salvar o seu diário. Tente novamente.')
    }
  }

  if (isSaving) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="text-5xl animate-bounce mb-6">&#128167; &#127803;</div>
        <p className="text-muted-foreground font-medium text-lg">Regando a sua nova sementinha no jardim...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {saveError && (
        <div className="max-w-lg mx-auto mt-6 p-4 rounded-2xl border border-red-200/50 bg-red-50 text-red-700 text-xs font-medium">
          ⚠️ {saveError}
        </div>
      )}
      <DiaryWizard onComplete={handleComplete} />
    </div>
  )
}
