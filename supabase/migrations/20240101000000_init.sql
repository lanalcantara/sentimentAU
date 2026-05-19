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
