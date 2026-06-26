-- Migration 017: Parent consent verification
-- Part of T-158b: Parent verification flow (no email required)
--
-- Adds consent_token and consent_requested_at to profiles.
-- When a student under 13 provides a parent email, we generate a token.
-- The student shares the consent URL with their parent.
-- The parent visits the URL and confirms/denies consent.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_token UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_requested_at TIMESTAMPTZ;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_consent_token ON profiles(consent_token) WHERE consent_token IS NOT NULL;

-- Function to generate and store a consent token
CREATE OR REPLACE FUNCTION generate_consent_token(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_token UUID;
BEGIN
  v_token := gen_random_uuid();
  UPDATE profiles
  SET consent_token = v_token,
      consent_requested_at = NOW()
  WHERE id = p_user_id;
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify consent via token
CREATE OR REPLACE FUNCTION verify_parent_consent(p_token UUID, p_approved BOOLEAN)
RETURNS TABLE (success BOOLEAN, display_name TEXT) AS $$
DECLARE
  v_user_id UUID;
  v_display_name TEXT;
BEGIN
  -- Find the user with this consent token
  SELECT id, COALESCE(display_name, full_name, 'Student') INTO v_user_id, v_display_name
  FROM profiles
  WHERE consent_token = p_token;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, ''::TEXT;
    RETURN;
  END IF;

  -- Update consent status
  UPDATE profiles
  SET consent_status = CASE WHEN p_approved THEN 'approved' ELSE 'denied' END,
      consent_token = NULL  -- One-time use
  WHERE id = v_user_id;

  RETURN QUERY SELECT TRUE::BOOLEAN, v_display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;