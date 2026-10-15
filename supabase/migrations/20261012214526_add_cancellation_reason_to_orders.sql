/*
# Add cancellation_reason column to orders

1. Modified Tables
- `orders` — adds `cancellation_reason` (text, nullable) to store the optional reason
  a customer provides when cancelling an order. Nullable because most orders are never
  cancelled and the column is only populated on cancel.

2. Security
- No changes to existing RLS policies. The column is read/written through the same
  anon+authenticated policies already in place on `orders`.

3. Notes
- Safe to re-run: uses DO $$ ... IF NOT EXISTS ... END $$ guard.
- No data is lost — this is purely additive.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE orders ADD COLUMN cancellation_reason text;
  END IF;
END $$;