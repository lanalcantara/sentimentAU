# sentimentAU 🫂
### *Diário Emocional Inteligente e Acessível para Indivíduos Autistas*

---

> [!NOTE]
> **Projeto Acadêmico de Conclusão - 5º Período de Análise e Desenvolvimento de Sistemas**  
> **Instituição:** Centro Universitário SENAC  
> **Contexto:** Trabalho prático interdisciplinar focado no desenvolvimento de Web Apps acessíveis, robustos e com forte impacto de responsabilidade social.

---

## 🎨 Design System e Estética Sensorial (Premium & Clean)

O **sentimentAU** foi projetado seguindo as melhores diretrizes de UI/UX voltadas para indivíduos no Espectro Autista (TEA). A estética adota uma abordagem minimalista de **Glassmorphism**, com cantos amplamente arredondados (`radius: 1rem`), paletas de cores balanceadas que reduzem a fadiga visual e animações suaves.

O projeto possui **três modos visuais** integrados dinamicamente via variáveis CSS puras:
1. **Modo Padrão (Light):** Tons de azul-escuro e dourado suave, com fundo off-white (`#f5f7fa`).
2. **Modo Escuro (Dark):** Fundo em azul marinho profundo (`#151b2d`) e elementos suaves em sálvia, eliminando o contraste estridente de fundos pretos absolutos.
3. **Modo Calmo (Modo Zen):** Paleta pastel de baixíssimo contraste (Sálvia & Lavanda) com **desativação completa de todas as transições e micro-animações**, diminuindo de imediato a carga cognitiva e prevenindo episódios de sobrecarga sensorial.
4. **Modo Calmo Escuro (.dark.calm-mode):** Uma combinação premium exclusiva focada em extrema acessibilidade noturna, com textos em tom ardósia suave e fundo suavizado (`#101524`).

---

## 🚀 Principais Funcionalidades

### 1. 🧠 Mecanismo Local de Análise de Sentimento (Local NLP Engine)
Para preservar 100% a privacidade do diário do usuário e garantir um funcionamento ágil e offline, desenvolvemos um analisador léxico de linguagem natural em português brasileiro (`lib/services/local-analyzer.ts`).
*   **Dicionário Gramatical Nativo:** Mapeamento inteligente de palavras-chave, flexões verbais e adjetivos associados a estados positivos, negativos e indiferentes.
*   **Comunicação Não-Verbal por Emojis:** Identifica padrões emocionais a partir de emojis inclusos no texto, calculando pesos emocionais e prevendo o humor exato mesmo se o usuário optar por registrar seu dia usando apenas figuras ilustrativas.
*   **Prevenção de Colapso (Sensory Meltdown Risk):** Cruza a análise do relato com os níveis de energia e conforto físico fornecidos pelo usuário, alertando sobre potenciais crises sensoriais iminentes (*Baixo, Moderado e Alto*).

### 2. 🎵 Central de Sons ASMR (Feedback Háptico Auditivo)
Integramos a Web Audio API do navegador para gerar feedback sonoro sintetizado nativamente em tempo real de forma extremamente relaxante. O usuário pode escolher entre **9 sons premium** para feedback de clique:
*   *Bubble, Pop, Sensory Click, Chime, Airy Swoosh, Raindrop, Bell.*
*   **🌾 Minecraft Grass (Soft Crunch):** Buffer de ruído rosa sob filtro passa-banda dinâmico para simular o som tátil de andar sobre a grama.
*   **🏹 Minecraft Bow (Tension Release):** Varredura de osciladores sinusoidais simulando a tensão e liberação elástica de corda de arco.

### 3. 🫂 Mural Dinâmico da Comunidade (Cards de Apoio)
Desenvolvemos uma rota de API dinâmica (`/api/community`) integrada ao **Supabase**.
*   **Mesclagem Progressiva (Progressive Padding):** Carrega diários reais de outros usuários cadastrados na base de dados em tempo real.
*   **Preenchimento com Mocks Acolhedores:** Caso o aplicativo esteja iniciando e possua menos de 4 usuários ativos, o sistema preenche as vagas restantes de forma dinâmica com relatos de apoio simulados, substituindo-os progressivamente à medida que novos cadastros ocorrem.
*   **Abraço Virtual Silencioso:** Permite enviar apoio aos relatos comunitários, ativando feedbacks sensoriais sonoros.

### 4. 🖼️ Envio e Recorte de Avatar (React Image Crop)
Permite que o usuário personalize seu perfil subindo fotos reais, com ferramenta interativa de recorte circular e envio otimizado em base64 direto para a tabela de perfis de usuários no Supabase.

---

## 🛠️ Stack Tecnológica

*   **Framework:** Next.js 16.2.6 (Turbopack & App Router)
*   **Estilização:** Tailwind CSS v4.0.0
*   **Banco de Dados & Autenticação:** Supabase (PostgreSQL com esquemas relacionais de perfis de diários e suporte comunitário)
*   **Biblioteca de Áudio:** Web Audio API (Sintetizadores de áudio nativos offline)
*   **Recorte de Imagem:** React Image Crop

---

## 📂 Arquitetura do Repositório

```yaml
sentimentAU/
├── app/
│   ├── api/                 # Endpoints dinâmicos (community, profile, diary)
│   ├── definicoes/          # Tela de configurações (acessibilidade, som, dados)
│   ├── historico/           # Histórico de relatos e linha do tempo de humor
│   ├── insights/            # Análise de padrões sensoriais e risco de colapso
│   ├── novo-registo/        # Wizard interativo de novo diário emocional
│   ├── globals.css          # Design System com tokens HSL e modos visuais
│   └── page.tsx             # Dashboard principal e login
├── components/
│   ├── diary/               # Wizard de diário e formulários táteis
│   ├── layout/              # Sidebar desktop responsiva e MobileNav
│   └── ui/                  # Componentes base (Switch, Cards, Badges)
├── lib/
│   ├── context/             # Provedores de Acessibilidade (CalmMode, ThemeContext)
│   └── services/            # Serviços de banco de dados e geradores ASMR
└── supabase/
    └── migrations/          # Migrações SQL para criação automática do banco
```

---

## ⚙️ Variáveis de Ambiente (`.env.local`)

Para rodar o projeto localmente ou realizar o deploy no **Vercel**, você deve configurar as seguintes chaves de ambiente (nunca adicione o arquivo `.env.local` ao repositório git público!):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-token-anon-do-supabase
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-admin
```

> [!WARNING]
> A chave `SUPABASE_SERVICE_ROLE_KEY` é necessária para carregar e listar os outros usuários no Mural Dinâmico da Comunidade (`/api/community`) com segurança, ignorando políticas RLS rígidas no lado do servidor. **Nunca exponha essa chave no código cliente!**

---

## 💻 Como Rodar Localmente

1. Instale as dependências:
   ```bash
   pnpm install # ou npm install
   ```
2. Inicialize o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Acesse `http://localhost:3000` ou a porta indicada no console.
