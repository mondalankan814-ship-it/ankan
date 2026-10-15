/*
# Add delivered_at timestamp to orders table

1. Modified Tables
- `orders`: adds `delivered_at` (timestamptz, nullable) column.
  - Set to `now()` when an order's status transitions to 'delivered'.
  - Used by the customer app to trigger the feedback popup only after
    30 minutes have elapsed since delivery.
  - Null for orders that have not yet been delivered.

2. Security
- No RLS policy changes. The existing orders policies already cover
  SELECT/INSERT/UPDATE/DELETE for anon + authenticated roles.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivered_at timestamptz;
  END IF;
END $$;
