-- ============================================================
-- Audit du 17 août 2026 — correctif 2/2
--
-- Ferme SEC-2 : tout compte connecté pouvait lister l'intégralité des comptes
-- de la plateforme, avec les adresses e-mail des marques, des créateurs et de
-- l'équipe.
--
-- Séparé du fichier 1 parce que presque tous les écrans affichent un nom
-- d'interlocuteur par une jointure sur cette table. Une jointure refusée ne
-- provoque pas d'erreur : elle renvoie une valeur vide, et l'écran affiche
-- « Marque » ou « Créateur » à la place du nom. Il faut donc exécuter ce
-- fichier, puis parcourir les écrans listés au point 3.
--
-- Prérequis : le fichier 1 doit être passé (il crée public.is_admin()).
-- ============================================================


-- ── 1. Fonction d'appui ────────────────────────────────────
--
-- Une règle sur users qui interrogerait users tomberait en récursion, et une
-- règle qui interroge campaigns déclencherait à son tour les règles de
-- campaigns. SECURITY DEFINER contourne les deux.
--
-- Deux personnes se voient si elles travaillent ensemble : la marque et le
-- créateur d'une même mission, dans un sens ou dans l'autre, y compris quand
-- le créateur est rattaché à une vidéo plutôt qu'à la mission entière. Les
-- créateurs proposés à une marque sont inclus : la marque doit lire leur
-- profil pour choisir.

CREATE OR REPLACE FUNCTION public.shares_mission_with(p_other uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM campaigns c
    LEFT JOIN campaign_contents cc ON cc.campaign_id = c.id
    WHERE
      -- Je suis la marque, l'autre travaille sur ma mission
      (c.brand_id = auth.uid() AND (
          c.selected_creator_id = p_other
          OR cc.assigned_creator_id = p_other
          OR p_other = ANY (COALESCE(c.proposed_creator_ids, '{}'::uuid[]))
      ))
      -- Je travaille sur la mission, l'autre en est la marque
      OR (c.brand_id = p_other AND (
          c.selected_creator_id = auth.uid()
          OR cc.assigned_creator_id = auth.uid()
          OR auth.uid() = ANY (COALESCE(c.proposed_creator_ids, '{}'::uuid[]))
      ))
  );
$$;

GRANT EXECUTE ON FUNCTION public.shares_mission_with(uuid) TO authenticated;


-- ── 2. La règle ────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view basic user info" ON users;

DROP POLICY IF EXISTS "read_self_or_counterparty_or_admin" ON users;
CREATE POLICY "read_self_or_counterparty_or_admin" ON users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR public.shares_mission_with(id)
  );


-- ── 3. À vérifier après exécution ──────────────────────────
--
-- Sur chacun de ces écrans, un nom qui devient « Marque », « Créateur » ou
-- « — » signale une jointure refusée. Dans ce cas, exécuter le retour en
-- arrière ci-dessous et me le signaler.
--
--   Côté créateur   : tableau de bord, liste des missions, détail d'une
--                     mission, revenus, messagerie
--   Côté marque     : liste des campagnes, détail d'une campagne (surtout les
--                     profils créateurs proposés), messagerie
--   Côté MOSH       : missions, créateurs, marques, équipe, messagerie
--
-- L'espace MOSH ne devrait rien perdre : is_admin() donne accès à tout.

SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;


-- ── Retour en arrière ──────────────────────────────────────
-- DROP POLICY IF EXISTS "read_self_or_counterparty_or_admin" ON users;
-- CREATE POLICY "Authenticated users can view all users"
--   ON users FOR SELECT TO authenticated USING (true);
