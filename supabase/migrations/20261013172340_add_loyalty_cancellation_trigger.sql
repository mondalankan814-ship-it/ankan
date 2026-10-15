/*
# Add trigger: auto-remove loyalty stamp on order cancellation

## Purpose
When an order's status changes to 'cancelled', this trigger automatically:
1. Deletes the corresponding row(s) from `loyalty_progress` linked via `order_id`.
2. Recalculates the profile's `loyalty_count` by counting remaining loyalty_progress rows.
3. Updates `reward_unlocked` flag based on the new count (true if >= 7).

This guarantees data integrity even if the cancellation originates from outside
the app (e.g. direct SQL, another client, or a future server function).

## Changes
- Creates function `handle_order_cancellation_loyalty()` as SECURITY DEFINER
  so it can update profiles regardless of the calling role's RLS.
- Creates trigger `on_order_cancelled_loyalty` that fires AFTER UPDATE on `orders`
  only when `NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled')`.
- Drops both first for idempotency.

## Security
- Function is SECURITY DEFINER, owned by postgres.
- Trigger fires on UPDATE only, scoped to the status transition into 'cancelled'.
- The function only deletes loyalty_progress rows for the cancelled order and
  recalculates the owning profile's count — no user-controlled input is used.
*/

DROP TRIGGER IF EXISTS on_order_cancelled_loyalty ON orders;
DROP FUNCTION IF EXISTS handle_order_cancellation_loyalty();

CREATE OR REPLACE FUNCTION handle_order_cancellation_loyalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Only act when status transitions TO 'cancelled'
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    -- Find the profile that owns this order
    SELECT profile_id INTO v_profile_id FROM orders WHERE id = NEW.id;

    -- Remove loyalty progress entries for this order
    DELETE FROM loyalty_progress WHERE order_id = NEW.id;

    -- Recalculate the profile's loyalty_count and reward_unlocked
    IF v_profile_id IS NOT NULL THEN
      UPDATE profiles
      SET loyalty_count = (
        SELECT COUNT(*) FROM loyalty_progress WHERE profile_id = v_profile_id
      ),
      reward_unlocked = (
        SELECT COUNT(*) FROM loyalty_progress WHERE profile_id = v_profile_id
      ) >= 7
      WHERE id = v_profile_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_cancelled_loyalty
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_cancellation_loyalty();
