import { supabaseAdmin } from '../supabase'
import type { DiaryEntry } from '../types'

export const DiaryService = {
  /**
   * Retrieves all diary entries for a given user sorted by date descending
   */
  async getEntries(userId: string): Promise<DiaryEntry[]> {
    const { data, error } = await supabaseAdmin
      .from('sentiment_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DiaryService] Failed to fetch entries:', error)
      throw new Error('Não foi possível carregar os registros do diário.')
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
      content: row.content,
      energyLevel: row.energy_level,
      comfortLevel: row.comfort_level,
      sensoryTags: row.selected_sensory_tags || [],
      analysis: {
        sentiment: row.sentiment,
        confidence: Number(row.confidence),
        emotions: row.emotions || [],
        keywords: row.keywords || { positive: [], negative: [] },
        suggestedSensoryTags: row.suggested_sensory_tags || [],
        riskLevel: row.risk_level,
        riskIndicators: row.risk_indicators || [],
        suggestions: row.suggestions || [],
      },
    }))
  },

  /**
   * Saves a new diary entry in Supabase linked to the user
   */
  async createEntry(
    userId: string,
    entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    if (!entry.analysis) {
      throw new Error('A análise de sentimento é obrigatória para salvar o registro.')
    }

    const { data, error } = await supabaseAdmin
      .from('sentiment_entries')
      .insert({
        user_id: userId,
        content: entry.content,
        energy_level: entry.energyLevel,
        comfort_level: entry.comfortLevel,
        sentiment: entry.analysis.sentiment,
        confidence: entry.analysis.confidence,
        emotions: entry.analysis.emotions,
        keywords: entry.analysis.keywords,
        suggested_sensory_tags: entry.analysis.suggestedSensoryTags,
        selected_sensory_tags: entry.sensoryTags,
        risk_level: entry.analysis.riskLevel,
        risk_indicators: entry.analysis.riskIndicators,
        suggestions: entry.analysis.suggestions,
        is_public: entry.isPublic || false,
      })
      .select()
      .single()

    if (error) {
      console.error('[DiaryService] Failed to save entry:', error)
      throw new Error('Erro ao salvar o registro no diário.')
    }

    // --- GAMIFICATION: Flower Unlocking Logic ---
    try {
      // Get current user stats
      const { data: userProps } = await supabaseAdmin
        .from('sentiment_users')
        .select('flores_desbloqueadas')
        .eq('id', userId)
        .single()

      const { count: totalEntries } = await supabaseAdmin
        .from('sentiment_entries')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      const currentFlowers = userProps?.flores_desbloqueadas || ['semente']
      let unlockedNew = false
      const newCount = totalEntries || 1

      if (newCount >= 1 && !currentFlowers.includes('broto')) { currentFlowers.push('broto'); unlockedNew = true; }
      if (newCount >= 3 && !currentFlowers.includes('margarida')) { currentFlowers.push('margarida'); unlockedNew = true; }
      if (newCount >= 7 && !currentFlowers.includes('girassol')) { currentFlowers.push('girassol'); unlockedNew = true; }
      if (newCount >= 14 && !currentFlowers.includes('tulipa')) { currentFlowers.push('tulipa'); unlockedNew = true; }
      if (newCount >= 30 && !currentFlowers.includes('cerejeira')) { currentFlowers.push('cerejeira'); unlockedNew = true; }
      
      if (entry.analysis.sentiment === 'negative' && !currentFlowers.includes('lotus')) {
        currentFlowers.push('lotus')
        unlockedNew = true
      }
      if (entry.analysis.sentiment === 'positive' && !currentFlowers.includes('rosa')) {
        currentFlowers.push('rosa')
        unlockedNew = true
      }

      if (unlockedNew) {
        await supabaseAdmin
          .from('sentiment_users')
          .update({ flores_desbloqueadas: currentFlowers })
          .eq('id', userId)
      }
    } catch (err) {
      console.error('[DiaryService] Failed to update gamification stats:', err)
      // We don't throw here to not break the entry creation if gamification fails
    }

    return data
  },

  /**
   * Retrieves the latest public entry for other users to build a live community emotion mural.
   */
  async getCommunityFeed(currentUserId: string): Promise<any[]> {
    // 1. Fetch other users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('sentiment_users')
      .select('id, username, flor_avatar_atual')
      .neq('id', currentUserId)
      .limit(15)

    if (usersError || !users || users.length === 0) {
      return []
    }

    const feed: any[] = []

    // 2. Fetch the latest public entry for each other user
    for (const u of users) {
      const { data: latestEntry, error: entryError } = await supabaseAdmin
        .from('sentiment_entries')
        .select('*')
        .eq('user_id', u.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!entryError && latestEntry) {
        // Map sentiment to beautiful localized emotion descriptions
        let emotionLabel = 'Neutro'
        if (latestEntry.sentiment === 'positive') emotionLabel = 'Feliz'
        else if (latestEntry.sentiment === 'negative') emotionLabel = 'Frustrado'
        
        if (latestEntry.emotions && latestEntry.emotions.length > 0) {
          const map: Record<string, string> = {
            happy: 'Feliz',
            calm: 'Calmo',
            excited: 'Animado',
            content: 'Satisfeito',
            sad: 'Triste',
            anxious: 'Preocupado',
            frustrated: 'Irritado',
            overwhelmed: 'Sobrecarregado',
            tired: 'Cansado',
            confused: 'Confuso'
          }
          emotionLabel = map[latestEntry.emotions[0]] || emotionLabel
        }

        let avatarBg = 'bg-[#f1f5f9] text-[#64748b]'
        if (latestEntry.sentiment === 'positive') {
          avatarBg = 'bg-[#f0fdf4] text-[#16a34a]'
        } else if (latestEntry.sentiment === 'negative') {
          avatarBg = 'bg-[#fef2f2] text-[#dc2626]'
        } else {
          avatarBg = 'bg-[#f0f9ff] text-[#0284c7]'
        }

        // Cut down the text to a comfortable snippet length
        const displaySnippet = latestEntry.content.length > 80
          ? latestEntry.content.slice(0, 77) + '...'
          : latestEntry.content

        feed.push({
          id: u.id,
          username: u.username,
          florAvatarId: u.flor_avatar_atual || 'semente',
          avatarBg,
          emotion: emotionLabel,
          sentiment: latestEntry.sentiment,
          statusText: displaySnippet,
          supportCount: Math.floor(Math.random() * 5) + 1 // Add a small starting warm support value
        })
      }
    }

    return feed
  }
}
