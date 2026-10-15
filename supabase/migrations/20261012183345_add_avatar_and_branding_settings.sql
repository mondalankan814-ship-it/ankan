/*
# Add avatar_url to profiles + branding settings (app_name, app_logo)

1. Modified Tables
- `profiles`: add `avatar_url` (text, nullable) — stores the customer's profile photo URL.
- `settings`: add seed rows for `app_name` and `app_logo` if they don't exist.

2. Security
- No new tables; existing RLS on profiles and settings remains unchanged.
- The `avatar_url` column inherits existing profile RLS (users can update their own row).
- Settings rows are readable/writable via existing settings policies (admin-managed, anon-readable).

3. Notes
- `avatar_url` is nullable so existing profiles are unaffected.
- `app_name` defaults to 'AM Palace', `app_logo` defaults to empty string (falls back to Flame icon).
- Uses `ON CONFLICT DO NOTHING` so re-running the migration won't duplicate seed settings.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

INSERT INTO settings (key, value)
VALUES
  ('app_name', 'AM Palace'),
  ('app_logo', '')
ON CONFLICT (key) DO NOTHING;
