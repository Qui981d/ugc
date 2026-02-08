// Swiss UID format: CHE-xxx.xxx.xxx
const SWISS_UID_REGEX = /^CHE-[0-9]{3}\.[0-9]{3}\.[0-9]{3}$/

/**
 * Validates a Swiss UID (Unique Identification Number) format.
 * Format: CHE-xxx.xxx.xxx (e.g., CHE-123.456.789)
 */
export function isValidSwissUID(uid: string): boolean {
    return SWISS_UID_REGEX.test(uid)
}

/**
 * Formats a raw UID string to Swiss UID format.
 * Input: "123456789" or "CHE123456789"
 * Output: "CHE-123.456.789"
 */
export function formatSwissUID(raw: string): string | null {
    // Remove any existing formatting
    const digits = raw.replace(/[^0-9]/g, '')

    if (digits.length !== 9) {
        return null
    }

    return `CHE-${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}`
}

/**
 * Swiss cantons for location selection
 */
export const SWISS_CANTONS = [
    { code: 'GE', name: 'Genève' },
    { code: 'VD', name: 'Vaud' },
    { code: 'VS', name: 'Valais' },
    { code: 'FR', name: 'Fribourg' },
    { code: 'NE', name: 'Neuchâtel' },
    { code: 'JU', name: 'Jura' },
    { code: 'BE', name: 'Berne' },
    { code: 'ZH', name: 'Zürich' },
    { code: 'BS', name: 'Bâle-Ville' },
    { code: 'BL', name: 'Bâle-Campagne' },
    { code: 'LU', name: 'Lucerne' },
    { code: 'SG', name: 'Saint-Gall' },
    { code: 'TI', name: 'Tessin' },
    { code: 'AG', name: 'Argovie' },
    { code: 'TG', name: 'Thurgovie' },
    { code: 'GR', name: 'Grisons' },
    { code: 'ZG', name: 'Zoug' },
    { code: 'SO', name: 'Soleure' },
    { code: 'SH', name: 'Schaffhouse' },
    { code: 'SZ', name: 'Schwyz' },
    { code: 'AR', name: 'Appenzell Rhodes-Extérieures' },
    { code: 'AI', name: 'Appenzell Rhodes-Intérieures' },
    { code: 'GL', name: 'Glaris' },
    { code: 'NW', name: 'Nidwald' },
    { code: 'OW', name: 'Obwald' },
    { code: 'UR', name: 'Uri' },
] as const

/**
 * Format a number as Swiss Francs
 */
export function formatCHF(amount: number): string {
    return new Intl.NumberFormat('fr-CH', {
        style: 'currency',
        currency: 'CHF',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Calculate TVA (Swiss VAT) at 8.1%
 */
export const TVA_RATE = 0.081

export function calculateTVA(amount: number): {
    net: number
    tva: number
    gross: number
} {
    const tva = amount * TVA_RATE
    return {
        net: amount,
        tva: Math.round(tva * 100) / 100,
        gross: Math.round((amount + tva) * 100) / 100,
    }
}
