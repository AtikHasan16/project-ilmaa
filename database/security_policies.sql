-- New projects: apply after schema.sql.
-- Existing projects: apply the canonical database migrations first.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spelling_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at);

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

CREATE OR REPLACE FUNCTION public.get_active_user_count()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*)
  FROM public.profiles
  WHERE last_active_at >= NOW() - INTERVAL '5 minutes';
$$;

REVOKE ALL ON FUNCTION public.get_active_user_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_user_count() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
    AND COALESCE((SELECT auth.role()), '') <> 'service_role'
    AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change profile roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

REVOKE ALL ON FUNCTION public.prevent_profile_role_escalation() FROM PUBLIC;

DO $$
DECLARE
  table_name TEXT;
  existing_policy RECORD;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles',
    'vocabularies',
    'spelling_progress',
    'flashcard_progress',
    'grammar_questions',
    'grammar_progress',
    'user_activity_logs',
    'audit_logs'
  ]
  LOOP
    FOR existing_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', existing_policy.policyname, table_name);
    END LOOP;
  END LOOP;
END;
$$;

CREATE POLICY "Read shared and owned vocabulary"
  ON public.vocabularies FOR SELECT TO anon, authenticated
  USING (
    public.is_admin()
    OR target_tab IS DISTINCT FROM 'uploaded'
    OR uploaded_by_id = (SELECT auth.uid())
  );

CREATE POLICY "Admins delete vocabulary"
  ON public.vocabularies FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Public read grammar questions"
  ON public.grammar_questions FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Read own or admin profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Insert own general profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()) AND role = 'general');

CREATE POLICY "Update own profile or admin profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Manage own or admin spelling progress"
  ON public.spelling_progress FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Manage own or admin flashcard progress"
  ON public.flashcard_progress FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Manage own or admin grammar progress"
  ON public.grammar_progress FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Manage own or admin activity logs"
  ON public.user_activity_logs FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Admins read audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Authenticated insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

-- Lock down legacy tables when present. Remove old permissive policies first.
DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
    FOR existing_policy IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.users', existing_policy.policyname);
    END LOOP;
    EXECUTE 'CREATE POLICY "Admins manage legacy users" ON public.users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;

  IF to_regclass('public.vocabulary_progress') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.vocabulary_progress ENABLE ROW LEVEL SECURITY';
    FOR existing_policy IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'vocabulary_progress'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.vocabulary_progress', existing_policy.policyname);
    END LOOP;
    EXECUTE 'CREATE POLICY "Admins manage legacy vocabulary progress" ON public.vocabulary_progress FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;
END;
$$;
