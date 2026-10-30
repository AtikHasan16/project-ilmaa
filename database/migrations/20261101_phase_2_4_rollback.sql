-- Rollback: Phase 2.4 - Atomic Business RPCs
-- Reverts all transactional stored procedures installed by Phase 2.4.

BEGIN;

DROP FUNCTION IF EXISTS public.admin_clear_audit_logs();
DROP FUNCTION IF EXISTS public.admin_delete_audit_log(UUID);
DROP FUNCTION IF EXISTS public.admin_update_profile_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.record_study_session(INTEGER);
DROP FUNCTION IF EXISTS public.record_spelling_result(TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.record_flashcard_result(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.submit_vocabulary_items(JSONB, TEXT, TEXT);

COMMIT;
