-- ==============================================================================
-- yours. Editorial Platform - Production Supabase Schema & Policies (100% Cloud)
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(LOWER(email));
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles read access" ON public.profiles;
CREATE POLICY "Public profiles read access"
  ON public.profiles FOR SELECT
  USING (
    role != 'superadmin' OR auth.uid() = id OR (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'superadmin'
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow insert profile on signup" ON public.profiles;
CREATE POLICY "Allow insert profile on signup"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete profiles" ON public.profiles;
CREATE POLICY "Allow delete profiles"
  ON public.profiles FOR DELETE
  USING (true);

-- Function to completely remove user from auth.users and profiles
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for Superadmin to promote/demote user roles securely
CREATE OR REPLACE FUNCTION public.promote_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmin can promote or demote user roles.';
  END IF;

  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW() 
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'creator')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select categories" ON public.categories;
CREATE POLICY "Allow select categories"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert categories" ON public.categories;
CREATE POLICY "Allow insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update categories" ON public.categories;
CREATE POLICY "Allow update categories"
  ON public.categories FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete categories" ON public.categories;
CREATE POLICY "Allow delete categories"
  ON public.categories FOR DELETE
  USING (true);

-- Insert Default Category Options for Form
INSERT INTO public.categories (name)
VALUES
  ('Seni Rupa'),
  ('Terapan'),
  ('Kriya'),
  ('Fotografi'),
  ('Tari'),
  ('Musik'),
  ('Teater'),
  ('Digital Art')
ON CONFLICT (name) DO NOTHING;

-- 4. Submissions Table (Empty, 0 dummy data)
CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  wa TEXT NOT NULL,
  inst TEXT DEFAULT '',
  city TEXT DEFAULT '',
  portfolio TEXT DEFAULT '',
  title TEXT NOT NULL,
  year TEXT DEFAULT '',
  medium TEXT DEFAULT '',
  "desc" TEXT NOT NULL,
  cat TEXT NOT NULL,
  link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'approved', 'revision', 'rejected')),
  note TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_id_email ON public.submissions (LOWER(id), LOWER(email));
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions (status);
CREATE INDEX IF NOT EXISTS idx_submissions_date ON public.submissions (date DESC);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert submissions" ON public.submissions;
CREATE POLICY "Allow insert submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select submissions" ON public.submissions;
CREATE POLICY "Allow select submissions"
  ON public.submissions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow update submissions" ON public.submissions;
CREATE POLICY "Allow update submissions"
  ON public.submissions FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete submissions" ON public.submissions;
CREATE POLICY "Allow delete submissions"
  ON public.submissions FOR DELETE
  USING (true);
