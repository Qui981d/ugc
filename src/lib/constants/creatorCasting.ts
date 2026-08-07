/**
 * Casting vocabulary — one source for the onboarding form and the filters,
 * so a creator can never describe themselves with a term MOSH cannot search.
 */

export const NICHES = [
    'Beauté', 'Mode', 'Food & boissons', 'Restauration', 'Sport & fitness',
    'Santé & bien-être', 'Maison & déco', 'Famille & enfants', 'Animaux',
    'Tech & gaming', 'Voyage', 'Automobile', 'Finance', 'Culture & sorties',
] as const

export const SHOOT_SETTINGS = [
    'Intérieur', 'Extérieur', 'Cuisine', 'Salle de bain', 'Chambre',
    'Studio / fond neutre', 'Nature', 'Ville', 'Salle de sport', 'Voiture',
] as const

export const EQUIPMENT = [
    'Smartphone récent', 'Appareil photo / caméra', 'Micro externe',
    'Éclairage', 'Trépied / stabilisateur', 'Fond vert',
] as const

export const HAIR_COLORS = [
    'Blond', 'Châtain', 'Brun', 'Noir', 'Roux', 'Gris / blanc', 'Coloré', 'Autre',
] as const

export const EYE_COLORS = [
    'Bleu', 'Vert', 'Marron', 'Noisette', 'Gris', 'Noir', 'Autre',
] as const

export const GENDERS = ['Femme', 'Homme', 'Non binaire', 'Ne se prononce pas'] as const

/** Birth year rather than age, so a profile does not quietly go stale. */
export function ageFromBirthYear(year?: number | null): number | null {
    if (!year) return null
    const age = new Date().getFullYear() - year
    return age > 0 && age < 120 ? age : null
}

export const CURRENT_YEAR = new Date().getFullYear()
export const BIRTH_YEARS = Array.from({ length: 60 }, (_, i) => CURRENT_YEAR - 16 - i)
