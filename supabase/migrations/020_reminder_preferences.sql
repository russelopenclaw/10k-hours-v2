-- Migration 020: Practice reminder preferences
-- Students can opt in to daily practice reminders at a configurable time

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_time TIME DEFAULT '19:00:00'::TIME,
  ADD COLUMN IF NOT EXISTS push_subscription JSONB;

COMMENT ON COLUMN profiles.reminder_enabled IS 'Whether the student has enabled daily practice reminders';
COMMENT ON COLUMN profiles.reminder_time IS 'The local time to send the reminder (default 7pm)';
COMMENT ON COLUMN profiles.push_subscription IS 'PushNotification subscription object for web push';