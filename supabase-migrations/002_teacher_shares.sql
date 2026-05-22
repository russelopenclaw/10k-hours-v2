-- Teacher shares table: allows students to generate share links for teachers
CREATE TABLE IF NOT EXISTS teacher_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  teacher_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_teacher_shares_student_id ON teacher_shares(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_shares_token ON teacher_shares(token);

-- RLS policies for teacher_shares
ALTER TABLE teacher_shares ENABLE ROW LEVEL SECURITY;

-- Students can manage their own share links
CREATE POLICY "Students can view own shares" ON teacher_shares FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create own shares" ON teacher_shares FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own shares" ON teacher_shares FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students can delete own shares" ON teacher_shares FOR DELETE USING (auth.uid() = student_id);

-- Allow anonymous access to read active shares by token (for teacher view)
CREATE POLICY "Anyone can view active shares by token" ON teacher_shares FOR SELECT USING (is_active = true AND token::text = current_setting('request.jwt.claims', true)::json->>'teacher_share_token');

-- Function to check if a share token is valid and get the student ID
CREATE OR REPLACE FUNCTION public.get_student_id_by_share_token(share_token UUID)
RETURNS UUID AS $$
DECLARE
  student_id UUID;
BEGIN
  SELECT ts.student_id INTO student_id
  FROM public.teacher_shares ts
  WHERE ts.token = share_token AND ts.is_active = true;

  RETURN student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get practice data for a shared student (called by teacher view)
CREATE OR REPLACE FUNCTION public.get_student_practice_data(share_token UUID)
RETURNS JSON AS $$
DECLARE
  student_id UUID;
  result JSON;
BEGIN
  -- Get the student ID from the share token
  SELECT ts.student_id INTO student_id
  FROM public.teacher_shares ts
  WHERE ts.token = share_token AND ts.is_active = true;

  IF student_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return combined data
  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = student_id),
    'songs', (SELECT coalesce(json_agg(row_to_json(s)), '[]') FROM public.songs s WHERE s.user_id = student_id),
    'sessions', (SELECT coalesce(json_agg(row_to_json(ps)), '[]') FROM public.practice_sessions ps WHERE ps.user_id = student_id)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;