// ============================================================
// What a ClickUp card actually says (no secrets — safe to import anywhere)
// ============================================================

import { CLICKUP_SUBTASKS } from './mapping'

/**
 * ClickUp cards used to carry a single loose paragraph, so anyone working from
 * ClickUp had to open the platform to learn anything. These builders put the
 * material where the work happens: the brief on the parent card, the script in
 * the writing subtask, the creator and contract in the production subtask, the
 * video in the delivery subtask.
 *
 * Rebuilt from scratch on every sync rather than appended to, so a card can
 * never hold two versions of the same script.
 *
 * Plain text, not markdown: ClickUp's markdown field behaves differently
 * between create and update, and a broken card is worse than an unstyled one.
 * Uppercase headings and rules follow the house script template.
 */

const RULE = '─'.repeat(46)

/** A titled block, dropped entirely when it has nothing to say. */
function section(title: string, body: string | null | undefined): string | null {
    const text = (body || '').trim()
    if (!text) return null
    return `${title.toUpperCase()}\n${RULE}\n${text}`
}

/** `Label : value` lines, skipping the ones with no value. */
function facts(pairs: [string, string | null | undefined][]): string | null {
    const lines = pairs
        .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
        .map(([k, v]) => `${k} : ${v}`)
    return lines.length ? lines.join('\n') : null
}

const join = (parts: (string | null)[]): string =>
    parts.filter(Boolean).join('\n\n\n')

const chf = (n: number | null | undefined): string | null =>
    n === null || n === undefined ? null : `CHF ${n.toLocaleString('fr-CH')}`

const date = (d: string | null | undefined): string | null => {
    if (!d) return null
    const parsed = new Date(d)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString('fr-CH')
}

/** Everything the builders may use. Loaded once by the caller, per mission. */
export interface ClickUpMissionData {
    title: string
    clientLabel: string
    description?: string | null
    /** The long-form brief the brand writes — the part MOSH actually works from. */
    detailedDescription?: string | null
    productName?: string | null
    productDescription?: string | null
    productRequiresShipping?: boolean
    format?: string | null
    scriptType?: string | null
    scriptNotes?: string | null
    scriptContent?: string | null
    scriptStatus?: string | null
    briefImageUrls?: string[]
    budgetChf?: number | null
    creatorAmountChf?: number | null
    deadline?: string | null
    shootingDate?: string | null
    shootingDateFixed?: boolean
    deliveryDateFixed?: boolean
    isAds?: boolean
    creatorName?: string | null
    creatorEmail?: string | null
    contractStatus?: string | null
    contractSignedAt?: string | null
    videoUrl?: string | null
    videoUploadedAt?: string | null
    qcApprovedAt?: string | null
    brandFinalApprovedAt?: string | null
    /** Plain-language rights lines, from summarizeRights(). */
    rightsLines?: { label: string; value: string }[]
    missionUrl?: string | null
    /**
     * Per-video rows. A campaign can order several videos, each with its own
     * detailed description, script, creator and file — that detail is the
     * brief, so it cannot be flattened into the campaign-level fields.
     */
    contents?: ClickUpContentData[]
}

export interface ClickUpContentData {
    label: string
    format?: string | null
    scriptType?: string | null
    description?: string | null
    scriptContent?: string | null
    creatorName?: string | null
    creatorAmountChf?: number | null
    contractStatus?: string | null
    videoUrl?: string | null
    videoUploadedAt?: string | null
}

/** Renders per-video blocks, picking one field out of each row. */
function perContent(
    contents: ClickUpContentData[] | undefined,
    pick: (c: ClickUpContentData) => string | null,
): string | null {
    if (!contents?.length) return null
    const blocks = contents
        .map(c => {
            const body = pick(c)
            return body ? `▸ ${c.label}\n${body}` : null
        })
        .filter(Boolean)
    return blocks.length ? blocks.join('\n\n') : null
}

/** The parent card: the brief, in full. */
export function buildMissionDescription(d: ClickUpMissionData): string {
    const dates = facts([
        ['Tournage', date(d.shootingDate) ? `${date(d.shootingDate)}${d.shootingDateFixed ? ' (date fixe)' : ''}` : null],
        ['Livraison', date(d.deadline) ? `${date(d.deadline)}${d.deliveryDateFixed ? ' (date fixe)' : ''}` : null],
    ])

    return join([
        facts([
            ['Client', d.clientLabel],
            ['Mission', d.title],
            ['Format', d.format],
            ['Type de script', d.scriptType],
            ['Usage', d.isAds === undefined ? null : d.isAds ? 'Publicité (ads)' : 'Organique'],
            ['Budget', chf(d.budgetChf)],
            ['Rémunération créateur', chf(d.creatorAmountChf)],
        ]),
        dates ? `DATES\n${RULE}\n${dates}` : null,
        section('Description', d.description),
        section('Brief détaillé', d.detailedDescription),
        section('Produit', facts([
            ['Nom', d.productName],
            ['Envoi au créateur', d.productRequiresShipping === undefined ? null : d.productRequiresShipping ? 'Oui' : 'Non'],
        ])),
        section('Description du produit', d.productDescription),
        section('Notes de script', d.scriptNotes),
        section('Contenus commandés', perContent(d.contents, c => facts([
            ['Format', c.format],
            ['Type', c.scriptType],
            ['Créateur', c.creatorName],
        ]))),
        section('Brief par vidéo', perContent(d.contents, c => c.description || null)),
        d.rightsLines?.length
            ? section('Droits accordés', d.rightsLines.map(l => `${l.label} : ${l.value}`).join('\n'))
            : null,
        d.briefImageUrls?.length
            ? section('Visuels du brief', d.briefImageUrls.join('\n'))
            : null,
        d.missionUrl ? section('Suivi', d.missionUrl) : null,
    ]) || 'Brief à compléter sur la plateforme MOSH.'
}

/**
 * One description per subtask, keyed by the names in CLICKUP_SUBTASKS.
 *
 * A subtask with nothing to show says so, rather than staying blank — an empty
 * card reads as an integration failure, not as work that has not happened yet.
 */
export function buildSubtaskDescriptions(d: ClickUpMissionData): Record<string, string> {
    const [WRITING, PRODUCTION, DELIVERY] = CLICKUP_SUBTASKS

    const script = join([
        facts([
            ['Type de script', d.scriptType],
            ['Format', d.format],
            ['Statut', d.scriptStatus],
        ]),
        section('Notes de cadrage', d.scriptNotes),
        section('Brief détaillé', d.detailedDescription),
        section('Script', d.scriptContent),
        section('Scripts par vidéo', perContent(d.contents, c => c.scriptContent || null)),
    ]) || 'Script pas encore rédigé.'

    const production = join([
        facts([
            ['Créateur', d.creatorName],
            ['Contact', d.creatorEmail],
            ['Rémunération', chf(d.creatorAmountChf)],
            ['Contrat', d.contractStatus],
            ['Signé le', date(d.contractSignedAt)],
            ['Tournage', date(d.shootingDate) ? `${date(d.shootingDate)}${d.shootingDateFixed ? ' (date fixe)' : ''}` : null],
        ]),
        section('Produit à envoyer', d.productRequiresShipping ? (d.productName || 'Oui') : null),
        section('Créateurs par vidéo', perContent(d.contents, c => facts([
            ['Créateur', c.creatorName],
            ['Rémunération', c.creatorAmountChf === null || c.creatorAmountChf === undefined
                ? null : `CHF ${c.creatorAmountChf.toLocaleString('fr-CH')}`],
            ['Contrat', c.contractStatus],
        ]))),
    ]) || 'Créateur pas encore assigné.'

    const delivery = join([
        facts([
            ['Livraison attendue', date(d.deadline)],
            ['Vidéo livrée le', date(d.videoUploadedAt)],
            ['Contrôle qualité MOSH', date(d.qcApprovedAt)],
            ['Validation client', date(d.brandFinalApprovedAt)],
        ]),
        d.videoUrl ? section('Vidéo', d.videoUrl) : null,
        section('Vidéos par contenu', perContent(d.contents, c => c.videoUrl || null)),
    ]) || 'Vidéo pas encore livrée.'

    return { [WRITING]: script, [PRODUCTION]: production, [DELIVERY]: delivery }
}
