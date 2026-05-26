const { Client } = require('pg')

const regions = [
  'sa-east-1',
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'us-east-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'ca-central-1'
]

const password = 'sM3mGZajnZiaCBoW'
const projectRef = 'hunnvtfeqinxurrxcdso'

const sql = `
-- 1. Update sentiment_users (profiles)
ALTER TABLE public.sentiment_users 
ADD COLUMN IF NOT EXISTS flor_avatar_atual text DEFAULT 'semente',
ADD COLUMN IF NOT EXISTS flores_desbloqueadas text[] DEFAULT ARRAY['semente'];

-- 2. Update sentiment_entries (mood_logs)
ALTER TABLE public.sentiment_entries
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- 3. Create sentiment_notifications table
CREATE TABLE IF NOT EXISTS public.sentiment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.sentiment_users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.sentiment_users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Create sentiment_follows table
CREATE TABLE IF NOT EXISTS public.sentiment_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES public.sentiment_users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES public.sentiment_users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

-- Enable RLS on new tables
ALTER TABLE public.sentiment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_follows ENABLE ROW LEVEL SECURITY;
`

async function tryConnectAndMigrate() {
  for (const region of regions) {
    const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres`
    
    const client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 3000 // fast fail
    })

    try {
      await client.connect()
      console.log(`Connected successfully to region: ${region}! Executing Gamification DDL migrations...`)
      await client.query(sql)
      console.log('Gamification migrations executed successfully!')
      await client.end()
      return // Success!
    } catch (err) {
      if (err.message.includes('password authentication failed') || err.message.includes('tenant') || err.message.includes('not found') || err.code === 'ENOTFOUND') {
        // region mismatch, continue silently
      } else {
        console.error(`Failed on ${region}: ${err.message}`)
      }
      try { await client.end() } catch (e) {}
    }
  }
  console.log('Could not connect to any standard Supabase region pooler.')
}

tryConnectAndMigrate()
