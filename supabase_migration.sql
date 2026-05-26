-- Run this in the Supabase SQL editor to add the missing display columns.
-- These columns store crop, device shell, and alignment settings persistently.
-- Without them, changes fall back to localStorage (same-browser only).

-- feed_items: artifact display settings
ALTER TABLE feed_items
  ADD COLUMN IF NOT EXISTS device_shell TEXT    DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS mobile_bg    TEXT    DEFAULT '#000',
  ADD COLUMN IF NOT EXISTS crop         JSONB   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS align        TEXT    DEFAULT 'center';

-- artifacts: project artifact display settings
ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS device_shell TEXT    DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS crop         JSONB   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS align        TEXT    DEFAULT 'center';
