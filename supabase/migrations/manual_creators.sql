-- ============================================
-- Creator Invitations (liens d'invitation Mosh)
-- ============================================

-- Supprimer l'ancienne table répertoire si elle existe
DROP TABLE IF EXISTS creators_directory;

-- Table des invitations
CREATE TABLE IF NOT EXISTS creator_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES users(id),
  label TEXT,                    -- note interne pour identifier l'invitation
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS : admins full access, public can read their own invite code
ALTER TABLE creator_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_invitations" ON creator_invitations;
CREATE POLICY "admins_manage_invitations" ON creator_invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "public_validate_invitation" ON creator_invitations;
CREATE POLICY "public_validate_invitation" ON creator_invitations
  FOR SELECT USING (true);
