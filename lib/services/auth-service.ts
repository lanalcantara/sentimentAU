import { supabaseAdmin } from '../supabase'
import crypto from 'crypto'

// A native Node.js hashing implementation that works out of the box in Next.js Server Actions and API Routes
export function hashPassword(password: string): string {
  const salt = 'sentiment-au-salt-2026-secret-key-salt'
  return crypto.createHmac('sha256', salt).update(password).digest('hex')
}

export const AuthService = {
  /**
   * Registers a new user with a hashed password
   */
  async register(username: string, passwordSecret: string) {
    if (!username || !passwordSecret) {
      throw new Error('Username e password são obrigatórios.')
    }
    
    const trimmedUsername = username.trim().toLowerCase()
    if (trimmedUsername.length < 3) {
      throw new Error('O nome de utilizador deve ter pelo menos 3 caracteres.')
    }
    if (passwordSecret.length < 4) {
      throw new Error('A palavra-passe deve ter pelo menos 4 caracteres.')
    }

    const passwordHash = hashPassword(passwordSecret)

    const { data, error } = await supabaseAdmin
      .from('sentiment_users')
      .insert({
        username: trimmedUsername,
        password_hash: passwordHash,
      })
      .select('id, username, created_at')
      .single()

    if (error) {
      // Postgres unique constraint violation code
      if (error.code === '23505') {
        throw new Error('Este nome de utilizador já está a ser utilizado.')
      }
      throw new Error(error.message)
    }

    return data
  },

  /**
   * Validates a user's password and returns user details
   */
  async login(username: string, passwordSecret: string) {
    if (!username || !passwordSecret) {
      throw new Error('Username e password são obrigatórios.')
    }
    
    const trimmedUsername = username.trim().toLowerCase()
    const passwordHash = hashPassword(passwordSecret)

    const { data, error } = await supabaseAdmin
      .from('sentiment_users')
      .select('id, username, password_hash')
      .eq('username', trimmedUsername)
      .maybeSingle()

    if (error) {
      throw new Error('Erro ao tentar aceder à conta.')
    }

    if (!data) {
      throw new Error('Nome de utilizador ou palavra-passe incorretos.')
    }

    if (data.password_hash !== passwordHash) {
      throw new Error('Nome de utilizador ou palavra-passe incorretos.')
    }

    return {
      id: data.id,
      username: data.username,
    }
  },
}
