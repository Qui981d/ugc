-- ============================================================
-- Normalise location_canton to two-letter codes.
--
-- Three forms shipped over time: the signup form stored "Genève", the
-- settings page "Genève, Suisse", and the wizard "GE". The canton filter
-- compares exactly, so none of them matched each other.
--
-- Rows already holding a valid code are left alone. Anything that still
-- does not resolve keeps its original text — better a stale value MOSH can
-- see than a silently emptied field.
-- ============================================================

WITH mapping(name, code) AS (
    VALUES
        ('genève', 'GE'), ('geneve', 'GE'), ('vaud', 'VD'), ('valais', 'VS'),
        ('fribourg', 'FR'), ('neuchâtel', 'NE'), ('neuchatel', 'NE'),
        ('jura', 'JU'), ('berne', 'BE'), ('bern', 'BE'),
        ('zürich', 'ZH'), ('zurich', 'ZH'),
        ('bâle-ville', 'BS'), ('bale-ville', 'BS'),
        ('bâle-campagne', 'BL'), ('bale-campagne', 'BL'),
        ('lucerne', 'LU'), ('saint-gall', 'SG'), ('tessin', 'TI'),
        ('argovie', 'AG'), ('thurgovie', 'TG'), ('grisons', 'GR'),
        ('zoug', 'ZG'), ('soleure', 'SO'), ('schaffhouse', 'SH'),
        ('schwyz', 'SZ'), ('glaris', 'GL'), ('nidwald', 'NW'),
        ('obwald', 'OW'), ('uri', 'UR')
)
UPDATE profiles_creator p
SET location_canton = m.code
FROM mapping m
WHERE p.location_canton IS NOT NULL
  -- Leave already-normalised rows untouched.
  AND length(trim(p.location_canton)) > 2
  -- "Genève", "genève, Suisse", " Genève " all resolve.
  AND lower(trim(p.location_canton)) LIKE m.name || '%';

-- What is left over, if anything — worth a look rather than a guess.
SELECT user_id, location_canton
FROM profiles_creator
WHERE location_canton IS NOT NULL
  AND length(trim(location_canton)) > 2;
