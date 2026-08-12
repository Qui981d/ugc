/**
 * MOSH's legal identity — the single locked source.
 *
 * These values print on every contract and every invoice. They were
 * placeholders (`CHE-XXX.XXX.XXX`, "Lausanne, Suisse") until 2026-08-12, so
 * documents issued before that date carry an invented company number.
 *
 * Confirmed by the founder against the commercial register. Two corrections
 * to the `mosh_legal_entity.json` supplied with the contract pack:
 *
 *  - it labelled `CH-550.1.193.722-6` as the IDE; that is the commercial
 *    register number. The IDE is `CHE-431.112.507`.
 *  - it gave "Rte de Saint-Cergues 307" as the address, taken from the source
 *    contract. The current address is Route de Champ-Colin 12.
 *
 * Nothing here may be typed freely into a mission. Changing a value here
 * changes every document generated afterwards, so treat it as a release.
 */

export const MOSH_LEGAL_ENTITY = {
    configVersion: '1.1.0',

    legalName: 'LGMA SA',
    tradingNames: ['Mosh', 'Mosh UGC'],
    legalForm: 'SA',
    /** How the party is named in a document, per the pack's rendering rule. */
    displayName: 'LGMA SA (Mosh)',

    address: {
        line1: 'Route de Champ-Colin 12',
        postalCode: '1260',
        city: 'Nyon',
        region: 'VD',
        countryCode: 'CH',
    },

    /** Swiss business identification number — printed as "IDE". */
    uidNumber: 'CHE-431.112.507',
    /** Distinct VAT number, if LGMA SA is VAT-registered. Not yet confirmed. */
    vatNumber: null as string | null,

    email: 'jeprendslaperoavecmosh@moshlemail.com',
} as const

/** Contract defaults confirmed in the source agreement. */
export const MOSH_CONTRACT_DEFAULTS = {
    governingLaw: 'CH',
    jurisdictionPlace: 'Canton de Vaud',
    paymentTermsDays: 30,
    confidentialitySurvivalMonths: 60,
    nonCircumventionMonths: 24,
    terminationNoticeDays: 15,
    terminationNoticeExcludesActiveMissions: true,
    /** Standard Swiss VAT rate. */
    vatRate: 8.1,
} as const

/** One-line postal address, for contracts and invoice headers. */
export function moshFormattedAddress(): string {
    const a = MOSH_LEGAL_ENTITY.address
    return `${a.line1}, ${a.postalCode} ${a.city}, Suisse`
}

/** Payment wording for contracts and invoices — one sentence, one source. */
export function moshPaymentTerms(): string {
    return `Paiement à ${MOSH_CONTRACT_DEFAULTS.paymentTermsDays} jours après validation définitive des livrables par MOSH.`
}

/** The VAT line is omitted entirely when LGMA SA has no distinct number. */
export function moshVatLine(): string | null {
    return MOSH_LEGAL_ENTITY.vatNumber ? `N° TVA : ${MOSH_LEGAL_ENTITY.vatNumber}` : null
}
