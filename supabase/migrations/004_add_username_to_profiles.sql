-- Migration: 004_add_username_to_profiles
-- Description: Add username column to profiles table for unified auth system
-- Created: 2026-01-19
-- 
-- This migration unifies the authentication system between cadencea-web and cadencea-vault
-- by adding a username column to the Supabase profiles table.

-- ============================================================================
-- ADD USERNAME COLUMN TO PROFILES
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique 
ON profiles (username) 
WHERE username IS NOT NULL;

-- ============================================================================
-- UPDATE HANDLE_NEW_USER TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
BEGIN
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    new_username := new_username || '_' || SUBSTR(NEW.id::TEXT, 1, 4);
  END LOOP;

  INSERT INTO public.profiles (id, first_name, last_name, email, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    new_username
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BACKFILL USERNAMES FOR EXISTING USERS
-- ============================================================================

UPDATE profiles
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;

WITH duplicates AS (
  SELECT id, username, 
         ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at) as rn
  FROM profiles
  WHERE username IS NOT NULL
)
UPDATE profiles p
SET username = p.username || '_' || SUBSTR(p.id::TEXT, 1, 8)
FROM duplicates d
WHERE p.id = d.id AND d.rn > 1;

ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL;

-- ============================================================================
-- ADD RLS POLICY FOR USERNAME LOOKUPS
-- ============================================================================

CREATE POLICY "Users can search profiles by username" ON profiles
  FOR SELECT 
  TO authenticated
  USING (true);

