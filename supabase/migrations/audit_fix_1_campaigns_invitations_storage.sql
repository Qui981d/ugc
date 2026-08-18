-- ============================================================
-- Audit du 17 août 2026 — correctifs 1/2
--
-- Ferme SEC-1 (campagnes lisibles par tous), SEC-3 (codes d'invitation
-- publics) et SEC-4 (suppression de n'importe quelle vidéo).
--
-- SEC-2 (table users) est dans le fichier 2, parce qu'il touche les jointures
-- de presque tous les écrans et demande une vérification à part.
--
-- À exécuter d'un bloc dans l'éditeur SQL Supabase. Le retour en arrière est
-- donné en commentaire à la fin.
-- ============================================================


-- ── 0. Fonctions d'appui ───────────────────────────────────
--
-- Les règles de campaign_contents interrogent déjà campaigns. Si les règles de
-- campaigns interrogeaient campaign_contents en retour, Postgres refuserait la
-- requête pour récursion infinie. SECURITY DEFINER fait tourner la lecture avec
-- les droits du propriétaire, donc hors règles, ce qui casse le cycle.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_to_campaign(p_campaign uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaign_contents
    WHERE campaign_id = p_campaign
      AND assigned_creator_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_assigned_to_campaign(uuid) TO authenticated;


-- ── 1. SEC-1 : les campagnes ───────────────────────────────
--
-- Remplacée par trois règles. Elles s'additionnent : il suffit qu'une seule
-- accepte. Aucun écran ne parcourt de campagnes ouvertes — les créateurs ne
-- voient que ce qui leur est assigné — donc rien ne justifie une lecture large.

DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON campaigns;

DROP POLICY IF EXISTS "admins_read_all_campaigns" ON campaigns;
CREATE POLICY "admins_read_all_campaigns" ON campaigns
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "brands_read_own_campaigns" ON campaigns;
CREATE POLICY "brands_read_own_campaigns" ON campaigns
  FOR SELECT TO authenticated
  USING (brand_id = auth.uid());

DROP POLICY IF EXISTS "creators_read_assigned_campaigns" ON campaigns;
CREATE POLICY "creators_read_assigned_campaigns" ON campaigns
  FOR SELECT TO authenticated
  USING (
    selected_creator_id = auth.uid()
    OR public.is_assigned_to_campaign(id)
  );


-- ── 2. SEC-3 : les codes d'invitation ──────────────────────
--
-- La table était lisible sans même être connecté, donc tous les codes valides
-- étaient énumérables. Deux fonctions remplacent la lecture directe : elles
-- répondent sur un code précis et ne révèlent jamais la liste.
--
-- Au passage : il n'existait aucune règle d'écriture pour un non-admin, donc
-- markInvitationUsed échouait en silence et les codes restaient valables
-- indéfiniment, malgré le « utilisable une seule fois » affiché au créateur.

DROP POLICY IF EXISTS "public_validate_invitation" ON creator_invitations;

CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv creator_invitations;
BEGIN
  SELECT * INTO inv
  FROM creator_invitations
  WHERE code = upper(trim(p_code))
  LIMIT 1;

  IF inv.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Code d''invitation invalide');
  END IF;

  IF inv.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Cette invitation a déjà été utilisée');
  END IF;

  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Cette invitation a expiré');
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- Consomme le code. Refuse une invitation déjà utilisée ou expirée, pour qu'un
-- appel répété ne puisse pas réattribuer un code.
CREATE OR REPLACE FUNCTION public.mark_invitation_used(p_code text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated integer;
BEGIN
  UPDATE creator_invitations
  SET used_by = p_user_id,
      used_at = now()
  WHERE code = upper(trim(p_code))
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at >= now());

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;

-- Volontairement ouvert à anon : la validation intervient sur la page
-- d'inscription, avant l'existence d'un compte.
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_invitation_used(text, uuid) TO anon, authenticated;


-- ── 3. SEC-4 : suppression des livrables ───────────────────
--
-- Tout compte connecté pouvait supprimer ou remplacer n'importe quel fichier.
-- Seul constat de l'audit aux conséquences irréversibles.
--
-- La lecture reste large volontairement : la restreindre couperait la lecture
-- des vidéos côté marque, et une fuite de lecture se répare — une suppression
-- non. À traiter séparément, après vérification de la façon dont les vidéos
-- sont servies.

DROP POLICY IF EXISTS "Authenticated users can delete deliverables" ON storage.objects;
CREATE POLICY "Owner or admin can delete deliverables" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND (owner = auth.uid() OR public.is_admin())
  );

DROP POLICY IF EXISTS "Authenticated users can update deliverables" ON storage.objects;
CREATE POLICY "Owner or admin can update deliverables" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND (owner = auth.uid() OR public.is_admin())
  );


-- ── 4. Vérification ────────────────────────────────────────
-- Doit renvoyer 3 lignes pour campaigns, 0 pour l'ancienne règle publique.
SELECT tablename, policyname
FROM pg_policies
WHERE (tablename = 'campaigns' AND cmd = 'SELECT')
   OR tablename = 'creator_invitations'
ORDER BY tablename, policyname;


-- ── Retour en arrière, si un écran se vide ─────────────────
-- DROP POLICY IF EXISTS "admins_read_all_campaigns" ON campaigns;
-- DROP POLICY IF EXISTS "brands_read_own_campaigns" ON campaigns;
-- DROP POLICY IF EXISTS "creators_read_assigned_campaigns" ON campaigns;
-- CREATE POLICY "Authenticated users can view campaigns"
--   ON campaigns FOR SELECT TO authenticated USING (true);
