-- Teacher student roster table
-- Tracks which students a teacher has added to their dashboard
CREATE TABLE IF NOT EXISTS teacher_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, student_id)
);

-- Index for fast teacher lookups
CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher ON teacher_students(teacher_id);

-- RLS policies
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;

-- Teachers can see their own roster
CREATE POLICY "Teachers can view their own students"
  ON teacher_students FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can add students to their roster
CREATE POLICY "Teachers can add students"
  ON teacher_students FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- Teachers can remove students from their roster
CREATE POLICY "Teachers can remove students"
  ON teacher_students FOR DELETE
  USING (teacher_id = auth.uid());