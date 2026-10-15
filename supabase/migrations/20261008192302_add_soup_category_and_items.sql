/*
# Add Soup Category and Menu Items

## Overview
Adds a new "Soup" category to the AM Palace menu with three soup items:
- Hot & Sour Soup (Half ₹50 / Full ₹90)
- Chicken Corn Soup (Half ₹60 / Full ₹110)
- Manchow Soup (Half ₹55 / Full ₹100)

## Changes
1. New category: "Soup" with icon "soup" and sort_order 4
2. Three new menu items under the Soup category with images and half/full pricing
3. No security changes — existing RLS policies on categories and menu_items already allow anon CRUD
*/

DO $$
DECLARE
  soup_id uuid;
BEGIN
  -- Insert Soup category if it doesn't exist
  INSERT INTO categories (name, icon, sort_order)
  VALUES ('Soup', 'soup', 4)
  ON CONFLICT DO NOTHING;

  SELECT id INTO soup_id FROM categories WHERE name = 'Soup' LIMIT 1;

  -- Insert soup menu items
  INSERT INTO menu_items (category_id, name, description, image_url, half_price, full_price, sort_order)
  VALUES
    (soup_id, 'Hot & Sour Soup', 'Spicy and tangy Indo-Chinese soup with vegetables and chili', 'https://images.pexels.com/photos/25325508/pexels-photo-25325508.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 50, 90, 1),
    (soup_id, 'Chicken Corn Soup', 'Creamy chicken soup with sweet corn and egg drop', 'https://images.pexels.com/photos/29538431/pexels-photo-29538431.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 60, 110, 2),
    (soup_id, 'Manchow Soup', 'Spicy Indo-Chinese soup with fried noodles and vegetables', 'https://images.pexels.com/photos/8992932/pexels-photo-8992932.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 55, 100, 3)
  ON CONFLICT DO NOTHING;
END $$;
