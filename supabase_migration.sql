-- ─────────────────────────────────────────────────────────────────────────────
-- Stash — full migration
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DISPLAY COLUMNS
--    Stores device shell, crop, alignment, and mobile background persistently.
--    Without these, changes only survive in localStorage (same browser only).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE feed_items
  ADD COLUMN IF NOT EXISTS device_shell TEXT  DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS mobile_bg    TEXT  DEFAULT '#000',
  ADD COLUMN IF NOT EXISTS crop         JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS align        TEXT  DEFAULT 'center';

ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS device_shell TEXT  DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS crop         JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS align        TEXT  DEFAULT 'center';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
--    Stash is an internal team tool — all authenticated users can read/write
--    everything. Profiles need tighter control (avatar / identity data).
--
--    If your tables were created via the Supabase Dashboard, RLS is ON by
--    default with no policies, which silently blocks all writes. Fix it here.
-- ─────────────────────────────────────────────────────────────────────────────

-- Data tables: full access for everyone (anon reads, auth writes both fine)
ALTER TABLE feed_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts  DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects   DISABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PROFILES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY,   -- matches auth.users.id
  email       TEXT UNIQUE,
  name        TEXT,
  initials    TEXT,
  title       TEXT    DEFAULT 'Designer',
  avatar_url  TEXT,
  is_admin    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies so re-runs are safe
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_user_write"  ON profiles;

CREATE POLICY "profiles_public_read"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_user_write"
  ON profiles FOR ALL USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. LINK EXISTING ARTIFACTS TO YOUR ACCOUNT  (run once after first login)
--
--    After signing in with Google, get your UUID:
--      Supabase Dashboard → Authentication → Users → copy your UUID
--    Then uncomment and run these two statements:
-- ─────────────────────────────────────────────────────────────────────────────

-- UPDATE feed_items SET user_id = 'YOUR-UUID-HERE' WHERE user_name = 'Dennis O''Neil';
-- UPDATE artifacts  SET user_id = 'YOUR-UUID-HERE' WHERE user_name = 'Dennis O''Neil';
