-- ==============================================================================
-- CAR CHAOS - COMPLETE DATABASE SCHEMA & SECURITY POLICIES
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to set up all tables, triggers,
-- Realtime listeners, and Row-Level Security (RLS) policies.
-- ==============================================================================

-- 1. PROFILES TABLE & AUTH TRIGGER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Student',
  username text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chosen_username text;
BEGIN
  chosen_username := lower(NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''));

  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
      chosen_username,
      split_part(NEW.email, '@', 1),
      'Student'
    ),
    chosen_username
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. RIDE POSTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ride_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  destination text NOT NULL CHECK (char_length(destination) BETWEEN 1 AND 120),
  leave_date date NOT NULL,
  leave_time time NOT NULL,
  seats int NOT NULL DEFAULT 3 CHECK (seats BETWEEN 1 AND 8),
  gender_pref text NOT NULL DEFAULT 'any',
  preferences text NOT NULL DEFAULT '' CHECK (char_length(preferences) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_posts TO authenticated;
GRANT ALL ON public.ride_posts TO service_role;
ALTER TABLE public.ride_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signed in read posts" ON public.ride_posts;
CREATE POLICY "signed in read posts" ON public.ride_posts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "own post insert" ON public.ride_posts;
CREATE POLICY "own post insert" ON public.ride_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own post update" ON public.ride_posts;
CREATE POLICY "own post update" ON public.ride_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own post delete" ON public.ride_posts;
CREATE POLICY "own post delete" ON public.ride_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. RIDE REQUESTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.ride_posts(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL DEFAULT auth.uid(),
  requester_name text NOT NULL CHECK (char_length(requester_name) BETWEEN 1 AND 80),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 300),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, requester_id)
);

GRANT SELECT, INSERT, UPDATE ON public.ride_requests TO authenticated;
GRANT ALL ON public.ride_requests TO service_role;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requester or owner read" ON public.ride_requests;
CREATE POLICY "requester or owner read" ON public.ride_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR EXISTS (SELECT 1 FROM public.ride_posts p WHERE p.id = post_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "requester insert" ON public.ride_requests;
CREATE POLICY "requester insert" ON public.ride_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending' AND NOT EXISTS (SELECT 1 FROM public.ride_posts p WHERE p.id = post_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "owner decides" ON public.ride_requests;
CREATE POLICY "owner decides" ON public.ride_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ride_posts p WHERE p.id = post_id AND p.user_id = auth.uid()));

-- Enable Realtime for ride coordination
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_requests;

-- 4. BOOKED RIDES COUNTER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.booked_rides_count() RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.ride_requests WHERE status = 'accepted';
$$;
GRANT EXECUTE ON FUNCTION public.booked_rides_count() TO anon, authenticated;
