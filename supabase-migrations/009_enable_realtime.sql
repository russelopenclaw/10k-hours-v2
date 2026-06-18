-- Enable Supabase Realtime on assignments and teacher_shares tables
-- This allows client-side subscriptions to INSERT/UPDATE/DELETE events
-- for live notifications (new assignments, share claims, status changes)

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE teacher_shares;

-- Also enable on teacher_students for roster updates
ALTER PUBLICATION supabase_realtime ADD TABLE teacher_students;

-- Enable RLS checks on realtime messages (security: only send events
-- the authenticated user could see via SELECT policies)
-- This is already the default in Supabase, but we make it explicit:
ALTER TABLE assignments REPLICA IDENTITY DEFAULT;
ALTER TABLE teacher_shares REPLICA IDENTITY DEFAULT;
ALTER TABLE teacher_students REPLICA IDENTITY DEFAULT;