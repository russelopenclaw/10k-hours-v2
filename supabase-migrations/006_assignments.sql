-- Assignments table
-- Teachers can assign pieces (songs) with tempo and goal notes to students
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  tempo INTEGER,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

-- RLS policies
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can see assignments they created
CREATE POLICY "Teachers can view their assignments"
  ON assignments FOR SELECT
  USING (teacher_id = auth.uid());

-- Students can see assignments assigned to them
CREATE POLICY "Students can view their assignments"
  ON assignments FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can create assignments
CREATE POLICY "Teachers can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- Teachers can update their assignments
CREATE POLICY "Teachers can update their assignments"
  ON assignments FOR UPDATE
  USING (teacher_id = auth.uid());

-- Students can update status of their assignments (to mark in_progress or completed)
CREATE POLICY "Students can update assignment status"
  ON assignments FOR UPDATE
  USING (student_id = auth.uid() AND status IN ('assigned', 'in_progress'))
  WITH CHECK (student_id = auth.uid());

-- Teachers can delete their assignments
CREATE POLICY "Teachers can delete their assignments"
  ON assignments FOR DELETE
  USING (teacher_id = auth.uid());