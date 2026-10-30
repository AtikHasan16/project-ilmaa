BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vocabularies'
      AND column_name = 'uploaded_by'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'vocabularies'
        AND column_name = 'uploaded_by_name'
    ) THEN
      ALTER TABLE public.vocabularies RENAME COLUMN uploaded_by TO uploaded_by_name;
    ELSE
      UPDATE public.vocabularies
      SET uploaded_by_name = COALESCE(uploaded_by_name, uploaded_by);
      ALTER TABLE public.vocabularies DROP COLUMN uploaded_by;
    END IF;
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vocabularies'
      AND column_name = 'uploaded_by_name'
  ) THEN
    RAISE EXCEPTION 'Expected public.vocabularies.uploaded_by or uploaded_by_name';
  END IF;
END;
$$;

ALTER TABLE public.vocabularies
  ADD COLUMN IF NOT EXISTS uploaded_by_id UUID;

ALTER TABLE public.vocabularies
  ADD COLUMN IF NOT EXISTS target_tab TEXT NOT NULL DEFAULT 'active';

UPDATE public.vocabularies
SET target_tab = CASE LOWER(SPLIT_PART(uploaded_by_name, ':', 1))
  WHEN 'active' THEN 'active'
  WHEN 'listening' THEN 'listening'
  WHEN 'uploaded' THEN 'uploaded'
  ELSE target_tab
END
WHERE LOWER(SPLIT_PART(uploaded_by_name, ':', 1))
  IN ('active', 'listening', 'uploaded');

UPDATE public.vocabularies
SET target_tab = 'active'
WHERE target_tab IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.vocabularies
    WHERE target_tab NOT IN ('active', 'listening', 'uploaded')
  ) THEN
    RAISE EXCEPTION
      'Invalid target_tab values exist. Resolve them before applying the Phase 2.3 migration.';
  END IF;
END;
$$;

ALTER TABLE public.vocabularies
  ALTER COLUMN target_tab SET DEFAULT 'active',
  ALTER COLUMN target_tab SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vocabularies_target_tab_check'
      AND conrelid = 'public.vocabularies'::regclass
  ) THEN
    ALTER TABLE public.vocabularies
      ADD CONSTRAINT vocabularies_target_tab_check
      CHECK (target_tab IN ('active', 'listening', 'uploaded'));
  END IF;
END;
$$;

UPDATE public.vocabularies AS vocabulary
SET uploaded_by_id = profile.id
FROM public.profiles AS profile
WHERE vocabulary.uploaded_by_id IS NULL
  AND profile.id = CASE
    WHEN SPLIT_PART(vocabulary.uploaded_by_name, ':', 2)
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN SPLIT_PART(vocabulary.uploaded_by_name, ':', 2)::UUID
    WHEN vocabulary.uploaded_by_name
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN vocabulary.uploaded_by_name::UUID
    ELSE NULL
  END;

UPDATE public.vocabularies
SET uploaded_by_name = REGEXP_REPLACE(
  uploaded_by_name,
  '^(active|listening|uploaded):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(:|$))?',
  '',
  'i'
)
WHERE uploaded_by_name ~* '^(active|listening|uploaded):';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vocabularies_uploaded_by_id_fkey'
      AND conrelid = 'public.vocabularies'::regclass
  ) THEN
    ALTER TABLE public.vocabularies
      ADD CONSTRAINT vocabularies_uploaded_by_id_fkey
      FOREIGN KEY (uploaded_by_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS target_user_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'access_id'
  ) THEN
    EXECUTE $statement$
      UPDATE public.audit_logs AS audit
      SET target_user_id = profile.id
      FROM public.profiles AS profile
      WHERE audit.target_user_id IS NULL
        AND profile.id = CASE
          WHEN TRIM(audit.access_id)
            ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN TRIM(audit.access_id)::UUID
          ELSE NULL
        END
    $statement$;
    ALTER TABLE public.audit_logs DROP COLUMN access_id;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'audit_logs_target_user_id_fkey'
      AND conrelid = 'public.audit_logs'::regclass
  ) THEN
    ALTER TABLE public.audit_logs
      ADD CONSTRAINT audit_logs_target_user_id_fkey
      FOREIGN KEY (target_user_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_vocabularies_uploaded_by_id ON public.vocabularies(uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_vocabularies_created_at ON public.vocabularies(created_at);
CREATE INDEX IF NOT EXISTS idx_vocabularies_target_tab ON public.vocabularies(target_tab);
CREATE INDEX IF NOT EXISTS idx_grammar_questions_module ON public.grammar_questions(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON public.audit_logs(target_user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.vocabularies
    GROUP BY word, topic
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Duplicate vocabulary word/topic pairs exist. Review and resolve them before adding the unique index; no rows were deleted.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabularies_word_topic
  ON public.vocabularies(word, topic);

DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vocabularies'
  LOOP
    EXECUTE FORMAT('DROP POLICY %I ON public.vocabularies', existing_policy.policyname);
  END LOOP;
END;
$$;

ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read shared and owned vocabulary"
  ON public.vocabularies FOR SELECT TO anon, authenticated
  USING (
    public.is_admin()
    OR target_tab IS DISTINCT FROM 'uploaded'
    OR uploaded_by_id = (SELECT auth.uid())
  );

CREATE POLICY "Insert own uploaded vocabulary or admin content"
  ON public.vocabularies FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (target_tab = 'uploaded' AND uploaded_by_id = (SELECT auth.uid()))
  );

CREATE POLICY "Admins delete vocabulary"
  ON public.vocabularies FOR DELETE TO authenticated
  USING (public.is_admin());

COMMIT;
