import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/services/auth-service'

export async function POST(req: Request) {
  try {
    const { userId, password } = await req.json()

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos.' },
        { status: 400 }
      )
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 4 caracteres.' },
        { status: 400 }
      )
    }

    const passwordHash = hashPassword(password)

    const { error } = await supabaseAdmin
      .from('sentiment_users')
      .update({ password_hash: passwordHash })
      .eq('id', userId)

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API/ResetPassword] Error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao redefinir senha.' }, { status: 500 })
  }
}
