import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth-service'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Nome de utilizador e palavra-passe são obrigatórios.' },
        { status: 400 }
      )
    }

    const user = await AuthService.login(username, password)
    
    const response = NextResponse.json({ success: true, user })
    
    // Set a secure, HTTP-Only session cookie (fully JWT-free, simple and clean)
    response.cookies.set('session_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })
    
    // Set a client-readable cookie for user layouts
    response.cookies.set('session_username', user.username, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    
    return response
  } catch (error: any) {
    console.error('[API/Login] Error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao autenticar conta.' }, { status: 400 })
  }
}
