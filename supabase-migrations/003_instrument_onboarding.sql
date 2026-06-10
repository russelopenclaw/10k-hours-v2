-- Add instrument and onboarding_complete columns to profiles
-- These may already exist if added via dashboard; use IF NOT EXISTS for idempotency

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instrument TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- Set onboarding_complete = true for any existing users who already have songs
-- (they completed onboarding before this column existed)
UPDATE profiles
SET onboarding_complete = true
WHERE id IN (
  SELECT DISTINCT user_id FROM songs
);

-- Add comment for documentation
COMMENT ON COLUMN profiles.instrument IS 'Primary instrument selected during onboarding';
COMMENT ON COLUMN profiles.onboarding_complete IS 'Whether the user has completed the onboarding flow';