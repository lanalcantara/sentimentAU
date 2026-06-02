import { supabaseAdmin } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FLOWERS } from '@/lib/flowers'
import { Heart, UserPlus, Leaf, Trophy, Sprout } from 'lucide-react'
import { CommunityActions } from '@/components/profile/community-actions'
import { ProfileGardenView } from '@/components/profile/profile-garden-view'
import { headers } from 'next/headers'
import { cn } from '@/lib/utils'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Fetch profile
  const { data: profile } = await supabaseAdmin
    .from('sentiment_users')
    .select('id, username, avatar_url, flor_avatar_atual, flores_desbloqueadas')
    .eq('id', id)
    .single()

  if (!profile) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">Jardim não encontrado.</div>
      </AppLayout>
    )
  }

  // Check initial follow & hug status from database
  const cookieHeader = (await headers()).get('cookie') || ''
  const userIdCookie = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('session_user_id='))
  const currentUserId = userIdCookie ? userIdCookie.split('=')[1].trim() : null

  let initialFollowing = false
  let initialHugged = false
  let initialWatered = false

  if (currentUserId && currentUserId !== id) {
    const { data: follow } = await supabaseAdmin
      .from('sentiment_follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', id)
      .maybeSingle()
    initialFollowing = !!follow

    const { data: hug } = await supabaseAdmin
      .from('sentiment_notifications')
      .select('id')
      .eq('sender_id', currentUserId)
      .eq('receiver_id', id)
      .in('type', ['abraco', 'abraco_tatil'])
      .maybeSingle()
    initialHugged = !!hug

    const { data: water } = await supabaseAdmin
      .from('sentiment_notifications')
      .select('id')
      .eq('sender_id', currentUserId)
      .eq('receiver_id', id)
      .eq('type', 'regar')
      .maybeSingle()
    initialWatered = !!water
  }

  // Fetch public entries
  const { data: entries } = await supabaseAdmin
    .from('sentiment_entries')
    .select('*')
    .eq('user_id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  const publicEntries = (entries || []).map((row: any) => ({
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

  const avatarFlower = FLOWERS[profile.flor_avatar_atual || 'semente']
  const unlockedFlowers = profile.flores_desbloqueadas || ['semente']
  const isVisiting = currentUserId && currentUserId !== id

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto">

        {/* Profile Header */}
        <div className="relative bg-card rounded-3xl p-6 shadow-sm border border-border overflow-hidden profile-header-card">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#e8f5e9] to-[#c8e6c9] z-0 profile-banner" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 mt-14 md:mt-8">
            <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center border-4 border-white shadow-md text-5xl">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover rounded-full" />
              ) : (
                avatarFlower?.emoji || '🌱'
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-foreground capitalize profile-title">
                {isVisiting
                  ? `Você está visitando o Jardim de ${profile.username} 🌿`
                  : `Jardim de ${profile.username}`}
              </h1>
              <p className="text-muted-foreground text-sm mt-1 profile-subtitle">
                {unlockedFlowers.length} flores conquistadas · {publicEntries.length} registros compartilhados
              </p>
            </div>
            
            {isVisiting && (
              <CommunityActions 
                targetUserId={profile.id} 
                targetUsername={profile.username} 
                initialFollowing={initialFollowing}
                initialHugged={initialHugged}
                initialWatered={initialWatered}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* LEFT: Pixel Art Garden + Public Entries */}
          <div className="lg:col-span-3 space-y-8">

            {/* Pixel Art Garden Scene */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-[#5a8c3c]" />
                Cenário do Jardim em Pixel Art
              </h2>
              <Card className="border-0 shadow-md rounded-3xl overflow-hidden">
                <CardContent className="p-5">
                  <ProfileGardenView
                    targetUserId={profile.id}
                    username={profile.username}
                    unlockedFlowers={unlockedFlowers}
                    initialWatered={initialWatered}
                    isVisiting={!!isVisiting}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Public Entries */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Registros Públicos
              </h2>
              <div className="space-y-4">
                {publicEntries.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic p-4 bg-muted/30 rounded-2xl text-center">
                    Este jardim está silencioso... Nenhum registro público ainda.
                  </p>
                ) : (
                  publicEntries.map((entry: any) => (
                    <Card key={entry.id} className="bg-card border-0 shadow-sm rounded-2xl">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {entry.createdAt.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            entry.analysis.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 
                            entry.analysis.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {entry.analysis.sentiment === 'positive' ? 'Feliz' : entry.analysis.sentiment === 'negative' ? 'Difícil' : 'Neutro'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          "{entry.content}"
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Flower Collection */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary shrink-0" />
                Coleção de {profile.username}
              </h2>
              <Card className="bg-card border border-border rounded-3xl p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(FLOWERS).map(([key, flower]) => {
                    const isUnlocked = unlockedFlowers.includes(key)
                    return (
                      <div 
                        key={key} 
                        className={cn(
                          "flex flex-col items-center p-3 rounded-2xl border text-center transition-all",
                          isUnlocked 
                            ? "bg-[#f0fdf4] border-green-200/60 shadow-sm" 
                            : "bg-muted/40 border-dashed border-border opacity-50"
                        )}
                      >
                        <span className="text-3xl mb-1">{isUnlocked ? flower.emoji : '🔒'}</span>
                        <span className="text-[10px] font-extrabold text-foreground truncate max-w-full">
                          {isUnlocked ? flower.label : 'Bloqueada'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4 font-medium">
                  {unlockedFlowers.length} de {Object.keys(FLOWERS).length} flores descobertas
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
