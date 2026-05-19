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

    return (data || []).map((row) => ({
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
      })
      .select()
      .single()

    if (error) {
      console.error('[DiaryService] Failed to save entry:', error)
      throw new Error('Erro ao salvar o registro no diário.')
    }

    return data
  },

  /**
   * Retrieves the latest entry for other users to build a live community emotion mural.
   */
  async getCommunityFeed(currentUserId: string): Promise<any[]> {
    // 1. Fetch other users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('sentiment_users')
      .select('id, username')
      .neq('id', currentUserId)
      .limit(10)

    if (usersError || !users || users.length === 0) {
      return []
    }

    const feed: any[] = []

    // 2. Fetch the latest entry for each other user
    for (const u of users) {
      const { data: latestEntry, error: entryError } = await supabaseAdmin
        .from('sentiment_entries')
        .select('*')
        .eq('user_id', u.id)
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

        // Clean user's username for displaying
        const displayName = u.username.charAt(0).toUpperCase() + u.username.slice(1)

        // Select an emoji and background based on sentiment deterministically
        let avatarEmoji = '🦊'
        let avatarBg = 'bg-[#ffeedb] text-[#ff9800]'
        
        if (latestEntry.sentiment === 'positive') {
          avatarEmoji = '🦄'
          avatarBg = 'bg-[#f3e8ff] text-[#a855f7]'
        } else if (latestEntry.sentiment === 'negative') {
          avatarEmoji = '🐼'
          avatarBg = 'bg-[#efebe9] text-[#795548]'
        } else {
          avatarEmoji = '🐬'
          avatarBg = 'bg-[#e0f2fe] text-[#0284c7]'
        }

        // Cut down the text to a comfortable snippet length
        const displaySnippet = latestEntry.content.length > 80
          ? latestEntry.content.slice(0, 77) + '...'
          : latestEntry.content

        feed.push({
          id: u.id,
          name: displayName,
          avatarBg,
          avatarEmoji,
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
