-- Allow teachers to view profiles of students on their roster
CREATE POLICY "Teachers can view rostered students' profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT student_id FROM teacher_students
      WHERE teacher_id = auth.uid()
    )
  );

-- Allow teachers to view songs of students on their roster
CREATE POLICY "Teachers can view rostered students' songs"
  ON songs FOR SELECT
  USING (
    user_id IN (
      SELECT student_id FROM teacher_students
      WHERE teacher_id = auth.uid()
    )
  );

-- Allow teachers to view practice sessions of students on their roster
CREATE POLICY "Teachers can view rostered students' sessions"
  ON practice_sessions FOR SELECT
  USING (
    user_id IN (
      SELECT student_id FROM teacher_students
      WHERE teacher_id = auth.uid()
    )
  );

-- Allow teachers to view assignments they created or that are for their students
CREATE POLICY "Teachers can view their assignments"
  ON assignments FOR SELECT
  USING (
    teacher_id = auth.uid()
  );

-- Allow teachers to create assignments for their students
CREATE POLICY "Teachers can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    AND student_id IN (
      SELECT student_id FROM teacher_students
      WHERE teacher_id = auth.uid()
    )
  );

-- Allow teachers to update their assignments
CREATE POLICY "Teachers can update their assignments"
  ON assignments FOR UPDATE
  USING (teacher_id = auth.uid());

-- Allow students to view assignments assigned to them
CREATE POLICY "Students can view their assignments"
  ON assignments FOR SELECT
  USING (student_id = auth.uid());