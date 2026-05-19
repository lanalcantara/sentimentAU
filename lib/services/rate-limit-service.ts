import { supabaseAdmin } from '../supabase'

const DEFAULT_DAILY_TOKEN_LIMIT = 30000 // Configurable standard limit: roughly ~30 long entries/day

export const RateLimitService = {
  /**
   * Checks if a user has tokens left for today.
   */
  async checkRateLimit(
    userId: string,
    dailyLimit: number = DEFAULT_DAILY_TOKEN_LIMIT
  ): Promise<{
    allowed: boolean
    consumed: number
    limit: number
  }> {
    const today = new Date().toISOString().split('T')[0]

    try {
      const { data, error } = await supabaseAdmin
        .from('sentiment_rate_limit')
        .select('tokens_consumed')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle()

      if (error) {
        console.error('[RateLimitService] DB error checking rate limit:', error)
        // If DB fails, fail-safe: allow the user request
        return { allowed: true, consumed: 0, limit: dailyLimit }
      }

      const consumed = data ? data.tokens_consumed : 0
      return {
        allowed: consumed < dailyLimit,
        consumed,
        limit: dailyLimit,
      }
    } catch (e) {
      console.error('[RateLimitService] Exception checking rate limit:', e)
      return { allowed: true, consumed: 0, limit: dailyLimit }
    }
  },

  /**
   * Records token consumption for a user on the current day.
   */
  async recordConsumption(userId: string, tokens: number): Promise<void> {
    if (tokens <= 0) return
    const today = new Date().toISOString().split('T')[0]

    try {
      // 1. Fetch current consumed tokens
      const { data, error } = await supabaseAdmin
        .from('sentiment_rate_limit')
        .select('tokens_consumed')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle()

      if (error) {
        console.error('[RateLimitService] Failed to read token count for increment:', error)
        return
      }

      const currentTotal = data ? data.tokens_consumed : 0
      const newTotal = currentTotal + tokens

      // 2. Upsert the updated total
      const { error: upsertError } = await supabaseAdmin
        .from('sentiment_rate_limit')
        .upsert({
          user_id: userId,
          usage_date: today,
          tokens_consumed: newTotal,
        })

      if (upsertError) {
        console.error('[RateLimitService] Failed to upsert tokens consumption:', upsertError)
      }
    } catch (e) {
      console.error('[RateLimitService] Exception recording token consumption:', e)
    }
  },
}
