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

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES TABLE
-- Stores user display info (avatar, name, title) for all team members.
-- Required for: Google avatar on profile page, per-user artifact attribution.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY,          -- matches auth.users.id
  email       TEXT UNIQUE,
  name        TEXT,
  initials    TEXT,
  title       TEXT DEFAULT 'Designer',
  avatar_url  TEXT,
  is_admin    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (needed to show avatars on artifact cards)
CREATE POLICY "profiles_public_read"
  ON profiles FOR SELECT USING (true);

-- Users can only write their own profile
CREATE POLICY "profiles_user_write"
  ON profiles FOR ALL USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- LINK EXISTING ARTIFACTS TO YOUR ACCOUNT
--
-- Your current feed_items have user_id = 1 (a legacy integer).
-- After running this file and signing in once via Google, find your UUID:
--   Supabase Dashboard → Authentication → Users → copy your UUID
-- Then run this update (replace the placeholder):
-- ─────────────────────────────────────────────────────────────────────────────

-- UPDATE feed_items
--   SET user_id = 'YOUR-UUID-HERE'
--   WHERE user_name = 'Dennis O''Neil';

-- UPDATE artifacts
--   SET user_id = 'YOUR-UUID-HERE'
--   WHERE user_name = 'Dennis O''Neil';
