-- Migration: Phase 3.5 - User Badges and Gamification Milestones
-- Stores unlocked achievement badges per user with deny-by-default Row-Level Security.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_key ON public.user_badges(badge_key);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can view their own badges
CREATE POLICY "Users can select own badges"
  ON public.user_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can unlock/insert their own badges
CREATE POLICY "Users can insert own badges"
  ON public.user_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admins can view all badges for user audit
CREATE POLICY "Admins can select all badges"
  ON public.user_badges
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

GRANT SELECT, INSERT ON public.user_badges TO authenticated;

COMMIT;
