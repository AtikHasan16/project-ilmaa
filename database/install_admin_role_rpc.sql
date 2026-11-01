-- =========================================================================
-- SPELLYCRAFT PLATFORM: INSTALL ADMIN ROLE UPDATE RPC
-- =========================================================================
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- This installs the atomic `admin_update_profile_role` function and grants
-- execute permissions to authenticated users.
-- =========================================================================

BEGIN;

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
  -- 1. Security Check: Only administrators may change roles
  IF v_actor_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators may change user roles'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Validate input parameters
  IF p_target_user_id IS NULL
    OR p_role IS NULL
    OR p_role NOT IN ('general', 'admin') THEN
    RAISE EXCEPTION 'A target user ID and a valid role (general or admin) are required'
      USING ERRCODE = '22023';
  END IF;

  -- 3. Fetch administrator actor name for audit trail
  SELECT COALESCE(name, email, 'Administrator')
  INTO v_actor_name
  FROM public.profiles
  WHERE id = v_actor_id;

  -- 4. Atomic role update
  UPDATE public.profiles
  SET role = p_role
  WHERE id = p_target_user_id
  RETURNING * INTO v_updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The target candidate profile does not exist'
      USING ERRCODE = 'P0002';
  END IF;

  -- 5. Record security audit log entry
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
    -- Audit log write failure should not roll back the profile update
    RAISE WARNING 'Failed to record audit log: %', SQLERRM;
  END;

  -- 6. Return updated profile
  RETURN JSONB_BUILD_OBJECT(
    'id', v_updated_profile.id,
    'name', v_updated_profile.name,
    'email', v_updated_profile.email,
    'role', v_updated_profile.role
  );
END;
$$;

-- Explicitly revoke from anon and grant to authenticated users
REVOKE ALL ON FUNCTION public.admin_update_profile_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_role(UUID, TEXT) TO authenticated;

-- Force schema cache reload in PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;
