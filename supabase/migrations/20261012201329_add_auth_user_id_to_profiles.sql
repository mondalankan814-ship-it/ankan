/*
# Add auth_user_id to profiles for Supabase Auth OTP linking

## Overview
Adds an `auth_user_id` column to the `profiles` table so that customer profiles
can be linked to real Supabase Auth users (created via phone OTP authentication).

## Changes
1. `profiles` table: add `auth_user_id` (uuid, nullable) — stores the Supabase Auth user ID
   when a customer signs in via phone OTP. This allows the app to look up the customer's
   profile (name, gender, loyalty, etc.) from their authenticated session.
2. Add an index on `auth_user_id` for fast lookups during login.
3. Add a unique constraint on `phone` to prevent duplicate profiles for the same phone number
   (needed now that real OTP authentication ensures phone uniqueness).

## Security
- The `auth_user_id` column inherits existing profile RLS (anon+authenticated CRUD).
- No new policies needed — the existing open policies remain since the app uses the
  anon key client and manages profile ownership through the auth_user_id linkage
  in application code.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

-- Add unique constraint on phone (only for non-null phones)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_phone_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);
  END IF;
END $$;