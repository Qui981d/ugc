import type { Campaign } from '@/types/database'

/**
 * MOSH's house brief structure.
 *
 * Writers shouldn't retype the skeleton for every mission, so the editor starts
 * from this. Anything the campaign already knows (client, dates, format) is
 * filled in; the rest is left as an explicit blank to complete rather than
 * plausible-looking filler.
 */

const TODO = '…'

// The script is plain text everywhere it travels (editor, creator studio,
// contracts), so hierarchy has to come from typography rather than styling:
// a rule plus capitals for sections, an arrow and capitals for sub-sections.
const RULE = '─'.repeat(52)
const section = (n: number, label: string) => `${RULE}\n${n}. ${label.toUpperCase()}\n${RULE}`
const sub = (label: string) => `➤ ${label.toUpperCase()}`

const FORMAT_LABEL: Record<string, string> = {
    '9_16': '9:16 vertical',
    '1_1': '1:1 carré',
    '4_5': '4:5 portrait',
    '16_9': '16:9 horizontal',
}

function frDate(value?: string | null): string {
    if (!value) return TODO
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return TODO
    return d.toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function buildScriptTemplate(
    campaign: Pick<Campaign,
        'title' | 'client_name' | 'description' | 'product_name' | 'format'
        | 'shooting_date' | 'shooting_date_fixed' | 'deadline' | 'delivery_date_fixed'
    > & { brandName?: string | null },
    /** Per-content briefs written by the brand, if any. */
    contentBriefs: string[] = []
): string {
    const client = campaign.client_name || campaign.brandName || TODO
    const shooting = frDate(campaign.shooting_date)
    const delivery = frDate(campaign.deadline)
    const format = FORMAT_LABEL[campaign.format] || campaign.format || TODO

    const context = [campaign.description, ...contentBriefs].filter(Boolean).join('\n\n') || TODO

    return `${section(1, 'Contexte & objectif')}

Client / enseigne : ${client}

Contexte global :
${context}

Objectif de la vidéo :
${TODO}

Public cible :
${TODO}

DATE DE TOURNAGE : ${shooting}${campaign.shooting_date_fixed ? '  ⚠ IMPÉRATIVE' : ''}
LIVRAISON : ${delivery}${campaign.delivery_date_fixed ? '  ⚠ IMPÉRATIVE' : ''}


${section(2, 'Stratégie & concept vidéo')}

${sub('Angle & intention')}

Message clé :
${TODO}

Ton attendu :
${TODO}

${sub('Concept de la vidéo')}

Idée globale :
${TODO}

${sub('Structure recommandée')}

HOOKS SUGGÉRÉS
- ${TODO}
- ${TODO}
- ${TODO}

DÉVELOPPEMENT
Arrivée / mise en situation :
- ${TODO}

Plans suggérés :
- ${TODO}
- ${TODO}

Contenu suggéré :
« ${TODO} »

CLIMAX / MOMENT CLÉ
- ${TODO}

RÉVÉLATION + BÉNÉFICE
« ${TODO} »
👉 valoriser :
- ${TODO}

CALL-TO-ACTION
- ${TODO}

${sub('Cadre créatif')}

DO :
- ${TODO}

DON'T :
- ${TODO}


${section(3, 'Format & contraintes techniques')}

- ${format}
- Durée : ${TODO}
- Sous-titres obligatoires
- ${TODO}


${section(4, 'Assets & branding')}

Sous-titres :
- Police : ${TODO}
- Couleur : ${TODO}
- Ombre : ${TODO}


${section(5, 'Notes')}

POINTS IMPORTANTS :
- ${TODO}
`
}
