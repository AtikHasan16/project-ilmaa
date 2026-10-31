-- =========================================================================
-- IMLAA PLATFORM: FULL CLEAN DATABASE REBUILD SCRIPT
-- =========================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/evjvqrxrevycnjxsnjdt
-- 2. Navigate to "SQL Editor" on the left menu.
-- 3. Click "New query", paste this entire script, and click "Run".
-- This script safely drops existing tables and establishes the canonical schema,
-- RPC aggregation functions, gamification badges table, and initial seed data.
-- =========================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 0. CLEANUP EXISTING TABLES & FUNCTIONS
-- -------------------------------------------------------------------------
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.user_activity_logs CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.grammar_progress CASCADE;
DROP TABLE IF EXISTS public.grammar_questions CASCADE;
DROP TABLE IF EXISTS public.flashcard_progress CASCADE;
DROP TABLE IF EXISTS public.spelling_progress CASCADE;
DROP TABLE IF EXISTS public.vocabularies CASCADE;
DROP TABLE IF EXISTS public.vocabulary_progress CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.get_vocabulary_topic_counts() CASCADE;
DROP FUNCTION IF EXISTS public.submit_vocabulary_items(jsonb, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_active_user_count() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_profile_role_escalation() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- -------------------------------------------------------------------------
-- 1. PROFILES (Tied to Supabase Auth.users)
-- -------------------------------------------------------------------------
CREATE TABLE public.profiles (
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

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_last_active_at ON public.profiles(last_active_at);

-- -------------------------------------------------------------------------
-- 2. VOCABULARIES (Normalized: target_tab, uploaded_by_id, uploaded_by_name)
-- -------------------------------------------------------------------------
CREATE TABLE public.vocabularies (
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

CREATE INDEX idx_vocabularies_topic ON public.vocabularies(topic);
CREATE INDEX idx_vocabularies_target_tab ON public.vocabularies(target_tab);
CREATE INDEX idx_vocabularies_uploaded_by_id ON public.vocabularies(uploaded_by_id);
CREATE INDEX idx_vocabularies_created_at ON public.vocabularies(created_at);
CREATE UNIQUE INDEX idx_vocabularies_word_topic ON public.vocabularies(word, topic);

-- -------------------------------------------------------------------------
-- 3. SPELLING PROGRESS (Dedicated Topic Tracking)
-- -------------------------------------------------------------------------
CREATE TABLE public.spelling_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mastered_words TEXT[] DEFAULT '{}',
  incorrect_words TEXT[] DEFAULT '{}',
  last_index INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

CREATE INDEX idx_spelling_progress_user ON public.spelling_progress(user_id);

-- -------------------------------------------------------------------------
-- 4. FLASHCARD PROGRESS (Known, Unknown, Forgot Tracking)
-- -------------------------------------------------------------------------
CREATE TABLE public.flashcard_progress (
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

CREATE INDEX idx_flashcard_progress_user ON public.flashcard_progress(user_id);

-- -------------------------------------------------------------------------
-- 5. GRAMMAR QUESTIONS & PROGRESS
-- -------------------------------------------------------------------------
CREATE TABLE public.grammar_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grammar_questions_module ON public.grammar_questions(module);

CREATE TABLE public.grammar_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  highest_score INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  completed_modules JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- -------------------------------------------------------------------------
-- 6. USER BADGES & MILESTONES (Phase 3.5)
-- -------------------------------------------------------------------------
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_key)
);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

-- -------------------------------------------------------------------------
-- 7. AUDIT LOGS & USER ACTIVITY LOGS
-- -------------------------------------------------------------------------
CREATE TABLE public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  duration_seconds INT DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_time ON public.user_activity_logs(timestamp DESC);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_time ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_target_user ON public.audit_logs(target_user_id);

-- -------------------------------------------------------------------------
-- 8. CORE RPC FUNCTIONS & TRIGGERS
-- -------------------------------------------------------------------------

-- A. Fast Topic Aggregations (Replaces expensive table scans)
CREATE OR REPLACE FUNCTION public.get_vocabulary_topic_counts()
RETURNS TABLE (
  topic TEXT,
  target_tab TEXT,
  count BIGINT,
  uploaded_by_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    v.topic,
    v.target_tab,
    COUNT(*)::BIGINT AS count,
    MAX(v.uploaded_by_name) AS uploaded_by_name
  FROM public.vocabularies AS v
  GROUP BY v.topic, v.target_tab;
$$;

REVOKE ALL ON FUNCTION public.get_vocabulary_topic_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_vocabulary_topic_counts() TO authenticated, anon;

-- B. Is Admin Check Helper
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

-- C. Active Users Counter
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

-- D. Prevent Non-Admin Role Escalation
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

-- E. Auto-Sync auth.users into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT := 'general';
BEGIN
  -- Automatically grant admin rights to project administrator
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
    name = COALESCE(NULLIF(public.profiles.name, ''), EXCLUDED.name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    last_active_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- F. Populate existing users from auth.users into public.profiles
INSERT INTO public.profiles (id, name, email, role, created_at, last_active_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  CASE WHEN LOWER(u.email) = 'akhasannaeem@gmail.com' THEN 'admin' ELSE 'general' END,
  COALESCE(u.created_at, NOW()),
  NOW()
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spelling_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users read themselves + admin reads all; user updates own non-role fields
CREATE POLICY "Profiles read policy"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Profiles update policy"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

-- Vocabularies: Everyone can read curriculum; only owner or admin can see uploaded sets
CREATE POLICY "Vocabularies select policy"
  ON public.vocabularies FOR SELECT TO anon, authenticated
  USING (
    public.is_admin()
    OR target_tab IS DISTINCT FROM 'uploaded'
    OR uploaded_by_id = (SELECT auth.uid())
  );

CREATE POLICY "Vocabularies insert policy"
  ON public.vocabularies FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (target_tab = 'uploaded' AND uploaded_by_id = (SELECT auth.uid()))
  );

CREATE POLICY "Vocabularies delete policy"
  ON public.vocabularies FOR DELETE TO authenticated
  USING (public.is_admin() OR uploaded_by_id = (SELECT auth.uid()));

-- Progress Tables: User-scoped progress
CREATE POLICY "Spelling progress policy"
  ON public.spelling_progress FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Flashcard progress policy"
  ON public.flashcard_progress FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Grammar progress policy"
  ON public.grammar_progress FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Grammar questions select policy"
  ON public.grammar_questions FOR SELECT TO anon, authenticated
  USING (true);

-- User Badges: User reads own badges; inserts own unlocked badges
CREATE POLICY "User badges select policy"
  ON public.user_badges FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "User badges insert policy"
  ON public.user_badges FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Audit Logs: Admin reads; authenticated appends
CREATE POLICY "Audit logs select policy"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Audit logs insert policy"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "User activity logs policy"
  ON public.user_activity_logs FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.vocabularies TO authenticated;
GRANT SELECT ON public.vocabularies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spelling_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grammar_progress TO authenticated;
GRANT SELECT ON public.grammar_questions TO anon, authenticated;
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT ON public.user_activity_logs TO authenticated;

-- -------------------------------------------------------------------------
-- 10. INITIAL SEED DATASET (ACADEMIC + LISTENING + GRAMMAR)
-- -------------------------------------------------------------------------
INSERT INTO public.vocabularies (word, pos, bangla_meaning, synonyms, example_usage, topic, target_tab, uploaded_by_name)
VALUES
('Analysis', 'Noun', 'বিশ্লেষণ', ARRAY['Examination', 'Investigation', 'Scrutiny'], 'A rigorous statistical analysis revealed significant positive outcomes.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Approach', 'Noun', 'পদ্ধতি বা দৃষ্টিভঙ্গি', ARRAY['Method', 'Strategy', 'Perspective'], 'The university adopted a novel multidisciplinary approach to environmental science.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Beneficial', 'Adjective', 'উপকারী বা কল্যাণকর', ARRAY['Advantageous', 'Favorable', 'Helpful'], 'Regular auditory recall practice is highly beneficial for IELTS spelling precision.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Concept', 'Noun', 'ধারণা', ARRAY['Idea', 'Notion', 'Theory'], 'The core concept behind orthographic retrieval is muscle memory without visual cues.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Consistent', 'Adjective', 'ধারাবাহিক বা সঙ্গতিপূর্ণ', ARRAY['Steady', 'Constant', 'Uniform'], 'Consistent daily dictation produces the highest retention rates.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Context', 'Noun', 'প্রসঙ্গ বা পটভূমি', ARRAY['Framework', 'Circumstance', 'Setting'], 'Hearing new lexical terms in academic context reinforces cognitive assimilation.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Criteria', 'Noun', 'মানদণ্ড', ARRAY['Standard', 'Benchmark', 'Measure'], 'Lexical resource is one of the four principal assessment criteria in IELTS writing.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Data', 'Noun', 'উপাত্ত বা তথ্য', ARRAY['Evidence', 'Information', 'Statistics'], 'Empirical data indicates that candidates struggle most with double consonants.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Distinct', 'Adjective', 'স্বতন্ত্র বা সুস্পষ্ট', ARRAY['Separate', 'Discrete', 'Noticeable'], 'British and American English feature distinct phonemic patterns for vowel reduction.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Evidence', 'Noun', 'প্রমাণ বা সাক্ষ্য', ARRAY['Proof', 'Corroboration', 'Confirmation'], 'The research paper cited extensive historical evidence to support the claim.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Factor', 'Noun', 'উপাদান বা নিয়ামক', ARRAY['Element', 'Component', 'Determinant'], 'Stress management is a critical factor during the IELTS listening module.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Identify', 'Verb', 'শনাক্ত করা', ARRAY['Recognize', 'Distinguish', 'Pinpoint'], 'Candidates must rapidly identify distractors in multiple-choice questions.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Indicate', 'Verb', 'নির্দেশ করা বা ইঙ্গিত দেওয়া', ARRAY['Signify', 'Demonstrate', 'Show'], 'Recent mock examinations indicate a substantial upward trend in test scores.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Interpretation', 'Noun', 'ব্যাখ্যা বা অনুবাদ', ARRAY['Explanation', 'Analysis', 'Reading'], 'A literal interpretation of idioms often leads to miscomprehension in IELTS.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Methodology', 'Noun', 'গবেষণা পদ্ধতি', ARRAY['Framework', 'Technique', 'Procedure'], 'The team outlined their qualitative methodology in the preamble of the thesis.', 'Academic Word List: Sublist A', 'active', 'Admin'),
('Tuition', 'Noun', 'শিক্ষাদানের ফি', ARRAY['Instruction fees', 'Schooling fee'], 'International university tuition has risen sharply across OECD countries.', 'Studying university/college', 'listening', 'Admin'),
('Curriculum', 'Noun', 'পাঠ্যক্রম', ARRAY['Syllabus', 'Program of study'], 'The new undergraduate curriculum emphasizes computational linguistics and logic.', 'Studying university/college', 'listening', 'Admin'),
('Auditorium', 'Noun', 'মিলনায়তন বা হলরুম', ARRAY['Concert hall', 'Lecture hall'], 'The orientation address will commence at nine o’clock in the main campus auditorium.', 'Studying university/college', 'listening', 'Admin'),
('Dissertation', 'Noun', 'গবেষণামূলক প্রবন্ধ', ARRAY['Thesis', 'Treatise', 'Monograph'], 'Final-year master candidates must submit an empirical dissertation before graduation.', 'Studying university/college', 'listening', 'Admin'),
('Prerequisite', 'Noun', 'আবশ্যিক পূর্বশর্ত', ARRAY['Requirement', 'Precondition'], 'Introductory Statistics is a strict prerequisite for registering for Machine Learning.', 'Studying university/college', 'listening', 'Admin'),
('Faculty', 'Noun', 'বিভাগ বা শিক্ষকবৃন্দ', ARRAY['Academic staff', 'Department'], 'Members of the Humanities faculty published five new academic monographs this semester.', 'Studying university/college', 'listening', 'Admin'),
('Semester', 'Noun', 'শিক্ষাবর্ষের অর্ধাংশ', ARRAY['Academic term', 'Trimester'], 'Registration for the autumn semester opens on the first Monday of August.', 'Studying university/college', 'listening', 'Admin'),
('Anthropology', 'Noun', 'নৃতত্ত্ব', ARRAY['Human science', 'Ethnology'], 'Social anthropology investigates cultural variation across diverse human societies.', 'Subjects', 'listening', 'Admin'),
('Philosophy', 'Noun', 'দর্শনশাস্ত্র', ARRAY['Theoretical reasoning', 'Epistemology'], 'Moral philosophy explores the conceptual boundaries of ethical responsibility.', 'Subjects', 'listening', 'Admin'),
('Economics', 'Noun', 'অর্থনীতি', ARRAY['Financial science', 'Political economy'], 'Macroeconomics analyzes monetary policy, inflation rates, and systemic growth.', 'Subjects', 'listening', 'Admin'),
('Archaeology', 'Noun', 'প্রত্নতত্ত্ব', ARRAY['Antiquarian study', 'Paleontology'], 'Recent underwater archaeology unveiled Neolithic pottery along the Mediterranean shelf.', 'Subjects', 'listening', 'Admin'),
('Psychology', 'Noun', 'মনোবিজ্ঞান', ARRAY['Behavioral science', 'Cognitive study'], 'Cognitive psychology elucidates how working memory facilitates second-language acquisition.', 'Subjects', 'listening', 'Admin');

INSERT INTO public.grammar_questions (module, question, options, answer, explanation)
VALUES
('subject-verb-agreement', 'Neither the professor nor the students ____ able to solve the equation.', '["was", "were", "is", "are"]'::jsonb, 'were', 'When subjects are joined by "neither... nor", the verb agrees with the closer subject ("students" -> plural verb "were").'),
('subject-verb-agreement', 'A bouquet of yellow roses ____ color and fragrance to the study room.', '["lend", "lends", "are lending", "have lent"]'::jsonb, 'lends', 'The true subject is the singular noun "bouquet", so it takes the singular verb "lends".'),
('modifiers-dangling', 'Walking through the misty park at dawn, ____.', '["the ancient oak trees seemed enchanted", "the morning sun warmed our faces", "we observed a rare species of heron", "a cold wind chilled everyone"]'::jsonb, 'we observed a rare species of heron', 'The participial modifier "Walking through the misty park" must modify the subject performing the action ("we").'),
('run-on-comma-splices', 'The experiment yielded unexpected results, ____ the research team decided to repeat the procedure.', '["however", "therefore", "so", "consequently"]'::jsonb, 'so', '"So" is a coordinating conjunction (FANBOYS) that can properly join two independent clauses with a comma.');

COMMIT;
