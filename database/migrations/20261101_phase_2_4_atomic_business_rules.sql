BEGIN;

CREATE OR REPLACE FUNCTION public.submit_vocabulary_items(
  p_items JSONB,
  p_default_topic TEXT,
  p_target_tab TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role TEXT;
  v_user_name TEXT;
  v_target_tab TEXT := LOWER(BTRIM(p_target_tab));
  v_default_topic TEXT := COALESCE(NULLIF(BTRIM(p_default_topic), ''), 'Uploaded');
  v_item JSONB;
  v_word TEXT;
  v_pos TEXT;
  v_bangla_meaning TEXT;
  v_topic TEXT;
  v_example_usage TEXT;
  v_synonyms TEXT[];
  v_inserted public.vocabularies%ROWTYPE;
  v_inserted_items JSONB := '[]'::JSONB;
  v_request_count INTEGER;
  v_daily_count BIGINT;
  v_day_start TIMESTAMPTZ;
  v_action TEXT;
  v_details TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to upload vocabulary'
      USING ERRCODE = '42501';
  END IF;

  IF p_items IS NULL OR JSONB_TYPEOF(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Vocabulary items must be provided as an array'
      USING ERRCODE = '22023';
  END IF;

  v_request_count := JSONB_ARRAY_LENGTH(p_items);
  IF v_request_count = 0 THEN
    RAISE EXCEPTION 'At least one vocabulary item is required'
      USING ERRCODE = '22023';
  END IF;

  IF v_target_tab IS NULL OR v_target_tab NOT IN ('active', 'listening', 'uploaded') THEN
    RAISE EXCEPTION 'Invalid vocabulary destination'
      USING ERRCODE = '22023';
  END IF;

  SELECT profile.role, profile.name
  INTO v_role, v_user_name
  FROM public.profiles AS profile
  WHERE profile.id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A profile is required to upload vocabulary'
      USING ERRCODE = '42501';
  END IF;

  IF v_role <> 'admin' AND v_target_tab <> 'uploaded' THEN
    RAISE EXCEPTION 'General users may only upload to the Uploaded tab'
      USING ERRCODE = '42501';
  END IF;

  IF v_role <> 'admin' THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('vocabulary_upload:' || v_user_id::TEXT, 0)
    );

    v_day_start :=
      pg_catalog.date_trunc('day', pg_catalog.clock_timestamp() AT TIME ZONE 'UTC')
      AT TIME ZONE 'UTC';

    SELECT COUNT(*)
    INTO v_daily_count
    FROM public.vocabularies
    WHERE uploaded_by_id = v_user_id
      AND created_at >= v_day_start
      AND created_at < v_day_start + INTERVAL '1 day';

    IF v_daily_count + v_request_count > 200 THEN
      RAISE EXCEPTION
        'Daily upload limit exceeded. % words uploaded today; % remain (limit: 200).',
        v_daily_count,
        GREATEST(0, 200 - v_daily_count)
        USING ERRCODE = '22023';
    END IF;
  END IF;

  FOR v_item IN
    SELECT item.value
    FROM JSONB_ARRAY_ELEMENTS(p_items) AS item(value)
  LOOP
    IF JSONB_TYPEOF(v_item) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Each vocabulary item must be an object'
        USING ERRCODE = '22023';
    END IF;

    v_word := NULLIF(BTRIM(v_item ->> 'word'), '');
    v_bangla_meaning := NULLIF(BTRIM(v_item ->> 'bangla_meaning'), '');
    IF v_word IS NULL OR v_bangla_meaning IS NULL THEN
      RAISE EXCEPTION 'Each vocabulary item requires a word and meaning'
        USING ERRCODE = '22023';
    END IF;

    v_pos := COALESCE(NULLIF(BTRIM(v_item ->> 'pos'), ''), 'Unknown');
    v_topic := COALESCE(
      NULLIF(BTRIM(v_item ->> 'topic'), ''),
      v_default_topic
    );
    v_example_usage := COALESCE(BTRIM(v_item ->> 'example_usage'), '');

    IF JSONB_TYPEOF(v_item -> 'synonyms') = 'array' THEN
      SELECT COALESCE(
        ARRAY_AGG(synonym.value),
        ARRAY[]::TEXT[]
      )
      INTO v_synonyms
      FROM JSONB_ARRAY_ELEMENTS_TEXT(v_item -> 'synonyms') AS synonym(value);
    ELSE
      v_synonyms := ARRAY[]::TEXT[];
    END IF;

    INSERT INTO public.vocabularies (
      word,
      pos,
      bangla_meaning,
      synonyms,
      example_usage,
      topic,
      target_tab,
      uploaded_by_id,
      uploaded_by_name
    )
    VALUES (
      v_word,
      v_pos,
      v_bangla_meaning,
      v_synonyms,
      v_example_usage,
      v_topic,
      v_target_tab,
      v_user_id,
      v_user_name
    )
    RETURNING * INTO v_inserted;

    v_inserted_items := v_inserted_items || JSONB_BUILD_ARRAY(TO_JSONB(v_inserted));
  END LOOP;

  IF v_request_count = 1 THEN
    v_action := 'VOCAB_UPLOADED';
    v_details := FORMAT(
      'Uploaded word "%s" to topic "%s" [tab: %s]',
      v_inserted.word,
      v_inserted.topic,
      v_target_tab
    );
  ELSE
    v_action := 'VOCAB_BULK_UPLOAD';
    v_details := FORMAT(
      'Bulk imported %s words under "%s" [tab: %s]',
      v_request_count,
      v_default_topic,
      v_target_tab
    );
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    details
  )
  VALUES (
    v_user_id,
    v_user_name,
    v_action,
    v_details
  );

  RETURN JSONB_BUILD_OBJECT(
    'count', v_request_count,
    'items', v_inserted_items
  );
END;
$$;

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
  v_highest_score JSONB := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to save a study session'
      USING ERRCODE = '42501';
  END IF;

  IF (p_grammar_score IS NULL) <> (p_total_questions IS NULL) THEN
    RAISE EXCEPTION 'Grammar score and question count must be provided together'
      USING ERRCODE = '22023';
  END IF;

  IF p_total_questions IS NOT NULL AND (
    p_total_questions <= 0
    OR p_grammar_score < 0
    OR p_grammar_score > p_total_questions
  ) THEN
    RAISE EXCEPTION 'Grammar score must be between zero and the question count'
      USING ERRCODE = '22023';
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

  IF p_grammar_score IS NOT NULL THEN
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
      highest_score = EXCLUDED.highest_score,
      total_questions = EXCLUDED.total_questions,
      updated_at = NOW()
    WHERE
      stored.total_questions <= 0
      OR EXCLUDED.highest_score::NUMERIC / EXCLUDED.total_questions
        > stored.highest_score::NUMERIC / NULLIF(stored.total_questions, 0)
    RETURNING * INTO v_progress;

    IF NOT FOUND THEN
      SELECT *
      INTO v_progress
      FROM public.grammar_progress
      WHERE user_id = v_user_id;
    END IF;

    v_highest_score := JSONB_BUILD_OBJECT(
      'score', v_progress.highest_score,
      'total', v_progress.total_questions,
      'percent', ROUND(
        v_progress.highest_score::NUMERIC
        / NULLIF(v_progress.total_questions, 0)
        * 100
      ),
      'achievedAt', v_progress.updated_at
    );
  END IF;

  RETURN JSONB_BUILD_OBJECT(
    'durationSeconds', v_duration_seconds,
    'highestGrammarScore', v_highest_score
  );
END;
$$;

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
    RAISE EXCEPTION 'A target user and valid role are required'
      USING ERRCODE = '22023';
  END IF;

  SELECT name
  INTO v_actor_name
  FROM public.profiles
  WHERE id = v_actor_id;

  UPDATE public.profiles
  SET role = p_role
  WHERE id = p_target_user_id
  RETURNING * INTO v_updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The target profile does not exist'
      USING ERRCODE = 'P0002';
  END IF;

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
    v_actor_name,
    'ROLE_CHANGE',
    FORMAT('Role updated to [%s] by administrator', UPPER(p_role))
  );

  RETURN JSONB_BUILD_OBJECT(
    'id', v_updated_profile.id,
    'name', v_updated_profile.name,
    'email', v_updated_profile.email,
    'role', v_updated_profile.role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_audit_log(p_log_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted_count BIGINT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators may delete audit logs'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.audit_logs WHERE id = p_log_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_audit_logs()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted_count BIGINT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators may clear audit logs'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.audit_logs;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

REVOKE INSERT ON TABLE public.vocabularies FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE ON TABLE
  public.spelling_progress,
  public.flashcard_progress,
  public.grammar_progress
FROM PUBLIC, anon, authenticated;
REVOKE INSERT ON TABLE public.user_activity_logs FROM PUBLIC, anon, authenticated;

REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (id, name, email, role, avatar_url, auth_provider, device_info, created_at, last_active_at)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (name, avatar_url, device_info, last_active_at)
  ON TABLE public.profiles TO authenticated;

REVOKE UPDATE, DELETE ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vocabularies'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE FORMAT(
      'DROP POLICY %I ON public.vocabularies',
      existing_policy.policyname
    );
  END LOOP;

  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND cmd IN ('UPDATE', 'DELETE')
  LOOP
    EXECUTE FORMAT(
      'DROP POLICY %I ON public.audit_logs',
      existing_policy.policyname
    );
  END LOOP;

  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'UPDATE'
  LOOP
    EXECUTE FORMAT(
      'DROP POLICY %I ON public.profiles',
      existing_policy.policyname
    );
  END LOOP;
END;
$$;

CREATE POLICY "Update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

REVOKE ALL ON FUNCTION public.submit_vocabulary_items(JSONB, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_vocabulary_items(JSONB, TEXT, TEXT)
  TO authenticated;

REVOKE ALL ON FUNCTION public.record_flashcard_result(TEXT, TEXT, TEXT, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_flashcard_result(TEXT, TEXT, TEXT, INTEGER)
  TO authenticated;

REVOKE ALL ON FUNCTION public.record_spelling_result(TEXT, TEXT, BOOLEAN, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_spelling_result(TEXT, TEXT, BOOLEAN, INTEGER)
  TO authenticated;

REVOKE ALL ON FUNCTION public.record_study_session(INTEGER, INTEGER, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_study_session(INTEGER, INTEGER, INTEGER)
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_profile_role(UUID, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_role(UUID, TEXT)
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_delete_audit_log(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_audit_log(UUID)
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_clear_audit_logs()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_clear_audit_logs()
  TO authenticated;

COMMIT;
