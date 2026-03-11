-- ============================================
-- Creators Directory (CRM interne Mosh)
-- Répertoire de contacts créateurs, indépendant de l'auth
-- ============================================

CREATE TABLE IF NOT EXISTS creators_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  nationality TEXT,
  video_rate_chf NUMERIC,
  specialties TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  instagram_url TEXT,
  tiktok_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS : uniquement les admins
ALTER TABLE creators_directory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_full_access" ON creators_directory;
CREATE POLICY "admins_full_access" ON creators_directory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
