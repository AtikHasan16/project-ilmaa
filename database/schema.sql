-- =========================================================================
-- IMLAA PLATFORM: DATABASE SCHEMA AND SEED DATA (SUPABASE)
-- =========================================================================

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- -------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- -------------------------------------------------------------------------
-- 2. VOCABULARIES (Active, Listening, and Uploaded Corpora)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vocabularies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  pos TEXT NOT NULL,
  bangla_meaning TEXT NOT NULL,
  synonyms TEXT[] DEFAULT '{}',
  example_usage TEXT,
  topic TEXT NOT NULL DEFAULT 'Academic Word List: Sublist A',
  target_tab TEXT NOT NULL DEFAULT 'active' CHECK (target_tab IN ('active', 'listening', 'uploaded')),
  uploaded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_by_name TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocabularies_topic ON public.vocabularies(topic);
CREATE INDEX IF NOT EXISTS idx_vocabularies_target_tab ON public.vocabularies(target_tab);
CREATE INDEX IF NOT EXISTS idx_vocabularies_uploaded_by_id ON public.vocabularies(uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_vocabularies_created_at ON public.vocabularies(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabularies_word_topic ON public.vocabularies(word, topic);

-- -------------------------------------------------------------------------
-- 3. SPELLING PROGRESS (Dedicated Spelling Mastery Tracking)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.spelling_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mastered_words TEXT[] DEFAULT '{}',
  incorrect_words TEXT[] DEFAULT '{}',
  last_index INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_spelling_progress_user ON public.spelling_progress(user_id);

-- -------------------------------------------------------------------------
-- 4. FLASHCARD PROGRESS (Dedicated: Known, Unknown, Forgot Tracking)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  known_words TEXT[] DEFAULT '{}',
  unknown_words TEXT[] DEFAULT '{}',
  forgot_words TEXT[] DEFAULT '{}',
  last_index INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user ON public.flashcard_progress(user_id);

-- -------------------------------------------------------------------------
-- 5. GRAMMAR QUESTIONS & PROGRESS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grammar_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_questions_module ON public.grammar_questions(module);

CREATE TABLE IF NOT EXISTS public.grammar_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  highest_score INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  completed_modules JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- -------------------------------------------------------------------------
-- 6. USER ACTIVITY LOGS (Detailed Session & Telemetry for Admin)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  duration_seconds INT DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_time ON public.user_activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at);

-- -------------------------------------------------------------------------
-- 7. AUDIT LOGS (Platform-wide Admin Audit Trail)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON public.audit_logs(target_user_id);

-- -------------------------------------------------------------------------
-- 8. AUTOMATED TRIGGER: AUTO-SYNC AUTH.USERS -> PUBLIC.PROFILES
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT := 'general';
BEGIN
  -- Automatically grant admin privileges to specified admin email
  IF LOWER(NEW.email) = 'akhasannaeem@gmail.com' THEN
    default_role := 'admin';
  END IF;

  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    avatar_url,
    auth_provider,
    created_at,
    last_active_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    default_role,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    ),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    -- CRITICAL FIX: NEVER overwrite user-customized name, avatar, or role on login!
    name = COALESCE(NULLIF(public.profiles.name, ''), EXCLUDED.name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    last_active_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL FIX: Trigger ONLY on INSERT (when user is first created), NEVER on UPDATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spelling_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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

-- Read the role from trusted database state rather than a client-supplied claim.
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

-- A user may update their own profile, but only an admin or service role can
-- change role. This prevents self-promotion through the profile update policy.
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

DROP POLICY IF EXISTS "Public read vocabulary" ON public.vocabularies;
DROP POLICY IF EXISTS "Public insert vocabulary" ON public.vocabularies;
DROP POLICY IF EXISTS "Public delete vocabulary" ON public.vocabularies;
DROP POLICY IF EXISTS "Public read grammar questions" ON public.grammar_questions;
DROP POLICY IF EXISTS "Allow read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow read spelling progress" ON public.spelling_progress;
DROP POLICY IF EXISTS "Allow upsert spelling progress" ON public.spelling_progress;
DROP POLICY IF EXISTS "Allow read flashcard progress" ON public.flashcard_progress;
DROP POLICY IF EXISTS "Allow upsert flashcard progress" ON public.flashcard_progress;
DROP POLICY IF EXISTS "Allow read grammar progress" ON public.grammar_progress;
DROP POLICY IF EXISTS "Allow upsert grammar progress" ON public.grammar_progress;
DROP POLICY IF EXISTS "Allow read/insert activity logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Allow read/insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Read shared and owned vocabulary" ON public.vocabularies;
DROP POLICY IF EXISTS "Insert own uploaded vocabulary or admin content" ON public.vocabularies;
DROP POLICY IF EXISTS "Admins delete vocabulary" ON public.vocabularies;
DROP POLICY IF EXISTS "Read own or admin profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert own general profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile or admin profiles" ON public.profiles;
DROP POLICY IF EXISTS "Manage own or admin spelling progress" ON public.spelling_progress;
DROP POLICY IF EXISTS "Manage own or admin flashcard progress" ON public.flashcard_progress;
DROP POLICY IF EXISTS "Manage own or admin grammar progress" ON public.grammar_progress;
DROP POLICY IF EXISTS "Manage own or admin activity logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins update audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins delete audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public read grammar questions" ON public.grammar_questions;

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
  USING (id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

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

CREATE POLICY "Admins update audit logs"
  ON public.audit_logs FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete audit logs"
  ON public.audit_logs FOR DELETE TO authenticated
  USING (public.is_admin());

-- Lock down legacy tables when present. They are still queried by older
-- frontend paths, but are not part of the current canonical schema above.
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

-- -------------------------------------------------------------------------
-- 10. INITIAL SEED DATASET (ACADEMIC + LISTENING + GRAMMAR)
-- -------------------------------------------------------------------------
INSERT INTO public.vocabularies (word, pos, bangla_meaning, synonyms, example_usage, topic, target_tab, uploaded_by_name)
SELECT seed.word, seed.pos, seed.bangla_meaning, seed.synonyms,
  seed.example_usage, seed.topic, seed.target_tab, seed.uploaded_by_name
FROM (VALUES
-- Academic Word List (All Active)
('Analysis', 'Noun', 'বিশ্লেষণ', ARRAY['Examination', 'Investigation', 'Scrutiny'], 'A rigorous statistical analysis revealed significant positive outcomes.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Approach', 'Noun', 'পদ্ধতি বা দৃষ্টিভঙ্গি', ARRAY['Method', 'Strategy', 'Perspective'], 'The university adopted a novel multidisciplinary approach to environmental science.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Beneficial', 'Adjective', 'উপকারী বা কল্যাণকর', ARRAY['Advantageous', 'Favorable', 'Helpful'], 'Regular auditory recall practice is highly beneficial for IELTS spelling precision.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Concept', 'Noun', 'ধারণা', ARRAY['Idea', 'Notion', 'Theory'], 'The core concept behind orthographic retrieval is muscle memory without visual cues.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Consistent', 'Adjective', 'ধারাবাহিক বা সঙ্গতিপূর্ণ', ARRAY['Steady', 'Constant', 'Uniform'], 'Consistent daily dictation produces the highest retention rates.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Context', 'Noun', 'প্রসঙ্গ বা পটভূমি', ARRAY['Framework', 'Circumstance', 'Setting'], 'Hearing new lexical terms in academic context reinforces cognitive assimilation.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Criteria', 'Noun', 'মানদণ্ড', ARRAY['Standard', 'Benchmark', 'Measure'], 'Lexical resource is one of the four principal assessment criteria in IELTS writing.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Data', 'Noun', 'উপাত্ত বা তথ্য', ARRAY['Evidence', 'Information', 'Statistics'], 'Empirical data indicates that candidates struggle most with double consonants.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Distinct', 'Adjective', 'স্বতন্ত্র বা সুস্পষ্ট', ARRAY['Separate', 'Discrete', 'Noticeable'], 'British and American English feature distinct phonemic patterns for vowel reduction.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Evidence', 'Noun', 'প্রমাণ বা সাক্ষ্য', ARRAY['Proof', 'Corroboration', 'Confirmation'], 'The research paper cited extensive historical evidence to support the claim.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Factor', 'Noun', 'উপাদান বা নিয়ামক', ARRAY['Element', 'Component', 'Determinant'], 'Stress management is a critical factor during the IELTS listening module.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Identify', 'Verb', 'শনাক্ত করা', ARRAY['Recognize', 'Distinguish', 'Pinpoint'], 'Candidates must rapidly identify distractors in multiple-choice questions.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Indicate', 'Verb', 'নির্দেশ করা বা ইঙ্গিত দেওয়া', ARRAY['Signify', 'Demonstrate', 'Show'], 'Recent mock examinations indicate a substantial upward trend in test scores.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Interpretation', 'Noun', 'ব্যাখ্যা বা অনুবাদ', ARRAY['Explanation', 'Analysis', 'Reading'], 'A literal interpretation of idioms often leads to miscomprehension in IELTS.', 'Academic Word List: Sublist A', 'active', 'admin'),
('Methodology', 'Noun', 'গবেষণা পদ্ধতি', ARRAY['Framework', 'Technique', 'Procedure'], 'The team outlined their qualitative methodology in the preamble of the thesis.', 'Academic Word List: Sublist A', 'active', 'admin'),

-- Listening Vocabs: Studying university/college
('Tuition', 'Noun', 'শিক্ষাদানের ফি', ARRAY['Instruction fees', 'Schooling fee'], 'International university tuition has risen sharply across OECD countries.', 'Studying university/college', 'listening', 'admin'),
('Curriculum', 'Noun', 'পাঠ্যক্রম', ARRAY['Syllabus', 'Program of study'], 'The new undergraduate curriculum emphasizes computational linguistics and logic.', 'Studying university/college', 'listening', 'admin'),
('Auditorium', 'Noun', 'মিলনায়তন বা হলরুম', ARRAY['Concert hall', 'Lecture hall'], 'The orientation address will commence at nine o’clock in the main campus auditorium.', 'Studying university/college', 'listening', 'admin'),
('Dissertation', 'Noun', 'গবেষণামূলক প্রবন্ধ', ARRAY['Thesis', 'Treatise', 'Monograph'], 'Final-year master candidates must submit an empirical dissertation before graduation.', 'Studying university/college', 'listening', 'admin'),
('Prerequisite', 'Noun', 'আবশ্যিক পূর্বশর্ত', ARRAY['Requirement', 'Precondition'], 'Introductory Statistics is a strict prerequisite for registering for Machine Learning.', 'Studying university/college', 'listening', 'admin'),
('Faculty', 'Noun', 'বিভাগ বা শিক্ষকবৃন্দ', ARRAY['Academic staff', 'Department'], 'Members of the Humanities faculty published five new academic monographs this semester.', 'Studying university/college', 'listening', 'admin'),
('Semester', 'Noun', 'শিক্ষাবর্ষের অর্ধাংশ', ARRAY['Academic term', 'Trimester'], 'Registration for the autumn semester opens on the first Monday of August.', 'Studying university/college', 'listening', 'admin'),

-- Listening Vocabs: Subjects
('Anthropology', 'Noun', 'নৃতত্ত্ব', ARRAY['Human science', 'Ethnology'], 'Social anthropology investigates cultural variation across diverse human societies.', 'Subjects', 'listening', 'admin'),
('Philosophy', 'Noun', 'দর্শনশাস্ত্র', ARRAY['Theoretical reasoning', 'Epistemology'], 'Moral philosophy explores the conceptual boundaries of ethical responsibility.', 'Subjects', 'listening', 'admin'),
('Economics', 'Noun', 'অর্থনীতি', ARRAY['Financial science', 'Political economy'], 'Macroeconomics analyzes monetary policy, inflation rates, and systemic growth.', 'Subjects', 'listening', 'admin'),
('Archaeology', 'Noun', 'প্রত্নতত্ত্ব', ARRAY['Antiquarian study', 'Paleontology'], 'Recent underwater archaeology unveiled Neolithic pottery along the Mediterranean shelf.', 'Subjects', 'listening', 'admin'),
('Psychology', 'Noun', 'মনোবিজ্ঞান', ARRAY['Behavioral science', 'Cognitive study'], 'Cognitive psychology elucidates how working memory facilitates second-language acquisition.', 'Subjects', 'listening', 'admin')
) AS seed(word, pos, bangla_meaning, synonyms, example_usage, topic, target_tab, uploaded_by_name)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.vocabularies existing
  WHERE existing.word = seed.word
    AND existing.topic = seed.topic
    AND existing.target_tab = seed.target_tab
);

-- Grammar Questions
INSERT INTO public.grammar_questions (module, question, options, answer, explanation)
SELECT seed.module, seed.question, seed.options, seed.answer, seed.explanation
FROM (VALUES
('subject-verb-agreement', 'Neither the professor nor the students ____ able to solve the equation.', '["was", "were", "is", "are"]'::jsonb, 'were', 'When subjects are joined by "neither... nor", the verb agrees with the closer subject ("students" -> plural verb "were").'),
('subject-verb-agreement', 'A bouquet of yellow roses ____ color and fragrance to the study room.', '["lend", "lends", "are lending", "have lent"]'::jsonb, 'lends', 'The true subject is the singular noun "bouquet", so it takes the singular verb "lends".'),
('modifiers-dangling', 'Walking through the misty park at dawn, ____.', '["the ancient oak trees seemed enchanted", "the morning sun warmed our faces", "we observed a rare species of heron", "a cold wind chilled everyone"]'::jsonb, 'we observed a rare species of heron', 'The participial modifier "Walking through the misty park" must modify the subject performing the action ("we").'),
('run-on-comma-splices', 'The experiment yielded unexpected results, ____ the research team decided to repeat the procedure.', '["however", "therefore", "so", "consequently"]'::jsonb, 'so', '"So" is a coordinating conjunction (FANBOYS) that can properly join two independent clauses with a comma.')
) AS seed(module, question, options, answer, explanation)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.grammar_questions existing
  WHERE existing.module = seed.module
    AND existing.question = seed.question
);
