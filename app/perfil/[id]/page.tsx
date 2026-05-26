import { supabaseAdmin } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FLOWERS } from '@/lib/flowers'
import { Heart, UserPlus, Leaf } from 'lucide-react'
import { WellbeingGarden } from '@/components/dashboard/wellbeing-garden'
import { CommunityActions } from '@/components/profile/community-actions'

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const { id } = params

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

  // Fetch public entries
  const { data: entries } = await supabaseAdmin
    .from('sentiment_entries')
    .select('*')
    .eq('user_id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  const publicEntries = (entries || []).map(row => ({
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

  // Pre-calculate data for garden
  const weeklyMoodData = publicEntries.slice(0, 7).reverse().map((e) => ({
    date: e.createdAt.toLocaleDateString('pt-PT', { weekday: 'short' }),
    sentiment: e.analysis?.sentiment || 'neutral',
    riskLevel: e.analysis?.riskLevel || 'low',
    energyLevel: e.energyLevel,
  }))

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="relative bg-card rounded-3xl p-6 shadow-sm border border-border overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#e8f5e9] to-[#c8e6c9] z-0" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 mt-8">
            <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center border-4 border-white shadow-md text-5xl">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover rounded-full" />
              ) : (
                avatarFlower?.emoji || '🌱'
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-foreground capitalize">Jardim de {profile.username}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {publicEntries.length} sementes plantadas na comunidade
              </p>
            </div>
            
            <CommunityActions targetUserId={profile.id} targetUsername={profile.username} />
          </div>
        </div>

        {/* Wellbeing Garden View */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            Jardim Atual
          </h2>
          {weeklyMoodData.length > 0 ? (
            <WellbeingGarden data={weeklyMoodData} />
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl shadow-sm">
              Nenhuma flor plantada publicamente ainda.
            </div>
          )}
        </div>

        {/* Public Entries List */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Registros Públicos</h2>
          <div className="space-y-4">
            {publicEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Este jardim está silencioso...</p>
            ) : (
              publicEntries.map(entry => (
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
    </AppLayout>
  )
}
