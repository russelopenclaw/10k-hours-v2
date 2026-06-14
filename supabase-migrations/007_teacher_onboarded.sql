-- Add teacher_onboarded flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS teacher_onboarded boolean DEFAULT false;

-- Backfill existing teachers
UPDATE profiles SET teacher_onboarded = true WHERE user_type = 'teacher' AND onboarding_complete = true;