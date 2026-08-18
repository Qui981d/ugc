-- ============================================================
-- Audit du 17 août 2026 — correctif 3/3
--
-- Corrige une erreur du fichier 1 : il protégeait le bucket « deliverables »,
-- que l'application n'utilise pas. Les vidéos livrées vont dans « videos »,
-- les contrats dans « contracts », les pièces jointes dans
-- « message-attachments ». La suppression y était restée ouverte à tout
-- compte connecté — donc SEC-4 n'était pas fermé là où ça comptait.
--
-- Prérequis : le fichier 1 (il crée public.is_admin()).
-- ============================================================


-- ── 1. Les vidéos livrées ──────────────────────────────────
--
-- Le cas destructif : un créateur pouvait supprimer la vidéo d'un autre, ou
-- celle d'un client. Le propriétaire d'un objet est le compte qui l'a
-- téléversé, donc le créateur pour ses propres rendus.

DROP POLICY IF EXISTS "Authenticated users can delete videos" ON storage.objects;
CREATE POLICY "Owner or admin can delete videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'videos'
    AND (owner = auth.uid() OR public.is_admin())
  );

DROP POLICY IF EXISTS "Authenticated users can update videos" ON storage.objects;
CREATE POLICY "Owner or admin can update videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'videos'
    AND (owner = auth.uid() OR public.is_admin())
  );


-- ── 2. Les pièces jointes des messages ─────────────────────
--
-- La règle s'appelait « own message attachments » mais ne vérifiait que le
-- bucket : n'importe qui pouvait supprimer la pièce jointe de n'importe qui.
-- Le nom décrivait l'intention, pas le comportement.

DROP POLICY IF EXISTS "Users can delete own message attachments" ON storage.objects;
CREATE POLICY "Owner or admin can delete message attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (owner = auth.uid() OR public.is_admin())
  );


-- ── 3. Ce qui n'est volontairement PAS changé ──────────────
--
-- « contracts » garde une écriture ouverte aux comptes connectés. La signature
-- réécrit le fichier, et selon qui l'a généré le signataire n'en est pas le
-- propriétaire : restreindre ici casserait la signature. Le risque reste
-- limité — aucune règle de suppression n'existe sur ce bucket, donc un contrat
-- ne peut pas disparaître, et depuis le gel à la signature le texte fait foi
-- en base avec son empreinte. Un fichier réécrit serait donc détectable.
--
-- La lecture reste ouverte sur tous les buckets. La restreindre couperait la
-- relecture des vidéos côté marque et l'affichage des pièces jointes. Une
-- fuite de lecture se répare ; une suppression non. À traiter séparément.


-- ── 4. Vérification ────────────────────────────────────────
-- Aucune ligne ne doit rester avec une condition portant seulement sur le
-- bucket pour DELETE ou UPDATE.
SELECT policyname, cmd, qual AS condition
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND cmd IN ('DELETE', 'UPDATE')
ORDER BY cmd, policyname;


-- ── Retour en arrière ──────────────────────────────────────
-- DROP POLICY IF EXISTS "Owner or admin can delete videos" ON storage.objects;
-- CREATE POLICY "Authenticated users can delete videos" ON storage.objects
--   FOR DELETE TO authenticated USING (bucket_id = 'videos');
