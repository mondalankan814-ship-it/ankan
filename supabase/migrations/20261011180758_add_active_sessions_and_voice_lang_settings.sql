/*
# Add active sessions table + tri-language voice settings + phone_verified column

1. New Tables
- `active_sessions`: Tracks real-time active users for admin analytics
2. Schema Changes
- Add `phone_verified` boolean column to `profiles` (default false)
3. New Settings
- `voice_language`: Controls TTS language globally ('en', 'bn', or 'hi')
- Per-language voice templates for all voice events (en/bn/hi)
4. Security
- RLS enabled on active_sessions with anon+authenticated full access
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
    ALTER TABLE profiles ADD COLUMN phone_verified boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_token text UNIQUE NOT NULL,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON active_sessions;
CREATE POLICY "anon_select_sessions" ON active_sessions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sessions" ON active_sessions;
CREATE POLICY "anon_insert_sessions" ON active_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sessions" ON active_sessions;
CREATE POLICY "anon_update_sessions" ON active_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sessions" ON active_sessions;
CREATE POLICY "anon_delete_sessions" ON active_sessions FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON active_sessions(last_seen);

INSERT INTO settings (key, value, updated_at) VALUES
  ('voice_language', 'en', now()),
  ('welcome_greeting_hi', 'AM Palace में आपका स्वागत है!', now()),
  ('greeting_prefix_male_hi', 'सर', now()),
  ('greeting_prefix_female_hi', 'मैडम', now()),
  ('apology_message_hi', 'सॉरी सर, अगली बार हम इस चीज़ का ध्यान रखेंगे।', now()),
  ('loyalty_reward_text_hi', 'बधाई हो! आपने अपना लॉयल्टी रिवॉर्ड अनलॉक कर लिया है।', now()),
  ('feedback_voice_1_hi', 'हमें बहुत खेद है कि आपका अनुभव अच्छा नहीं रहा। हम अगली बार जरूर सुधार करेंगे।', now()),
  ('feedback_voice_2_hi', 'हमें खेद है कि आपको खाना पसंद नहीं आया। हम अगली बार बेहतर करेंगे।', now()),
  ('feedback_voice_3_hi', 'आपके फीडबैक के लिए धन्यवाद। हम आपको बेहतर सेवा देने के लिए लगातार सुधार करते रहेंगे।', now()),
  ('feedback_voice_4_hi', 'बहुत बहुत धन्यवाद! हमें खुशी है कि आपको खाना पसंद आया। हम आपको फिर से सेवा देने के लिए तत्पर रहेंगे।', now()),
  ('feedback_voice_5_hi', 'धन्यवाद! हमें बहुत खुशी है कि आपको खाना बहुत पसंद आया। हम आपके लिए प्यार से स्वादिष्ट खाना बनाते रहेंगे।', now()),
  ('greeting_prefix_male_bn', 'স্যার', now()),
  ('greeting_prefix_female_bn', 'ম্যাম', now()),
  ('apology_message_bn', 'দুঃখিত, পরের বার আমরা এর খেয়াল রাখব।', now()),
  ('loyalty_reward_text_bn', 'অভিনন্দন! আপনি আপনার লয়্যালটি রিওয়ার্ড আনলক করেছেন।', now()),
  ('feedback_voice_1_bn', 'আপনার অভিজ্ঞতা ভালো না হওয়ার জন্য আমরা দুঃখিত। আমরা পরের বার অবশ্যই উন্নতি করব।', now()),
  ('feedback_voice_2_bn', 'আপনার খাবার পছন্দ না হওয়ার জন্য দুঃখিত। আমরা পরের বার আরও ভালো করব।', now()),
  ('feedback_voice_3_bn', 'আপনার ফিডব্যাকের জন্য ধন্যবাদ। আমরা আপনাকে আরও ভালো সেবা দিতে ক্রমাগত উন্নতি করব।', now()),
  ('feedback_voice_4_bn', 'ধন্যবাদ! আপনার খাবার পছন্দ হয়েছে জেনে আমরা আনন্দিত। আমরা আপনাকে আবার সেবা দিতে অপেক্ষা করছি।', now()),
  ('feedback_voice_5_bn', 'ধন্যবাদ! আপনার খাবার খুব পছন্দ হয়েছে জেনে আমরা রীতিমতো খুশি। আমরা ভালোবাসায় সুস্বাদু খাবার তৈরি করতে থাকব।', now()),
  ('welcome_greeting_bn', 'AM Palace-এ আপনাকে স্বাগতম!', now()),
  ('feedback_voice_1_en', 'We are so sorry for the bad experience. We will definitely improve next time. Please give us another chance.', now()),
  ('feedback_voice_2_en', 'We are sorry you did not enjoy your meal. We will do better next time.', now()),
  ('feedback_voice_3_en', 'Thank you for your feedback. We will keep improving to serve you better.', now()),
  ('feedback_voice_4_en', 'Thank you so much! We are glad you enjoyed your meal. We look forward to serving you again.', now()),
  ('feedback_voice_5_en', 'Thank you so much! We are thrilled you loved your meal. We will continue to serve you delicious food with love.', now()),
  ('apology_message_en', 'We are so sorry Sir. We will take care of this next time.', now()),
  ('loyalty_reward_text_en', 'Congratulations! You have unlocked your loyalty reward.', now()),
  ('welcome_greeting_en', 'Welcome to AM Palace!', now()),
  ('greeting_prefix_male_en', 'Sir', now()),
  ('greeting_prefix_female_en', 'Ma''am', now())
ON CONFLICT (key) DO NOTHING;