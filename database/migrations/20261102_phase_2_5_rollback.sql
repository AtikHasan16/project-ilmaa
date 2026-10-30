-- Rollback: Phase 2.5 - Topic Counts RPC
-- Reverts public.get_vocabulary_topic_counts()

BEGIN;

DROP FUNCTION IF EXISTS public.get_vocabulary_topic_counts();

COMMIT;
