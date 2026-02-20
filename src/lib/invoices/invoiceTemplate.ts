// ================================================
// MOSH (LGMA SA) — Invoice Template
// Décompte de prestation / Facture créateur
// ================================================

export interface InvoiceVariables {
    INVOICE_NUMBER: string
    INVOICE_DATE: string

    // MOSH
    MOSH_COMPANY_NAME: string
    MOSH_ADDRESS: string
    MOSH_UID: string
    MOSH_EMAIL: string

    // Creator
    CREATOR_FULL_NAME: string
    CREATOR_ADDRESS: string
    CREATOR_EMAIL: string

    // Mission
    MISSION_TITLE: string
    MISSION_REF: string
    BRAND_NAME: string
    DELIVERABLES_SUMMARY: string
    COMPLETION_DATE: string

    // Amounts
    AMOUNT_HT: string
    TVA_RATE: string
    TVA_AMOUNT: string
    AMOUNT_TTC: string

    // Payment
    PAYMENT_TERMS: string
    PAYMENT_DUE_DATE: string
}

export function generateInvoiceText(vars: InvoiceVariables): string {
    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    FACTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

N° de facture : ${vars.INVOICE_NUMBER}
Date : ${vars.INVOICE_DATE}

────────────────────────────────────────────────

DE :
${vars.MOSH_COMPANY_NAME}
${vars.MOSH_ADDRESS}
IDE : ${vars.MOSH_UID}
Email : ${vars.MOSH_EMAIL}

À :
${vars.CREATOR_FULL_NAME}
${vars.CREATOR_ADDRESS}
Email : ${vars.CREATOR_EMAIL}

────────────────────────────────────────────────

DÉSIGNATION DE LA PRESTATION

Mission : ${vars.MISSION_TITLE}
Référence : ${vars.MISSION_REF}
Client final : ${vars.BRAND_NAME}

${vars.DELIVERABLES_SUMMARY}

Date de livraison : ${vars.COMPLETION_DATE}

────────────────────────────────────────────────

DÉTAIL FINANCIER

Montant HT :                    CHF ${vars.AMOUNT_HT}
TVA (${vars.TVA_RATE}%) :                     CHF ${vars.TVA_AMOUNT}
                                ────────────────
TOTAL TTC :                     CHF ${vars.AMOUNT_TTC}

────────────────────────────────────────────────

CONDITIONS DE PAIEMENT

${vars.PAYMENT_TERMS}
Échéance : ${vars.PAYMENT_DUE_DATE}

────────────────────────────────────────────────

Merci pour votre collaboration.

${vars.MOSH_COMPANY_NAME}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Facture générée automatiquement par la plateforme MOSH — LGMA SA
`
}
