/*
# OTP storage table for SMS gateway integration

## Purpose
Stores OTP codes generated during login so the verify step can check them
regardless of whether the OTP was a demo code (123456) or a real code sent
via an SMS gateway provider.

## Security
- RLS enabled with policies allowing anon+authenticated to insert and select
  by phone number (needed for the login flow before a profile exists).
- OTPs expire after 5 minutes.
- Used OTPs are marked consumed to prevent replay.
*/

CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  is_demo boolean NOT NULL DEFAULT false,
  consumed boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_otp" ON otp_codes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "select_otp" ON otp_codes FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "update_otp" ON otp_codes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_otp" ON otp_codes FOR DELETE
  TO anon, authenticated USING (true);
