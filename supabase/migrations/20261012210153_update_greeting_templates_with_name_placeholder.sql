/*
# Update Welcome Greeting Templates with Name and Title Placeholders

## Overview
The existing welcome greeting templates in the settings table are static strings
like "Welcome to AM Palace!" with no [NAME] or [TITLE] placeholders. This means
the code that replaces [NAME] with the user's actual name has no effect — the
greeting never includes the user's name.

## Changes
Updates the welcome_greeting_en, welcome_greeting_bn, and welcome_greeting_hi
settings to include [NAME] and [TITLE] placeholders so the personalized
greeting works correctly:

1. English: "Welcome [NAME] [TITLE] to AM Palace!"
2. Bengali: "AM Palace-এ [TITLE] [NAME]-কে স্বাগতম!"
3. Hindi: "AM Palace में [TITLE] [NAME] का स्वागत है!"

## Security
No security changes — only updating existing settings rows.

## Important Notes
1. The code already handles [NAME] and [TITLE] replacement — the templates
   just need the placeholders to be present.
2. If settings are customized later via the admin panel, those values will
   override these defaults.
*/

UPDATE settings SET value = 'Welcome [NAME] [TITLE] to AM Palace!', updated_at = now() WHERE key = 'welcome_greeting_en';
UPDATE settings SET value = 'AM Palace-এ [TITLE] [NAME]-কে স্বাগতম!', updated_at = now() WHERE key = 'welcome_greeting_bn';
UPDATE settings SET value = 'AM Palace में [TITLE] [NAME] का स्वागत है!', updated_at = now() WHERE key = 'welcome_greeting_hi';

-- Insert if they didn't exist (idempotent safety)
INSERT INTO settings (key, value)
SELECT 'welcome_greeting_en', 'Welcome [NAME] [TITLE] to AM Palace!'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'welcome_greeting_en');

INSERT INTO settings (key, value)
SELECT 'welcome_greeting_bn', 'AM Palace-এ [TITLE] [NAME]-কে স্বাগতম!'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'welcome_greeting_bn');

INSERT INTO settings (key, value)
SELECT 'welcome_greeting_hi', 'AM Palace में [TITLE] [NAME] का स्वागत है!'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'welcome_greeting_hi');
