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

    return `1. Contexte & Objectif

Client / enseigne : ${client}

Contexte global :
${context}

Objectif de la vidéo :
${TODO}

Public cible :
${TODO}

DATE DE TOURNAGE : ${shooting}${campaign.shooting_date_fixed ? ' (date impérative)' : ''}
LIVRAISON : ${delivery}${campaign.delivery_date_fixed ? ' (date impérative)' : ''}


2. Stratégie & Concept Vidéo

➤ Angle & intention

Message clé :
${TODO}

Ton attendu :
${TODO}

➤ Concept de la vidéo

Idée globale :
${TODO}

➤ Structure recommandée

Hooks suggérés
- ${TODO}
- ${TODO}
- ${TODO}

Développement
Arrivée / mise en situation :
- ${TODO}

Plans suggérés :
- ${TODO}
- ${TODO}

Contenu suggéré :
« ${TODO} »

Climax / moment clé
- ${TODO}

Révélation + bénéfice
« ${TODO} »
👉 valoriser :
- ${TODO}

Call-to-action
- ${TODO}

➤ Cadre créatif

Do :
- ${TODO}

Don't :
- ${TODO}


3. Format & Contraintes Techniques

- ${format}
- Durée : ${TODO}
- Sous-titres obligatoires
- ${TODO}


4. Assets & Branding

Sous-titres :
- Police : ${TODO}
- Couleur : ${TODO}
- Ombre : ${TODO}


5. Notes

Points importants :
- ${TODO}
`
}
