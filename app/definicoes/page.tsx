'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  User, 
  Bell, 
  Shield, 
  Download, 
  Trash2, 
  Moon,
  Accessibility,
  Volume2
} from 'lucide-react'
import { useTheme } from '@/lib/context/theme-context'

export default function DefinicoesPage() {
  const playClick = () => SensoryAudio.playClick()
  const { darkMode, toggleDarkMode } = useTheme()

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Personalize a sua experiência</p>
        </div>

        {/* Profile */}
        <Card className="bg-card/50 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Nome</p>
                <p className="text-sm text-muted-foreground">Usuário</p>
              </div>
              <Button onClick={playClick} variant="outline" size="sm" className="rounded-xl cursor-pointer">
                Editar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card className="bg-card/50 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Accessibility className="w-4 h-4" />
              Acessibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor="dark-mode" className="cursor-pointer">
                  <p className="font-medium">Modo Escuro</p>
                  <p className="text-sm text-muted-foreground">Reduz a luminosidade da tela</p>
                </Label>
              </div>
              <Switch 
                id="dark-mode" 
                checked={darkMode}
                onCheckedChange={() => {
                  playClick()
                  toggleDarkMode()
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor="sounds" className="cursor-pointer">
                  <p className="font-medium">Sons Suaves</p>
                  <p className="text-sm text-muted-foreground">Feedback sonoro calmo</p>
                </Label>
              </div>
              <Switch id="sounds" onCheckedChange={playClick} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-muted-foreground font-bold">Aa</span>
                <Label htmlFor="large-text" className="cursor-pointer">
                  <p className="font-medium">Texto Grande</p>
                  <p className="text-sm text-muted-foreground">Aumenta o tamanho da fonte</p>
                </Label>
              </div>
              <Switch id="large-text" onCheckedChange={playClick} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card/50 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="daily-reminder" className="cursor-pointer">
                <p className="font-medium">Lembrete Diário</p>
                <p className="text-sm text-muted-foreground">Receba um lembrete para escrever</p>
              </Label>
              <Switch id="daily-reminder" onCheckedChange={playClick} defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="risk-alerts" className="cursor-pointer">
                <p className="font-medium">Alertas de Risco</p>
                <p className="text-sm text-muted-foreground">Notifica sobre padrões preocupantes</p>
              </Label>
              <Switch id="risk-alerts" onCheckedChange={playClick} defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="bg-card/50 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacidade e Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={playClick} variant="outline" className="w-full justify-start gap-2 rounded-xl cursor-pointer">
              <Download className="w-4 h-4" />
              Exportar Meus Dados
            </Button>
            <Button onClick={() => SensoryAudio.play('chime')} variant="outline" className="w-full justify-start gap-2 rounded-xl text-destructive hover:text-destructive cursor-pointer">
              <Trash2 className="w-4 h-4" />
              Apagar Todos os Registros
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">sentimentAU v1.0</p>
          <p className="text-xs text-muted-foreground mt-1">
            Diário Emocional Inteligente para Indivíduos Autistas
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
