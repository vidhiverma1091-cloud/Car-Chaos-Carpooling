-- Username-only account identifiers for Car Chaos.
-- Supabase Auth still uses its email/password provider internally, but the app
-- creates a reserved .invalid identifier from the username. No real email is collected.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

-- Keep existing profile rows usable. Existing users can continue to sign in with
-- their old credentials; their username can be set separately if needed.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

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
      'Student'
    ),
    chosen_username
  );

  RETURN NEW;
END;
$$;

-- Username is public profile information; passwords remain exclusively in Supabase Auth.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
