/*
# Restore Full Menu — Categories and Items

## Overview
Restores the complete AM Palace fast-food menu with all original categories
and items that were missing from the database. The Soup category already exists
and is preserved. This migration adds the following categories and their items:

1. Chilli Chicken (sort_order 1)
2. Chowmein (sort_order 2)
3. Rice (sort_order 3)
4. Hakka Noodles (sort_order 5)
5. Chicken Lollipop (sort_order 6)

## Categories Added
- Chilli Chicken — icon: flame
- Chowmein — icon: utensils
- Rice — icon: bowl-rice
- Hakka Noodles — icon: utensils
- Chicken Lollipop — icon: flame

## Menu Items Added
Each category gets 2-3 items with half/full pricing, descriptions, and food images.
All items are marked as available with appropriate sort_order.

## Security
No security changes — existing RLS policies on categories and menu_items
already allow anon+authenticated CRUD operations.

## Important Notes
1. The Soup category (sort_order 4) and its 3 items already exist and are NOT touched.
2. All inserts use ON CONFLICT DO NOTHING to be idempotent.
3. Items are linked to categories via a DO $$ block that captures category IDs.
*/

DO $$
DECLARE
  chilli_id uuid;
  chowmein_id uuid;
  rice_id uuid;
  hakka_id uuid;
  lollipop_id uuid;
BEGIN
  -- Insert categories if they don't exist
  INSERT INTO categories (name, icon, sort_order)
  VALUES
    ('Chilli Chicken', 'flame', 1),
    ('Chowmein', 'utensils', 2),
    ('Rice', 'bowl-rice', 3),
    ('Hakka Noodles', 'utensils', 5),
    ('Chicken Lollipop', 'flame', 6)
  ON CONFLICT DO NOTHING;

  -- Get category IDs
  SELECT id INTO chilli_id FROM categories WHERE name = 'Chilli Chicken' LIMIT 1;
  SELECT id INTO chowmein_id FROM categories WHERE name = 'Chowmein' LIMIT 1;
  SELECT id INTO rice_id FROM categories WHERE name = 'Rice' LIMIT 1;
  SELECT id INTO hakka_id FROM categories WHERE name = 'Hakka Noodles' LIMIT 1;
  SELECT id INTO lollipop_id FROM categories WHERE name = 'Chicken Lollipop' LIMIT 1;

  -- Chilli Chicken items
  INSERT INTO menu_items (category_id, name, description, image_url, half_price, full_price, sort_order)
  VALUES
    (chilli_id, 'Chilli Chicken Dry', 'Crispy boneless chicken tossed with peppers, onions, and spicy Indo-Chinese sauce', 'https://images.pexels.com/photos/28674534/pexels-photo-28674534.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 120, 220, 1),
    (chilli_id, 'Chilli Chicken Gravy', 'Boneless chicken in a rich, spicy chili gravy with bell peppers and spring onions', 'https://images.pexels.com/photos/5339082/pexels-photo-5339082.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 130, 240, 2),
    (chilli_id, 'Chilli Chicken Combo', 'Chilli chicken served with Hakka noodles — a complete Indo-Chinese meal', 'https://images.pexels.com/photos/28445829/pexels-photo-28445829.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 180, 320, 3)
  ON CONFLICT DO NOTHING;

  -- Chowmein items
  INSERT INTO menu_items (category_id, name, description, image_url, half_price, full_price, sort_order)
  VALUES
    (chowmein_id, 'Veg Chowmein', 'Stir-fried noodles with fresh vegetables, soy sauce, and spring onions', 'https://images.pexels.com/photos/39359499/pexels-photo-39359499.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 80, 150, 1),
    (chowmein_id, 'Chicken Chowmein', 'Wok-tossed noodles with shredded chicken, vegetables, and homemade sauce', 'https://images.pexels.com/photos/39359500/pexels-photo-39359500.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 100, 180, 2),
    (chowmein_id, 'Egg Chowmein', 'Stir-fried noodles with scrambled egg, vegetables, and Indo-Chinese spices', 'https://images.pexels.com/photos/37165674/pexels-photo-37165674.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 90, 170, 3)
  ON CONFLICT DO NOTHING;

  -- Rice items
  INSERT INTO menu_items (category_id, name, description, image_url, half_price, full_price, sort_order)
  VALUES
    (rice_id, 'Veg Fried Rice', 'Fragrant basmati rice stir-fried with mixed vegetables and soy sauce', 'https://images.pexels.com/photos/34683317/pexels-photo-34683317.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 80, 150, 1),
    (rice_id, 'Chicken Fried Rice', 'Wok-fried rice with tender chicken pieces, vegetables, and aromatic spices', 'https://images.pexels.com/photos/35228295/pexels-photo-35228295.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 100, 180, 2),
    (rice_id, 'Schezwan Fried Rice', 'Spicy Schezwan-style fried rice with vegetables and a fiery kick', 'https://images.pexels.com/photos/37173662/pexels-photo-37173662.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 110, 200, 3)
  ON CONFLICT DO NOTHING;

  -- Hakka Noodles items
  INSERT INTO menu_items (category_id, name, description, image_url, half_price, full_price, sort_order)
  VALUES
    (hakka_id, 'Veg Hakka Noodles', 'Classic Hakka-style noodles tossed with crunchy vegetables and soy sauce', 'https://images.pexels.com/photos/34170982/pexels-photo-34170982.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 80, 150, 1),
    (hakka_id, 'Chicken Hakka Noodles', 'Hakka noodles with shredded chicken, bell peppers, and spring onions', 'https://images.pexels.com/photos/34170981/pexels-photo-34170981.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 100, 180, 2),
    (hakka_id, 'Mixed Hakka Noodles', 'Hakka noodles loaded with chicken, egg, prawns, and fresh vegetables', 'https://images.pexels.com/photos/9045147/pexels-photo-9045147.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 120, 220, 3)
  ON CONFLICT DO NOTHING;

  -- Chicken Lollipop items
  INSERT INTO menu_items (category_id, name, description, image_url, half_price, full_price, sort_order)
  VALUES
    (lollipop_id, 'Chicken Lollipop (4 pcs)', 'Crispy fried chicken lollipops marinated in secret spices, served with dip', 'https://images.pexels.com/photos/7868115/pexels-photo-7868115.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 100, 180, 1),
    (lollipop_id, 'Spicy Chicken Lollipop (4 pcs)', 'Extra spicy chicken lollipops with a fiery red marinade and crispy coating', 'https://images.pexels.com/photos/29631422/pexels-photo-29631422.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 110, 200, 2),
    (lollipop_id, 'Chicken Pakora (6 pcs)', 'Deep-fried chicken pieces in a spiced gram flour batter, golden and crunchy', 'https://images.pexels.com/photos/35123974/pexels-photo-35123974.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 90, 160, 3)
  ON CONFLICT DO NOTHING;
END $$;
