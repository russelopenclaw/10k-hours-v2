-- Migration 013: Add consent_status to profiles for COPPA compliance
-- Part of T-158a: Age gate on signup
--
-- consent_status tracks whether a user under 13 has verified parent consent.
-- Values: 'not_required' (13+), 'pending' (under 13, awaiting parent verification),
--         'verified' (parent approved), 'denied' (parent denied)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent_status text DEFAULT 'not_required' NOT NULL
  CHECK (consent_status IN ('not_required', 'pending', 'verified', 'denied'));

-- Store parent email for verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_email text;

-- Index for querying users pending consent verification
CREATE INDEX IF NOT EXISTS idx_profiles_consent_status ON profiles(consent_status) WHERE consent_status != 'not_required';

-- Ensure parent_email is set when consent_status is pending
-- (Application-level check, not a hard DB constraint since email might be set after status change)

COMMENT ON COLUMN profiles.consent_status IS 'COPPA consent status: not_required (13+), pending (under 13, awaiting parent), verified (parent approved), denied (parent denied)';
COMMENT ON COLUMN profiles.parent_email IS 'Parent/guardian email for COPPA verification when user is under 13';