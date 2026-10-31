-- =========================================================================
-- IMLAA PLATFORM: NON-DESTRUCTIVE PATCH SCRIPT (PRESERVES EXISTING DATA)
-- =========================================================================
-- Instructions:
-- Run this in your Supabase SQL Editor if you want to keep existing vocabulary,
-- user profiles, and test scores while fixing the missing columns and RPCs.
-- =========================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Ensure public.profiles has all necessary fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'general' CHECK (role IN ('general', 'admin')),
  avatar_url TEXT,
  auth_provider TEXT DEFAULT 'email',
  device_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migrate public.vocabularies columns
DO $$
BEGIN
  -- If uploaded_by exists as text, rename it to uploaded_by_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabularies' AND column_name = 'uploaded_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabularies' AND column_name = 'uploaded_by_name'
  ) THEN
    ALTER TABLE public.vocabularies RENAME COLUMN uploaded_by TO uploaded_by_name;
  END IF;

  -- Add uploaded_by_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabularies' AND column_name = 'uploaded_by_id'
  ) THEN
    ALTER TABLE public.vocabularies ADD COLUMN uploaded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- Add uploaded_by_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabularies' AND column_name = 'uploaded_by_name'
  ) THEN
    ALTER TABLE public.vocabularies ADD COLUMN uploaded_by_name TEXT DEFAULT 'Admin';
  END IF;

  -- Add target_tab if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabularies' AND column_name = 'target_tab'
  ) THEN
    ALTER TABLE public.vocabularies ADD COLUMN target_tab TEXT NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- 3. Install user_badges table for milestone achievements
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

-- 4. Install the missing fast aggregation RPC
CREATE OR REPLACE FUNCTION public.get_vocabulary_topic_counts()
RETURNS TABLE (
  topic TEXT,
  target_tab TEXT,
  count BIGINT,
  uploaded_by_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    v.topic,
    v.target_tab,
    COUNT(*)::BIGINT AS count,
    MAX(v.uploaded_by_name) AS uploaded_by_name
  FROM public.vocabularies AS v
  GROUP BY v.topic, v.target_tab;
$$;

REVOKE ALL ON FUNCTION public.get_vocabulary_topic_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_vocabulary_topic_counts() TO authenticated, anon;

-- 5. Enable RLS and grant access on user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User badges select policy" ON public.user_badges;
CREATE POLICY "User badges select policy"
  ON public.user_badges FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

DROP POLICY IF EXISTS "User badges insert policy" ON public.user_badges;
CREATE POLICY "User badges insert policy"
  ON public.user_badges FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT ON public.user_badges TO authenticated;

COMMIT;
