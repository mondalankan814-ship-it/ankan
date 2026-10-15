export type Gender = 'male' | 'female' | 'other';

export interface Profile {
  id: string;
  name: string;
  gender: Gender;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  phone_verified: boolean;
  loyalty_count: number;
  reward_unlocked: boolean;
  auth_user_id: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  half_price: number;
  full_price: number;
  has_half: boolean;
  has_full: boolean;
  is_available: boolean;
  sort_order: number;
}

export interface CartItem {
  id: string;
  name: string;
  image_url: string | null;
  portion: 'half' | 'full';
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  profile_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_gender: Gender;
  items: CartItem[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  order_type: 'delivery' | 'pickup';
  payment_method: 'cod' | 'online';
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_distance_km: number | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  delivered_at: string | null;
}

export interface Feedback {
  id: string;
  order_id: string | null;
  profile_id: string | null;
  rating: number;
  message: string | null;
  mood: 'positive' | 'neutral' | 'negative';
  apology_triggered: boolean;
  created_at: string;
}

export interface LoyaltyProgress {
  id: string;
  profile_id: string;
  order_id: string | null;
  item_image: string | null;
  item_name: string | null;
  item_images: string[] | null;
  item_names: string[] | null;
  box_number: number;
  filled_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  discount_percent: number;
  is_active: boolean;
}

export interface Reminder {
  id: string;
  profile_id: string | null;
  phone: string | null;
  item_name: string;
  item_image: string | null;
  order_time: string;
  reminder_time: string;
  message: string | null;
  status: 'scheduled' | 'sent' | 'cancelled';
}
