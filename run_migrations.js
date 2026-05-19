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
-- Enable UUID generator
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create sentiment_users table
CREATE TABLE IF NOT EXISTS public.sentiment_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create sentiment_entries table
CREATE TABLE IF NOT EXISTS public.sentiment_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.sentiment_users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  energy_level integer NOT NULL,
  comfort_level integer NOT NULL,
  sentiment text NOT NULL,
  confidence numeric NOT NULL,
  emotions text[] NOT NULL,
  keywords jsonb NOT NULL,
  suggested_sensory_tags text[] NOT NULL,
  selected_sensory_tags text[] NOT NULL,
  risk_level text NOT NULL,
  risk_indicators text[] NOT NULL,
  suggestions text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create sentiment_rate_limit table
CREATE TABLE IF NOT EXISTS public.sentiment_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.sentiment_users(id) ON DELETE CASCADE NOT NULL,
  usage_date date NOT NULL DEFAULT current_date,
  tokens_consumed integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, usage_date)
);

-- Enable RLS on tables for security
ALTER TABLE public.sentiment_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_rate_limit ENABLE ROW LEVEL SECURITY;
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
      console.log(`Connected successfully to region: ${region}! Executing DDL migrations...`)
      await client.query(sql)
      console.log('Migrations executed successfully! sentiment_users, sentiment_entries, and sentiment_rate_limit tables have been created.')
      await client.end()
      return // Success!
    } catch (err) {
      if (err.message.includes('password authentication failed') || err.message.includes('tenant') || err.message.includes('not found') || err.code === 'ENOTFOUND') {
        // region mismatch, continue silently
      } else {
        // console.error(\`Failed on \${region}: \${err.message}\`)
      }
      try { await client.end() } catch (e) {}
    }
  }
  console.log('Could not connect to any standard Supabase region pooler.')
}

tryConnectAndMigrate()
