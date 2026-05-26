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
  type text NOT NULL, -- e.g., 'hug'
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
