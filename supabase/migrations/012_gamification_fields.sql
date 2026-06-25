-- Migration 012: Add gamification fields to profiles
-- Adds total_coins (coin balance) and display_name (for leaderboard/teacher control)
-- Part of Cadent Gamification epic (T-151)

-- Coin balance: tracks total coins earned from practice
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_coins integer DEFAULT 0 NOT NULL;

-- Display name: teacher-controlled name for leaderboard visibility
-- Falls back to full_name or email prefix in app logic
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;

-- Index for leaderboard queries (students ordered by coins within a teacher's studio)
CREATE INDEX IF NOT EXISTS idx_profiles_total_coins ON profiles(total_coins DESC);

-- Index for display name lookups
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name) WHERE display_name IS NOT NULL;

-- Add coins_earned column to practice_sessions for per-session coin tracking
-- This lets us recalculate total_coins from sessions if needed
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS coins_earned integer DEFAULT 0 NOT NULL;

-- Add streak_multiplier to practice_sessions for recording what multiplier was applied
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS streak_multiplier numeric(3,1) DEFAULT 1.0 NOT NULL;

-- Function to recalculate total_coins from practice_sessions (for data integrity)
CREATE OR REPLACE FUNCTION recalculate_total_coins(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET total_coins = COALESCE(
    (SELECT SUM(coins_earned) FROM practice_sessions WHERE user_id = p_user_id),
    0
  )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for display_name: students can update their own, teachers can update their students'
-- (Existing RLS policies on profiles handle the base access)

COMMENT ON COLUMN profiles.total_coins IS 'Total coins earned from practice. 1 coin per minute practiced, multiplied by streak multiplier.';
COMMENT ON COLUMN profiles.display_name IS 'Teacher-controlled display name for leaderboard. NULL means use full_name or email prefix.';
COMMENT ON COLUMN practice_sessions.coins_earned IS 'Coins earned for this practice session (duration_minutes * streak_multiplier), rounded down.';
COMMENT ON COLUMN practice_sessions.streak_multiplier IS 'Streak multiplier applied when session was saved (1.0 for no streak).';