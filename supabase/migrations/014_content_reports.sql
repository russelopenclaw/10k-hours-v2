-- Migration 014: Create content_reports table for UGC moderation
-- Part of T-159b: Reports table and API endpoint
--
-- Allows users to report assignments, attachments, or any user-generated content.
-- Required for Section 230 protection and child safety.

CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('assignment', 'attachment', 'display_name', 'profile', 'other')),
  content_id text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('inappropriate', 'offensive', 'spam', 'harassment', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Index for finding pending reports (admin review)
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status) WHERE status = 'pending';

-- Index for finding all reports on a specific piece of content
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);

-- RLS policies
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert reports (report content)
CREATE POLICY "Users can report content" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON content_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Only service role can update reports (admin review)
CREATE POLICY "Service role can manage reports" ON content_reports
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE content_reports IS 'User-generated content reports for moderation and child safety. Required for Section 230 protection.';
COMMENT ON COLUMN content_reports.content_type IS 'Type of content being reported: assignment, attachment, display_name, profile, or other';
COMMENT ON COLUMN content_reports.content_id IS 'ID of the content being reported (references the relevant table)';
COMMENT ON COLUMN content_reports.status IS 'Report status: pending (new), reviewed (seen by admin), resolved (action taken), dismissed (no action needed)';