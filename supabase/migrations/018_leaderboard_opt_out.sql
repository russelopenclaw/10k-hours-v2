-- Migration 018: Add leaderboard_visibility to profiles
-- Students can opt out of the public leaderboard (other students can't see their points)
-- Teachers always see all student data regardless of this flag
-- Default is true (opted in) so existing students stay visible

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS leaderboard_visibility boolean DEFAULT true NOT NULL;

-- Index for efficient filtering in leaderboard RPCs
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard_visibility ON profiles(leaderboard_visibility) WHERE leaderboard_visibility = true;

COMMENT ON COLUMN profiles.leaderboard_visibility IS 'Whether the student appears on the leaderboard visible to other students. Teachers always see all students regardless of this flag. Default true (opted in).';