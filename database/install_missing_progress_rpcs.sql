-- =========================================================================
-- SPELLYCRAFT PLATFORM: INSTALL MISSING PROGRESS & STUDY RPCS
-- =========================================================================
-- Run this in your Supabase SQL Editor to install the atomic RPC functions
-- for recording spelling, flashcards, and study sessions.
-- =========================================================================

BEGIN;

-- 1. RECORD SPELLING RESULT RPC
CREATE OR REPLACE FUNCTION public.record_spelling_result(
  p_topic TEXT,
  p_word TEXT,
  p_is_correct BOOLEAN,
  p_last_index INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_topic TEXT := NULLIF(BTRIM(p_topic), '');
  v_word TEXT := NULLIF(BTRIM(p_word), '');
  v_progress public.spelling_progress%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to save progress'
      USING ERRCODE = '42501';
  END IF;
  IF v_topic IS NULL OR v_word IS NULL OR p_is_correct IS NULL THEN
    RAISE EXCEPTION 'A topic, word, and result are required to save progress'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.spelling_progress AS stored (
    user_id,
    topic,
    mastered_words,
    incorrect_words,
    last_index,
    updated_at
  )
  VALUES (
    v_user_id,
    v_topic,
    CASE WHEN p_is_correct THEN ARRAY[v_word] ELSE ARRAY[]::TEXT[] END,
    CASE WHEN NOT p_is_correct THEN ARRAY[v_word] ELSE ARRAY[]::TEXT[] END,
    GREATEST(COALESCE(p_last_index, 0), 0),
    NOW()
  )
  ON CONFLICT (user_id, topic) DO UPDATE SET
    mastered_words = CASE
      WHEN p_is_correct THEN
        ARRAY_APPEND(ARRAY_REMOVE(COALESCE(stored.mastered_words, ARRAY[]::TEXT[]), v_word), v_word)
      ELSE ARRAY_REMOVE(COALESCE(stored.mastered_words, ARRAY[]::TEXT[]), v_word)
    END,
    incorrect_words = CASE
      WHEN NOT p_is_correct THEN
        ARRAY_APPEND(ARRAY_REMOVE(COALESCE(stored.incorrect_words, ARRAY[]::TEXT[]), v_word), v_word)
      ELSE ARRAY_REMOVE(COALESCE(stored.incorrect_words, ARRAY[]::TEXT[]), v_word)
    END,
    last_index = GREATEST(COALESCE(p_last_index, 0), 0),
    updated_at = NOW()
  RETURNING * INTO v_progress;

  RETURN JSONB_BUILD_OBJECT(
    'masteredWords', TO_JSONB(v_progress.mastered_words),
    'incorrectWords', TO_JSONB(v_progress.incorrect_words),
    'lastIndex', v_progress.last_index
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_spelling_result(TEXT, TEXT, BOOLEAN, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_spelling_result(TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;

-- 2. RECORD FLASHCARD RESULT RPC
CREATE OR REPLACE FUNCTION public.record_flashcard_result(
  p_topic TEXT,
  p_word TEXT,
  p_status TEXT,
  p_last_index INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_topic TEXT := NULLIF(BTRIM(p_topic), '');
  v_word TEXT := NULLIF(BTRIM(p_word), '');
  v_status TEXT := LOWER(BTRIM(p_status));
  v_progress public.flashcard_progress%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to save progress'
      USING ERRCODE = '42501';
  END IF;
  IF v_topic IS NULL OR v_word IS NULL THEN
    RAISE EXCEPTION 'A topic and word are required to save progress'
      USING ERRCODE = '22023';
  END IF;
  IF v_status IS NULL OR v_status NOT IN ('knew', 'unknown', 'forgot') THEN
    RAISE EXCEPTION 'Invalid flashcard result'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.flashcard_progress AS stored (
    user_id,
    topic,
    known_words,
    unknown_words,
    forgot_words,
    last_index,
    updated_at
  )
  VALUES (
    v_user_id,
    v_topic,
    CASE WHEN v_status = 'knew' THEN ARRAY[v_word] ELSE ARRAY[]::TEXT[] END,
    CASE WHEN v_status = 'unknown' THEN ARRAY[v_word] ELSE ARRAY[]::TEXT[] END,
    CASE WHEN v_status = 'forgot' THEN ARRAY[v_word] ELSE ARRAY[]::TEXT[] END,
    GREATEST(COALESCE(p_last_index, 0), 0),
    NOW()
  )
  ON CONFLICT (user_id, topic) DO UPDATE SET
    known_words = CASE
      WHEN v_status = 'knew' THEN
        ARRAY_APPEND(ARRAY_REMOVE(COALESCE(stored.known_words, ARRAY[]::TEXT[]), v_word), v_word)
      ELSE ARRAY_REMOVE(COALESCE(stored.known_words, ARRAY[]::TEXT[]), v_word)
    END,
    unknown_words = CASE
      WHEN v_status = 'unknown' THEN
        ARRAY_APPEND(ARRAY_REMOVE(COALESCE(stored.unknown_words, ARRAY[]::TEXT[]), v_word), v_word)
      ELSE ARRAY_REMOVE(COALESCE(stored.unknown_words, ARRAY[]::TEXT[]), v_word)
    END,
    forgot_words = CASE
      WHEN v_status = 'forgot' THEN
        ARRAY_APPEND(ARRAY_REMOVE(COALESCE(stored.forgot_words, ARRAY[]::TEXT[]), v_word), v_word)
      ELSE ARRAY_REMOVE(COALESCE(stored.forgot_words, ARRAY[]::TEXT[]), v_word)
    END,
    last_index = GREATEST(COALESCE(p_last_index, 0), 0),
    updated_at = NOW()
  RETURNING * INTO v_progress;

  RETURN JSONB_BUILD_OBJECT(
    'knownWords', TO_JSONB(v_progress.known_words),
    'unknownWords', TO_JSONB(v_progress.unknown_words),
    'forgotWords', TO_JSONB(v_progress.forgot_words),
    'lastIndex', v_progress.last_index
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_flashcard_result(TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_flashcard_result(TEXT, TEXT, TEXT, INTEGER) TO authenticated;

-- 3. RECORD STUDY SESSION RPC
CREATE OR REPLACE FUNCTION public.record_study_session(
  p_duration_seconds INTEGER,
  p_grammar_score INTEGER DEFAULT NULL,
  p_total_questions INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_duration_seconds INTEGER := GREATEST(COALESCE(p_duration_seconds, 0), 0);
  v_progress public.grammar_progress%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to save a study session'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.user_activity_logs (
    user_id,
    action,
    details,
    duration_seconds
  )
  VALUES (
    v_user_id,
    'STUDY_SESSION',
    CASE
      WHEN p_grammar_score IS NULL THEN NULL
      ELSE JSONB_BUILD_OBJECT(
        'grammarScore', p_grammar_score,
        'totalQuestions', p_total_questions
      )::TEXT
    END,
    v_duration_seconds
  );

  IF p_grammar_score IS NOT NULL AND p_total_questions IS NOT NULL THEN
    INSERT INTO public.grammar_progress AS stored (
      user_id,
      highest_score,
      total_questions,
      updated_at
    )
    VALUES (
      v_user_id,
      p_grammar_score,
      p_total_questions,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      highest_score = GREATEST(stored.highest_score, EXCLUDED.highest_score),
      total_questions = EXCLUDED.total_questions,
      updated_at = NOW()
    RETURNING * INTO v_progress;
  END IF;

  RETURN JSONB_BUILD_OBJECT('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.record_study_session(INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_study_session(INTEGER, INTEGER, INTEGER) TO authenticated;

-- 4. ADMIN UPDATE PROFILE ROLE RPC
CREATE OR REPLACE FUNCTION public.admin_update_profile_role(
  p_target_user_id UUID,
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_name TEXT;
  v_updated_profile public.profiles%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators may change user roles'
      USING ERRCODE = '42501';
  END IF;

  IF p_target_user_id IS NULL
    OR p_role IS NULL
    OR p_role NOT IN ('general', 'admin') THEN
    RAISE EXCEPTION 'A target user ID and a valid role (general or admin) are required'
      USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(name, email, 'Administrator')
  INTO v_actor_name
  FROM public.profiles
  WHERE id = v_actor_id;

  UPDATE public.profiles
  SET role = p_role
  WHERE id = p_target_user_id
  RETURNING * INTO v_updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The target candidate profile does not exist'
      USING ERRCODE = 'P0002';
  END IF;

  BEGIN
    INSERT INTO public.audit_logs (
      user_id,
      target_user_id,
      user_name,
      action,
      details
    )
    VALUES (
      v_actor_id,
      p_target_user_id,
      COALESCE(v_actor_name, 'Administrator'),
      'ROLE_CHANGE',
      FORMAT('Role updated to [%s] by administrator', UPPER(p_role))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to record audit log: %', SQLERRM;
  END;

  RETURN JSONB_BUILD_OBJECT(
    'id', v_updated_profile.id,
    'name', v_updated_profile.name,
    'email', v_updated_profile.email,
    'role', v_updated_profile.role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_profile_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_role(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
