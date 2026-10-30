-- Migration: Phase 2.5 - Topic Counts RPC & View for Fast Aggregations
-- Replaces full table client-side scans of vocabularies with pre-grouped database aggregations.

BEGIN;

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

COMMIT;
