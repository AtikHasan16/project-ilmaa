-- Rollback: Phase 3.5 - User Badges and Gamification Milestones
BEGIN;
DROP TABLE IF EXISTS public.user_badges CASCADE;
COMMIT;
