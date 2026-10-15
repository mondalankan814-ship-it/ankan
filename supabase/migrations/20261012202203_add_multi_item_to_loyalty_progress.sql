/*
# Add multi-item support to loyalty_progress

## Overview
The loyalty system previously stored only a single item_image and item_name per
loyalty box — one dish photo per box. Since each box represents ONE ORDER (not
one item), and an order can contain multiple dishes, we need to store ALL the
item images and names from that order so the loyalty box can display a collage.

## Changes
1. `loyalty_progress` table: add `item_images` (jsonb, nullable) — array of item
   image URLs from the order (e.g. ["url1", "url2", "url3"]).
2. `loyalty_progress` table: add `item_names` (jsonb, nullable) — array of item
   names from the order (e.g. ["Chilli Chicken", "Chowmein", "Soup"]).
3. The existing `item_image` and `item_name` columns are kept for backward
   compatibility — they store the first item's image/name as a fallback.

## Security
- No new policies needed. The new columns inherit existing RLS.
*/

ALTER TABLE loyalty_progress
  ADD COLUMN IF NOT EXISTS item_images jsonb,
  ADD COLUMN IF NOT EXISTS item_names jsonb;