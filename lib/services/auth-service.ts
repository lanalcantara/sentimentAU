import { supabaseAdmin } from '../supabase'
import crypto from 'crypto'

// A native Node.js hashing implementation that works out of the box in Next.js Server Actions and API Routes
export function hashPassword(password: string): string {
  const salt = 'sentiment-au-salt-2026-secret-key-salt'
  return crypto.createHmac('sha256', salt).update(password).digest('hex')
}

export const AuthService = {
  /**
   * Registers a new user with a hashed password and email
   */
  async register(userId: string, username: string, email: string, passwordSecret: string) {
    if (!userId || !username || !email || !passwordSecret) {
      throw new Error('Todos os campos são obrigatórios.')
    }
    
    const trimmedUsername = username.trim().toLowerCase()
    const trimmedEmail = email.trim().toLowerCase()

    if (trimmedUsername.length < 3) {
      throw new Error('O nome de usuário deve ter pelo menos 3 caracteres.')
    }
    if (passwordSecret.length < 4) {
      throw new Error('A senha deve ter pelo menos 4 caracteres.')
    }

    const passwordHash = hashPassword(passwordSecret)

    const { data, error } = await supabaseAdmin
      .from('sentiment_users')
      .insert({
        id: userId,
        username: trimmedUsername,
        email: trimmedEmail,
        password_hash: passwordHash,
      })
      .select('id, username, email, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('username')) {
          throw new Error('Este nome de usuário já está sendo utilizado.')
        } else {
          throw new Error('Este e-mail já está sendo utilizado.')
        }
      }
      throw new Error(error.message)
    }

    return data
  },

  /**
   * Validates a user's password and returns user details (supports username or email login)
   */
  async login(usernameOrEmail: string, passwordSecret: string) {
    if (!usernameOrEmail || !passwordSecret) {
      throw new Error('Nome de usuário/e-mail e senha são obrigatórios.')
    }
    
    const trimmedInput = usernameOrEmail.trim().toLowerCase()
    const passwordHash = hashPassword(passwordSecret)
    const isEmailInput = trimmedInput.includes('@')

    let query = supabaseAdmin
      .from('sentiment_users')
      .select('id, username, email, password_hash')
      
    if (isEmailInput) {
      query = query.eq('email', trimmedInput)
    } else {
      query = query.eq('username', trimmedInput)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      throw new Error('Erro ao tentar acessar a conta.')
    }

    if (!data) {
      throw new Error('Nome de usuário ou senha incorretos.')
    }

    if (data.password_hash !== passwordHash) {
      throw new Error('Nome de usuário ou senha incorretos.')
    }

    return {
      id: data.id,
      username: data.username,
      email: data.email,
    }
  },
}
