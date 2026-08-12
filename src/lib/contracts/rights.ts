/**
 * What the client may do with a video, and for how long.
 *
 * One object per mission, and it is the ONLY source for three surfaces: the
 * plain-language summary the creator reads before accepting, the clauses in
 * the contract, and what MOSH may resell to the brand. Writing those three
 * separately is how a platform ends up promising "six months of ads" on
 * screen while the PDF says something else.
 *
 * Model taken from the Mosh UGC contract pack (README §5). The wording of the
 * generated clauses is pending review by a Swiss lawyer.
 */

export interface MissionRights {
    /** Free use on the brand's own channels. Included in every standard mission. */
    organic: {
        enabled: boolean
        /** Exclusive on the commissioned final content — not on the creator's craft. */
        licenseType: 'exclusive' | 'non_exclusive'
        territory: 'worldwide' | string
        duration: 'unlimited' | 'limited'
        sublicenseToClient: boolean
        /** May the creator show it in their own portfolio, and from when. */
        portfolioPermission: 'not_allowed' | 'after_release' | 'with_mosh_approval' | 'allowed'
    }

    /** Paid advertising. Six months included; anything beyond is sold separately. */
    paid: {
        enabled: boolean
        durationMonths: number
        /**
         * The clock starts at the first ad, not at delivery — otherwise a
         * campaign that launches late silently eats the creator's window.
         */
        startEvent: 'first_paid_publication'
        /** Without this, an unused right would hang over the creator forever. */
        activationLongstopMonths: number
        shutdownGraceDays: number
        territory: 'worldwide' | string
        channels: string[]
    }

    /** Editing the delivered file. Included; the creator keeps their moral rights. */
    adaptation: {
        edit: boolean
        cropResize: boolean
        shortVersions: boolean
        subtitles: boolean
        translation: boolean
        dubbing: boolean
        textLogoCta: boolean
        extractStills: boolean
    }

    /** The creator posts to their own audience. Never included by default. */
    creatorPosting: {
        enabled: boolean
        accounts: string[]
        minimumLiveDays: number | null
        feeChf: number | null
    }

    /** The brand advertises through the creator's account (Spark Ads, Partnership Ads). */
    whitelisting: {
        enabled: boolean
        mechanism: string | null
        durationMonths: number | null
        feeChf: number | null
    }

    /** The creator declines competing work in a category for a while. */
    exclusivity: {
        enabled: boolean
        category: string | null
        durationMonths: number | null
        territory: string | null
        feeChf: number | null
    }

    /** Everything off unless separately consented to and paid for. */
    ai: {
        productionAssistance: boolean
        translationOrDubbing: boolean
        modelTraining: boolean
        voiceClone: boolean
        syntheticReplica: boolean
    }
}

/** The standard UGC mission: organic unlimited, six months of paid, nothing else. */
export const DEFAULT_MISSION_RIGHTS: MissionRights = {
    organic: {
        enabled: true,
        licenseType: 'exclusive',
        territory: 'worldwide',
        duration: 'unlimited',
        sublicenseToClient: true,
        portfolioPermission: 'with_mosh_approval',
    },
    paid: {
        enabled: true,
        durationMonths: 6,
        startEvent: 'first_paid_publication',
        activationLongstopMonths: 12,
        shutdownGraceDays: 5,
        territory: 'worldwide',
        channels: ['Meta', 'TikTok', 'YouTube', 'display'],
    },
    adaptation: {
        edit: true,
        cropResize: true,
        shortVersions: true,
        subtitles: true,
        translation: true,
        dubbing: false,
        textLogoCta: true,
        extractStills: true,
    },
    creatorPosting: { enabled: false, accounts: [], minimumLiveDays: null, feeChf: null },
    whitelisting: { enabled: false, mechanism: null, durationMonths: null, feeChf: null },
    exclusivity: { enabled: false, category: null, durationMonths: null, territory: null, feeChf: null },
    ai: {
        productionAssistance: true,
        translationOrDubbing: false,
        modelTraining: false,
        voiceClone: false,
        syntheticReplica: false,
    },
}

/**
 * Stored rights may predate a field. Merging over the default keeps an old
 * mission readable instead of crashing on a missing key.
 */
export function parseMissionRights(stored: unknown): MissionRights {
    if (!stored || typeof stored !== 'object') return DEFAULT_MISSION_RIGHTS
    const s = stored as Partial<MissionRights>
    const d = DEFAULT_MISSION_RIGHTS
    return {
        organic: { ...d.organic, ...(s.organic || {}) },
        paid: { ...d.paid, ...(s.paid || {}) },
        adaptation: { ...d.adaptation, ...(s.adaptation || {}) },
        creatorPosting: { ...d.creatorPosting, ...(s.creatorPosting || {}) },
        whitelisting: { ...d.whitelisting, ...(s.whitelisting || {}) },
        exclusivity: { ...d.exclusivity, ...(s.exclusivity || {}) },
        ai: { ...d.ai, ...(s.ai || {}) },
    }
}

export interface RightsSummaryLine {
    label: string
    value: string
    /** `included` is covered by the price; `extra` is a paid option; `excluded` is a no. */
    tone: 'included' | 'extra' | 'excluded'
}

/**
 * The creator-facing summary.
 *
 * Excluded options are listed rather than hidden: "we are not asking for your
 * account" is reassuring, and silence on the point is not.
 */
export function summarizeRights(r: MissionRights): RightsSummaryLine[] {
    const lines: RightsSummaryLine[] = []

    lines.push({
        label: 'Diffusion sur les canaux de la marque',
        value: r.organic.enabled
            ? `Incluse, sans limite de durée${r.organic.territory === 'worldwide' ? ', dans le monde entier' : ''}`
            : 'Non incluse',
        tone: r.organic.enabled ? 'included' : 'excluded',
    })

    lines.push({
        label: 'Publicité payante',
        value: r.paid.enabled
            ? `${r.paid.durationMonths} mois, à compter de la première diffusion publicitaire`
            : 'Non incluse',
        tone: r.paid.enabled ? 'included' : 'excluded',
    })

    lines.push({
        label: 'Montage et adaptations',
        value: 'Recadrage, sous-titres, versions courtes, traduction',
        tone: 'included',
    })

    lines.push({
        label: 'Publication sur ton compte',
        value: r.creatorPosting.enabled
            ? [
                r.creatorPosting.accounts.length ? r.creatorPosting.accounts.join(', ') : 'Comptes à préciser',
                r.creatorPosting.minimumLiveDays ? `${r.creatorPosting.minimumLiveDays} jours minimum en ligne` : null,
                r.creatorPosting.feeChf ? `${r.creatorPosting.feeChf} CHF` : null,
            ].filter(Boolean).join(' · ')
            : 'Non demandée',
        tone: r.creatorPosting.enabled ? 'extra' : 'excluded',
    })

    lines.push({
        label: 'Publicité depuis ton compte',
        value: r.whitelisting.enabled
            ? [
                r.whitelisting.mechanism,
                r.whitelisting.durationMonths ? `${r.whitelisting.durationMonths} mois` : null,
                r.whitelisting.feeChf ? `${r.whitelisting.feeChf} CHF` : null,
            ].filter(Boolean).join(' · ')
            : 'Non demandée',
        tone: r.whitelisting.enabled ? 'extra' : 'excluded',
    })

    lines.push({
        label: 'Exclusivité',
        value: r.exclusivity.enabled
            ? [
                r.exclusivity.category,
                r.exclusivity.durationMonths ? `${r.exclusivity.durationMonths} mois` : null,
                r.exclusivity.feeChf ? `${r.exclusivity.feeChf} CHF` : null,
            ].filter(Boolean).join(' · ')
            : 'Aucune',
        tone: r.exclusivity.enabled ? 'extra' : 'excluded',
    })

    const aiOn = r.ai.modelTraining || r.ai.voiceClone || r.ai.syntheticReplica
    lines.push({
        label: 'Voix ou avatar générés par IA',
        value: aiOn ? 'Autorisé, avec accord distinct' : 'Non autorisé',
        tone: aiOn ? 'extra' : 'excluded',
    })

    return lines
}

/** Options the creator is paid extra for — used to justify the total. */
export function paidOptionsTotal(r: MissionRights): number {
    return (r.creatorPosting.feeChf || 0) + (r.whitelisting.feeChf || 0) + (r.exclusivity.feeChf || 0)
}

const bullet = (s: string) => `• ${s}`

/**
 * The contract clauses, built from the same object as the summary above.
 * Disabled blocks are stated as excluded rather than omitted — an unmentioned
 * right is the kind of ambiguity that gets argued about later.
 */
export function renderRightsClauses(r: MissionRights): string {
    const parts: string[] = []

    parts.push(`ARTICLE 7 — DROITS D'EXPLOITATION DES CONTENUS

7.1. Nature de la concession
Le Créateur conserve la propriété de ses éléments préexistants et concède à MOSH une licence ${r.organic.licenseType === 'exclusive' ? 'exclusive' : 'non exclusive'} d'exploitation des Contenus finaux commandés, pour les seuls usages décrits ci-dessous. MOSH est autorisé à sous-licencier ces droits au client final${r.organic.sublicenseToClient ? ' ainsi qu\'aux prestataires nécessaires à leur exploitation' : ''}.

7.2. Diffusion organique digitale
${r.organic.enabled
            ? `Les Contenus peuvent être exploités sans limite commerciale de durée${r.organic.territory === 'worldwide' ? ', dans le monde entier' : `, sur le territoire suivant : ${r.organic.territory}`}, sur les canaux digitaux de MOSH et du client : sites, e-commerce, réseaux sociaux, e-mails, CRM, présentations et communications digitales. L'archivage et la conservation à titre de preuve ne sont pas limités dans le temps.`
            : `Aucune exploitation organique n'est concédée au titre du présent Protocole.`}

7.3. Publicité digitale payante
${r.paid.enabled
            ? `Les Contenus peuvent être diffusés en publicité digitale payante pendant ${r.paid.durationMonths} mois à compter de la première diffusion publicitaire, sur ${r.paid.channels.join(', ')}${r.paid.territory === 'worldwide' ? ', dans le monde entier' : `, sur le territoire suivant : ${r.paid.territory}`}.

MOSH enregistre la date de première diffusion. Celle-ci doit intervenir au plus tard ${r.paid.activationLongstopMonths} mois après la validation finale des Contenus ; à défaut de date enregistrée, la période de ${r.paid.durationMonths} mois débute automatiquement au terme de ce délai. Les campagnes encore actives sont arrêtées au plus tard ${r.paid.shutdownGraceDays} jours ouvrables après l'expiration.

Ce droit couvre les campagnes diffusées depuis les comptes de MOSH ou du client. Il ne comprend pas l'exploitation depuis le compte ou l'identité publicitaire du Créateur.`
            : `Aucune diffusion publicitaire payante n'est concédée au titre du présent Protocole.`}

7.4. Adaptations autorisées
${[
            r.adaptation.edit && 'montage',
            r.adaptation.cropResize && 'recadrage et changement de format',
            r.adaptation.shortVersions && 'versions courtes',
            r.adaptation.subtitles && 'sous-titrage',
            r.adaptation.translation && 'traduction',
            r.adaptation.dubbing && 'doublage',
            r.adaptation.textLogoCta && 'insertion de textes, logos et appels à l\'action',
            r.adaptation.extractStills && 'extraction d\'images fixes',
        ].filter(Boolean).join(', ')}.

Ces adaptations ne peuvent porter une atteinte grave à la personnalité du Créateur ni dénaturer illicitement sa contribution.

7.5. Utilisation en portfolio
${{
            not_allowed: 'Le Créateur ne peut pas présenter les Contenus dans son portfolio.',
            after_release: 'Le Créateur peut présenter les Contenus dans son portfolio après leur publication par la marque.',
            with_mosh_approval: 'Le Créateur peut présenter les Contenus dans son portfolio après accord écrit de MOSH.',
            allowed: 'Le Créateur peut librement présenter les Contenus dans son portfolio.',
        }[r.organic.portfolioPermission]}

Le Créateur ne réutilise pas commercialement les Contenus finaux brandés pour un tiers.`)

    parts.push(`ARTICLE 7 bis — DROITS NON COMPRIS ET OPTIONS

Sauf mention expresse ci-dessous, ne sont PAS compris dans la rémunération : la publication sur les comptes du Créateur, la publicité depuis son compte, l'exclusivité sectorielle, les fichiers sources, les supports non digitaux et tout usage d'intelligence artificielle générative.

${bullet(`Publication sur les comptes du Créateur : ${r.creatorPosting.enabled
        ? `OUI — ${r.creatorPosting.accounts.join(', ') || 'comptes précisés au brief'}${r.creatorPosting.minimumLiveDays ? `, maintien en ligne ${r.creatorPosting.minimumLiveDays} jours minimum` : ''}${r.creatorPosting.feeChf ? `, rémunération ${r.creatorPosting.feeChf} CHF` : ''}. Le Créateur ne retire ni ne modifie la publication sans accord écrit de MOSH, sauf obligation légale ou décision de plateforme.`
        : 'NON'}`)}
${bullet(`Publicité depuis le compte du Créateur : ${r.whitelisting.enabled
        ? `OUI — ${r.whitelisting.mechanism || 'mécanisme précisé au brief'}${r.whitelisting.durationMonths ? `, ${r.whitelisting.durationMonths} mois` : ''}${r.whitelisting.feeChf ? `, rémunération ${r.whitelisting.feeChf} CHF` : ''}. Le Créateur fournit et maintient l'autorisation technique sans communiquer son mot de passe.`
        : 'NON'}`)}
${bullet(`Exclusivité : ${r.exclusivity.enabled
        ? `OUI — ${r.exclusivity.category || 'catégorie précisée au brief'}${r.exclusivity.durationMonths ? `, ${r.exclusivity.durationMonths} mois` : ''}${r.exclusivity.territory ? `, ${r.exclusivity.territory}` : ''}${r.exclusivity.feeChf ? `, rémunération ${r.exclusivity.feeChf} CHF` : ''}.`
        : 'NON'}`)}
${bullet(`Clonage de voix, avatar ou réplique synthétique : ${r.ai.voiceClone || r.ai.syntheticReplica ? 'OUI, avec consentement distinct' : 'NON'}`)}
${bullet(`Entraînement de modèle d'intelligence artificielle : ${r.ai.modelTraining ? 'OUI, avec consentement distinct' : 'NON'}`)}`)

    return parts.join('\n\n\n')
}
