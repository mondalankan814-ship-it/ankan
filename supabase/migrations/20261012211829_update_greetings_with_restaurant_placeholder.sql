/*
# Update Greeting Templates with Restaurant Name Placeholder

## Overview
Updates the welcome greeting templates to use [RESTAURANT] instead of a hardcoded
"AM Palace" string, so the greeting dynamically uses whatever restaurant name
the admin sets in the Branding tab.

## Changes
1. English: "Welcome [NAME] [TITLE] to [RESTAURANT]!"
2. Bengali: "[RESTAURANT]-এ [TITLE] [NAME]-কে স্বাগতম!"
3. Hindi: "[RESTAURANT] में [TITLE] [NAME] का स्वागत है!"

## Security
No security changes — only updating existing settings rows.
*/

UPDATE settings SET value = 'Welcome [NAME] [TITLE] to [RESTAURANT]!', updated_at = now() WHERE key = 'welcome_greeting_en';
UPDATE settings SET value = '[RESTAURANT]-এ [TITLE] [NAME]-কে স্বাগতম!', updated_at = now() WHERE key = 'welcome_greeting_bn';
UPDATE settings SET value = '[RESTAURANT] में [TITLE] [NAME] का स्वागत है!', updated_at = now() WHERE key = 'welcome_greeting_hi';
