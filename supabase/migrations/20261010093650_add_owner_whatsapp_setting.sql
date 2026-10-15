/*
# Add Owner WhatsApp Number Setting

1. Changes
- Inserts a new row in the `settings` table with key `owner_whatsapp_number` and empty value.
- This is where the store owner saves their WhatsApp number for receiving new order notifications.
2. Notes
- Idempotent: uses ON CONFLICT to avoid duplicate rows if re-run.
- No schema changes, no new tables, no security changes.
*/

INSERT INTO settings (key, value, updated_at)
VALUES ('owner_whatsapp_number', '', now())
ON CONFLICT (key) DO NOTHING;