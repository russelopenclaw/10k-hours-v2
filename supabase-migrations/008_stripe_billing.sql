-- Add Stripe billing fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- subscription_status already exists as enum 'free' | 'premium'
-- but ensure the default is 'free'
ALTER TABLE profiles ALTER COLUMN subscription_status SET DEFAULT 'free';
ALTER TABLE profiles ALTER COLUMN subscription_status SET NOT NULL;

-- Backfill existing profiles to 'free' if null
UPDATE profiles SET subscription_status = 'free' WHERE subscription_status IS NULL;

-- Create index for webhook lookups by stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);