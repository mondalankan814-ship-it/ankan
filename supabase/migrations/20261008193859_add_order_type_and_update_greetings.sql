/*
# Add order_type column to orders table

## Overview
Adds an `order_type` column to distinguish between 'Home Delivery' and 'Dine-in / Pickup' orders.

## Changes
1. New column: `order_type` (text, default 'delivery') on `orders` table
2. No security changes — existing RLS policies already cover the new column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_type text NOT NULL DEFAULT 'delivery';
  END IF;
END $$;

-- Update default apology message to softer tone
UPDATE settings SET value = 'Sorry Sir, we will take full care of these things next time. Please give us another chance to serve you better.' WHERE key = 'apology_message';

-- Update default welcome greeting to softer tone
UPDATE settings SET value = 'Welcome Sir, welcome to AM Palace. We are so happy to have you here. Please take your time and enjoy our delicious food.' WHERE key = 'welcome_greeting';
