-- =========================================================================
-- SPELLYCRAFT: RESTRICT SIGNUPS STRICTLY TO GMAIL (@gmail.com)
-- =========================================================================
-- Prevents temporary mail and spam registrations to protect platform quota.
-- =========================================================================

-- Create or replace the trigger function to restrict signups strictly to Gmail
CREATE OR REPLACE FUNCTION public.enforce_gmail_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_domain TEXT;
BEGIN
    -- Extract the domain part of the email in lowercase
    v_domain := LOWER(SPLIT_PART(NEW.email, '@', 2));

    -- Strictly reject any domain that is NOT gmail.com
    IF v_domain != 'gmail.com' THEN
        RAISE EXCEPTION 'Only official Google Mail accounts (@gmail.com) are permitted to register on SpellyCraft.';
    END IF;

    RETURN NEW;
END;
$$;

-- Attach the trigger to auth.users before any new user is inserted
DROP TRIGGER IF EXISTS trigger_enforce_gmail_only ON auth.users;

CREATE TRIGGER trigger_enforce_gmail_only
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_gmail_only();
