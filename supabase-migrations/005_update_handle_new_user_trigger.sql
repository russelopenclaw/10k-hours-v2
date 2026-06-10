-- Update the handle_new_user trigger to include user_type from auth metadata
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, user_type, instrument, subscription_status, onboarding_complete)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    COALESCE((new.raw_user_meta_data->>'user_type')::text, 'student'),
    NULL,
    'free',
    false
  );
  RETURN new;
END;
$$;