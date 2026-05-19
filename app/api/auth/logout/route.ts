import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    
    // Clear secure HTTP-Only cookie and public username cookie
    response.cookies.delete('session_user_id')
    response.cookies.delete('session_username')
    
    return response
  } catch (error: any) {
    console.error('[API/Logout] Error:', error)
    return NextResponse.json({ error: 'Erro ao fechar sessão.' }, { status: 500 })
  }
}
