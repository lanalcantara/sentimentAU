import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth-service'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { username, email, password, userId, action } = await req.json()
    
    if (action === 'check') {
      if (!username || !email) {
        return NextResponse.json(
          { error: 'Nome de usuário e e-mail são obrigatórios.' },
          { status: 400 }
        )
      }

      const trimmedUsername = username.trim().toLowerCase()
      const trimmedEmail = email.trim().toLowerCase()

      // Check username
      const { data: existingUser } = await supabaseAdmin
        .from('sentiment_users')
        .select('id')
        .eq('username', trimmedUsername)
        .maybeSingle()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Este nome de usuário já está sendo utilizado.' },
          { status: 400 }
        )
      }

      // Check email
      const { data: existingEmail } = await supabaseAdmin
        .from('sentiment_users')
        .select('id')
        .eq('email', trimmedEmail)
        .maybeSingle()

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Este e-mail já está sendo utilizado.' },
          { status: 400 }
        )
      }

      return NextResponse.json({ success: true })
    }

    // Otherwise, this is the final registration confirm
    if (!username || !password || !email || !userId) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios.' },
        { status: 400 }
      )
    }

    const user = await AuthService.register(userId, username, email, password)
    
    const response = NextResponse.json({ success: true, user })
    
    // Set a secure, HTTP-Only session cookie
    response.cookies.set('session_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })
    
    // Set a client-readable cookie for the user layout display
    response.cookies.set('session_username', user.username, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    
    return response
  } catch (error: any) {
    console.error('[API/Signup] Error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar conta.' }, { status: 400 })
  }
}
