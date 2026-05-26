import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    // It might be 'session_user_id' or 'sentiment_user_id', let's check both just in case
    const userIdCookie = cookieStore.get('sentiment_user_id')?.value || cookieStore.get('session_user_id')?.value
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as Blob
    const username = formData.get('username') as string

    if (!file || !username) {
      return NextResponse.json({ error: 'Arquivo ou username ausente' }, { status: 400 })
    }

    const fileName = `${username}_avatar_${Date.now()}.jpg`
    const filePath = `avatars/${fileName}`

    // Upload using admin client to bypass RLS since custom auth doesn't use Supabase session
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[API/Upload] Storage Error:', uploadError)
      return NextResponse.json({ error: 'Falha no upload para o Storage' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Save to user profile directly here
    const { error: updateError } = await supabaseAdmin
      .from('sentiment_users')
      .update({ avatar_url: publicUrl })
      .eq('id', userIdCookie)

    if (updateError) {
      console.error('[API/Upload] Update Error:', updateError)
      return NextResponse.json({ error: 'Falha ao salvar a URL do avatar' }, { status: 500 })
    }

    return NextResponse.json({ publicUrl })
  } catch (error: any) {
    console.error('[API/Upload] Unhandled Error:', error)
    return NextResponse.json({ error: error.message || 'Erro inesperado' }, { status: 500 })
  }
}
