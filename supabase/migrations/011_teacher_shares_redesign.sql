-- Migration 011: Redesign teacher_shares — short codes, 24h expiry, claimed state

-- Add new columns
ALTER TABLE teacher_shares ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE;
ALTER TABLE teacher_shares ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours');
ALTER TABLE teacher_shares ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE teacher_shares ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop teacher_name column (we'll use the claiming teacher's profile.full_name instead)
ALTER TABLE teacher_shares DROP COLUMN IF EXISTS teacher_name;

-- Index on short_code for lookups
CREATE INDEX IF NOT EXISTS idx_teacher_shares_short_code ON teacher_shares(short_code);

-- Allow students to view shares claimed by teachers (so they can see who claimed)
-- This already works via the existing "Students can view own shares" policy

-- Allow teachers to view shares they've claimed
CREATE POLICY "Teachers can view shares they claimed"
  ON teacher_shares FOR SELECT
  USING (claimed_by = auth.uid());

-- Update the get_student_practice_data function to also check expiry
CREATE OR REPLACE FUNCTION public.get_student_practice_data(share_token UUID)
RETURNS JSON AS $$
DECLARE
  v_student_id UUID;
  v_result JSON;
BEGIN
  -- Look up by token, check it's active and not expired and not claimed
  SELECT ts.student_id INTO v_student_id
  FROM public.teacher_shares ts
  WHERE ts.token = share_token
    AND ts.is_active = true
    AND ts.expires_at > NOW()
    AND ts.claimed_at IS NULL;

  IF v_student_id IS NULL THEN
    -- Also check: active share that was claimed (teacher viewing via direct roster link)
    SELECT ts.student_id INTO v_student_id
    FROM public.teacher_shares ts
    WHERE ts.token = share_token
      AND ts.is_active = true;
  END IF;

  IF v_student_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = v_student_id),
    'songs', (SELECT coalesce(json_agg(row_to_json(s)), '[]') FROM public.songs s WHERE s.user_id = v_student_id),
    'sessions', (SELECT coalesce(json_agg(row_to_json(ps)), '[]') FROM public.practice_sessions ps WHERE ps.user_id = v_student_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_student_id_by_share_token to check expiry
CREATE OR REPLACE FUNCTION public.get_student_id_by_share_token(share_token UUID)
RETURNS UUID AS $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT ts.student_id INTO v_student_id
  FROM public.teacher_shares ts
  WHERE ts.token = share_token
    AND ts.is_active = true
    AND ts.expires_at > NOW()
    AND ts.claimed_at IS NULL;

  RETURN v_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;