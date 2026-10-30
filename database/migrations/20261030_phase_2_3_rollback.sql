-- Rollback: Phase 2.3 - Data Contract Normalization
-- Drops added indexes and contract helper columns if required to revert to previous state.

BEGIN;

DROP INDEX IF EXISTS public.idx_audit_logs_target_user_id;
DROP INDEX IF EXISTS public.idx_grammar_questions_module;
DROP INDEX IF EXISTS public.idx_vocabularies_target_tab;
DROP INDEX IF EXISTS public.idx_vocabularies_created_at;
DROP INDEX IF EXISTS public.idx_vocabularies_uploaded_by_id;
DROP INDEX IF EXISTS public.idx_profiles_role;

-- Revert columns if needed
ALTER TABLE public.vocabularies DROP CONSTRAINT IF EXISTS uq_vocabularies_word_topic;
ALTER TABLE public.vocabularies DROP COLUMN IF EXISTS target_tab;
ALTER TABLE public.vocabularies DROP COLUMN IF EXISTS uploaded_by_id;

COMMIT;
