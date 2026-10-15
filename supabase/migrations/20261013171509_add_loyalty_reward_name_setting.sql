/*
# Add loyalty_reward_name setting

1. Purpose
   - Allows the admin to set a custom reward title shown on the customer's
     Loyalty Card when all 7 boxes are filled (e.g. "Free Drink", "10% Off").
   - The customer app reads this setting and displays the dynamic reward name
     instead of the hardcoded "free meal" text.

2. Changes
   - Inserts a new row into the `settings` table:
     key = 'loyalty_reward_name', value = 'Free Meal'
   - Idempotent: only inserts if the row does not already exist.

3. Security
   - No schema changes; the `settings` table already has anon/authenticated
     CRUD policies in place.
*/

INSERT INTO settings (key, value)
SELECT 'loyalty_reward_name', 'Free Meal'
WHERE NOT EXISTS (
  SELECT 1 FROM settings WHERE key = 'loyalty_reward_name'
);
