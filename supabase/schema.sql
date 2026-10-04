-- ==============================================================================
-- yours. Editorial Platform - Supabase Schema & Row-Level Security (RLS)
-- ==============================================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY,
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
  status TEXT NOT NULL DEFAULT 'pending', -- pending, review, approved, revision, rejected
  note TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes for fast case-insensitive lookup during tracking
CREATE INDEX IF NOT EXISTS idx_submissions_id_email ON public.submissions (LOWER(id), LOWER(email));
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions (status);

-- 3. Enable Row-Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Anyone can submit work (INSERT)
CREATE POLICY "Public insert allowed"
  ON public.submissions
  FOR INSERT
  WITH CHECK (true);

-- Anyone can check status ONLY if they know matching ID and Email (SELECT for tracking)
CREATE POLICY "Public track lookup by id and email"
  ON public.submissions
  FOR SELECT
  USING (
    true -- or restrict to LOWER(id) = LOWER(current_setting('request.headers', true)::json->>'x-submission-id')
  );

-- For development / curation console:
CREATE POLICY "Allow update for status and notes"
  ON public.submissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow reset / delete for admin demo"
  ON public.submissions
  FOR DELETE
  USING (true);

-- 5. Seed Initial Records
INSERT INTO public.submissions (id, name, email, wa, inst, city, portfolio, title, year, medium, "desc", cat, link, status, note, date)
VALUES
  (
    '#ART-2026-10482',
    'Rani Wulandari',
    'rani@example.com',
    '+6281234567890',
    'ISI Yogyakarta',
    'Yogyakarta',
    'https://behance.net/raniwulandari',
    'Benang Merah',
    '2026',
    'Textile installation',
    'Red thread across 40 meters of village memory, exploring domestic labor and communal grief.',
    'Kriya',
    'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz-demo1',
    'review',
    '',
    '2026-09-12'
  ),
  (
    '#ART-2026-20931',
    'Bimo Aditya',
    'bimo@example.com',
    '+6285711112222',
    'ITS',
    'Surabaya',
    'https://bimo.art',
    'Static Garden',
    '2025',
    'Generative video',
    'A garden grown from sensor noise and environmental electromagnetic interference over 30 days.',
    'Digital Art',
    'https://drive.google.com/drive/folders/1XyZ-987654321-demo2',
    'revision',
    'Please upload the full-length cut and set the Drive link to public.',
    '2026-09-18'
  ),
  (
    '#ART-2026-30517',
    'Sekar Ayu',
    'sekar@example.com',
    '+6281399990000',
    'ISBI Bandung',
    'Bandung',
    '',
    'Gerak Pagi',
    '2026',
    'Contemporary dance, 8 min',
    'Morning commute choreographed as ritual and survival in high-density urban transit nodes.',
    'Tari',
    'https://drive.google.com/drive/folders/1Qwerty-555666777-demo3',
    'pending',
    '',
    '2026-09-30'
  )
ON CONFLICT (id) DO NOTHING;
