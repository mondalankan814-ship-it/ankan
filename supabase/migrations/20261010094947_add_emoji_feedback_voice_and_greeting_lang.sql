/*
# Add Emoji Feedback Voice Settings + Greeting Language

1. New Settings
- `feedback_voice_1` through `feedback_voice_5`: Custom voice response templates for each emoji rating (1=Angry, 2=Bad, 3=Neutral, 4=Good, 5=Love)
- `greeting_language`: Controls which language template is used for the app-opening voice greeting ('en' or 'bn')
- `welcome_greeting_en`: English greeting template (default: "Welcome to AM Palace!")
- `welcome_greeting_bn`: Bengali greeting template (default: "AM Palace-এ আপনাকে স্বাগতম!")
2. Notes
- Idempotent: uses ON CONFLICT to avoid duplicates on re-run.
- No schema changes, no new tables, no security changes.
*/

INSERT INTO settings (key, value, updated_at) VALUES
  ('feedback_voice_1', 'We are so sorry for the bad experience. We will definitely improve next time. Please give us another chance.', now()),
  ('feedback_voice_2', 'We are sorry you did not enjoy your meal. We will do better next time.', now()),
  ('feedback_voice_3', 'Thank you for your feedback. We will keep improving to serve you better.', now()),
  ('feedback_voice_4', 'Thank you so much! We are glad you enjoyed your meal. We look forward to serving you again.', now()),
  ('feedback_voice_5', 'Thank you so much! We are thrilled you loved your meal. We will continue to serve you delicious food with love.', now()),
  ('greeting_language', 'en', now()),
  ('welcome_greeting_en', 'Welcome to AM Palace!', now()),
  ('welcome_greeting_bn', 'AM Palace-এ আপনাকে স্বাগতম!', now())
ON CONFLICT (key) DO NOTHING;