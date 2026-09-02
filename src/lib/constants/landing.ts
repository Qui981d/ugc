/**
 * Copy and assets for the two public landings.
 *
 * Everything the marketing brief specifies lives here rather than inside the
 * pages: logos, case studies and showreel videos are still to be supplied, and
 * they must be replaceable without touching layout code.
 *
 * Wording follows the briefs of 01.09.2026 as approved, including the funding
 * guarantees — those describe an intention the platform does not yet enforce.
 */

// ── Assets to supply ───────────────────────────────────────
// Drop the files in /public and list them here. Any list left empty renders a
// visible placeholder rather than an empty band, so a missing asset shows up
// on the page instead of silently disappearing.

export interface ClientLogo {
    name: string
    /** e.g. '/logos/aligro.svg' — empty until the file is supplied. */
    src?: string
}

export const CLIENT_LOGOS: ClientLogo[] = [
    { name: 'ALIGRO' },
    { name: 'net+ Léman' },
    { name: 'Ville de Nyon' },
    { name: 'MBC' },
    { name: 'Chubb Sicli' },
    { name: 'La Combe' },
]

export interface ShowreelItem {
    /** Vertical UGC video, muted autoplay. */
    src?: string
    poster?: string
    creator?: string
    brand?: string
}

/** Block 04 of the creator page. Real content only, per the brief. */
export const SHOWREEL: ShowreelItem[] = []

export interface CaseStudy {
    brand: string
    objective: string
    /** One of CASE_FILTERS. */
    category: string
    idea?: string
    formats?: string
    channels?: string
    result?: string
}

export const CASE_FILTERS = [
    'Lancement', 'Notoriété', 'Image', 'Considération', 'Conversion', 'Éditorial',
] as const

/** Block 06 of the brand page. */
export const CASE_STUDIES: CaseStudy[] = []


// ── Navigation ─────────────────────────────────────────────
// The toggle points at two real, indexable URLs — the brief is explicit that
// it must not merely swap content client-side.

export const AUDIENCE_TABS = [
    { label: 'Pour les marques', href: '/marques' },
    { label: 'Pour les créateurs', href: '/createurs' },
] as const


// ── Page: marques ──────────────────────────────────────────

export const BRAND_PAGE = {
    seo: {
        title: 'Plateforme UGC suisse pour les marques | MOSH',
        description:
            'MOSH transforme vos objectifs en campagnes UGC : stratégie créative, scripts, créateurs, production, validations et contenus prêts à diffuser.',
    },

    nav: [
        { label: 'Réalisations', href: '#realisations' },
        { label: 'Comment ça marche', href: '#methode' },
    ],
    ctaPrimary: { label: 'Lancer une campagne', href: '/signup?role=brand' },
    ctaSecondary: { label: 'Découvrir la plateforme', href: '#demonstration' },

    hero: {
        label: 'La plateforme UGC suisse pensée par une agence créative.',
        title: "On adore l'UGC. C'est justement pour ça qu'on a créé une plateforme pour arrêter d'en faire n'importe comment.",
        intro:
            "Vous nous donnez un objectif. On le transforme en campagne de contenu — de la stratégie créative aux contenus prêts à diffuser.",
        functional:
            'Concepts, scripts, créateurs, production et validations : tout est piloté au même endroit.',
    },

    proof: { title: 'Ils ont été assez fous pour nous faire confiance.' },

    demo: {
        title: 'Votre campagne. Du brief aux contenus. Au même endroit.',
        body:
            "Vous nous parlez de votre marque, de votre public et de ce que la campagne doit réellement accomplir. Nous construisons la stratégie créative, les concepts et les scripts, sélectionnons les bons créateurs, puis pilotons la production jusqu'aux contenus validés.",
        tabs: [
            { key: 'objectifs', label: 'Objectifs', caption: "Ce que la campagne doit accomplir, avant toute idée de format." },
            { key: 'strategie', label: 'Stratégie créative', caption: 'Les angles et les messages capables de servir cet objectif.' },
            { key: 'scripts', label: 'Concepts et scripts', caption: 'Chaque contenu a un rôle précis et une direction claire.' },
            { key: 'createurs', label: 'Créateurs', caption: "Sélectionnés pour leur univers et leur capacité à porter l'idée." },
            { key: 'production', label: 'Production', caption: 'Briefs, planning, fichiers et retours suivis au même endroit.' },
            { key: 'validations', label: 'Validations', caption: 'Chaque étape validée laisse une trace datée.' },
            { key: 'livres', label: 'Contenus livrés', caption: 'Contrôlés, validés et prêts à être activés.' },
        ],
    },

    problem: {
        title: "Faire de l'UGC, c'est facile. En faire une bonne campagne, beaucoup moins.",
        body:
            "Une vidéo verticale filmée au téléphone ne suffit pas. Il faut le bon message, la bonne idée, le bon créateur et un script qui laisse de la place à l'authenticité. Puis il faut encore gérer la sélection, les échanges, les fichiers, les retours, les validations et les droits.",
        conclusion: 'Tout ce qui peut devenir pénible est désormais organisé au même endroit.',
    },

    method: {
        label: "La méthode MOSH",
        title: 'On comprend vos objectifs business avant de vous proposer un créateur.',
        intro:
            "Parce qu'un bon créateur ne compensera jamais une campagne mal pensée. On définit d'abord ce que vous voulez obtenir, puis l'idée, les formats et les profils capables d'y arriver.",
        steps: [
            { title: 'Vos objectifs', body: "Lancer un produit, faire connaître une marque, expliquer une offre, susciter l'intérêt ou vendre." },
            { title: "L'idée créative", body: 'Nous définissons les angles, les messages et les formats capables de servir ces objectifs.' },
            { title: 'Les concepts et les scripts', body: 'Chaque contenu a un rôle précis, une direction claire et assez de liberté pour rester naturel.' },
            { title: 'Les créateurs', body: "Ils sont sélectionnés pour leur univers, leur ton et leur capacité à porter l'idée — pas simplement parce qu'ils sont disponibles." },
            { title: 'La production', body: 'Briefs, planning, fichiers, retours et validations sont suivis dans la plateforme.' },
            { title: 'La livraison', body: 'Des contenus contrôlés, validés et prêts à être activés. Pas simplement un dossier rempli de vidéos.' },
        ],
    },

    cases: {
        title: 'Un objectif. Plusieurs angles. Une vraie campagne de contenu.',
        body:
            "Nous ne pensons pas chaque vidéo séparément. Créateurs, messages et formats sont conçus pour fonctionner ensemble, répondre au même objectif et construire une campagne cohérente, prête à être activée dans la durée.",
        cta: 'Voir toutes les campagnes',
    },

    guarantee: {
        label: 'La garantie MOSH',
        title: 'Pas de contenu, pas de chocolat.',
        body:
            "Vous ne lancez pas une mission dans le vide. MOSH sélectionne des créateurs de confiance, cadre les livrables et les délais, puis suit la collaboration jusqu'à la livraison.",
        detail:
            'Le budget créateur est validé avant le démarrage de la mission. La marque sait ce qu\'elle va recevoir, le créateur sait ce qu\'il doit livrer et sa rémunération est garantie lorsque les conditions convenues sont remplies. Chacun respecte sa part. MOSH veille au reste.',
        steps: ['Brief et conditions', 'Planning', 'Production', 'Livraison', 'Retours', 'Validation', 'Suivi du paiement'],
    },

    automation: {
        title: 'La création reste humaine. Le reste peut aller beaucoup plus vite.',
        body:
            "La plateforme automatise ce qui ralentit les campagnes et peut utiliser l'IA pour assister la préparation, l'écriture ou les variations. La stratégie, les idées et les créateurs restent au centre.",
        // The brief conditions this block on the capability existing. Only the
        // two that ship today are listed.
        capabilities: [
            { label: 'Assistance au brief', body: "Le brief est relu automatiquement à l'envoi, et les éléments manquants sont signalés à la marque." },
            { label: 'Assistance au script', body: "L'écriture part d'une trame MOSH et peut être assistée, jamais générée à votre place." },
        ],
    },

    expertise: {
        label: 'Une plateforme imaginée par une agence créative.',
        title: "On n'a pas découvert l'UGC hier.",
        body:
            "Dix ans d'expérience en stratégie, création et production nous ont appris une chose : un contenu performant ne repose jamais uniquement sur la personne devant la caméra.",
        punch: 'La qualité est dans le process. Pas ajoutée à la fin.',
        pillars: ['Direction créative', 'Contrôle qualité', 'Cadre de production, droits et paiements'],
    },

    faq: [
        { q: 'Combien coûte une campagne UGC ?', a: "Le budget dépend du nombre de contenus, des formats, des profils, des droits d'utilisation et des canaux de diffusion. Nous construisons une recommandation adaptée après avoir compris votre objectif." },
        { q: 'Combien de temps faut-il prévoir ?', a: 'Le calendrier dépend du volume et de la complexité de la campagne. Les étapes et les dates sont cadrées avant le lancement.' },
        { q: 'Comment les créateurs sont-ils sélectionnés ?', a: "Selon leur univers, leurs compétences, leur fiabilité et leur capacité à porter l'idée créative de la campagne." },
        { q: 'Combien de retours sont prévus ?', a: 'Le nombre de révisions est défini avant le démarrage et intégré aux conditions de la mission.' },
        { q: "Les droits d'utilisation sont-ils inclus ?", a: 'Ils sont précisés pour chaque contenu : durée, territoires, canaux et éventuelle utilisation publicitaire.' },
        { q: 'Peut-on utiliser les contenus en publicité ?', a: "Oui, lorsque l'utilisation paid media est prévue dans les droits convenus pour la campagne." },
        { q: "Que se passe-t-il si une mission rencontre un problème ?", a: 'MOSH reste l\'interlocuteur central et prend en charge le suivi et la résolution selon les conditions définies avant le lancement.' },
    ],

    finalCta: {
        title: 'Vous avez un objectif. Nous, une assez bonne idée de la suite.',
        body: 'Parlez-nous de votre marque, de votre campagne et du résultat que vous cherchez.',
        primary: { label: 'Lancer une campagne', href: '/signup?role=brand' },
        secondary: { label: 'Voir les réalisations', href: '#realisations' },
    },
} as const


// ── Page: créateurs ────────────────────────────────────────

export const CREATOR_PAGE = {
    seo: {
        title: 'Plateforme UGC pour les créateurs en Suisse | MOSH',
        description:
            'Rejoins MOSH pour accéder à des campagnes préparées par une agence et gérer tes briefs, contenus, contrats, retours et paiements au même endroit.',
    },

    nav: [{ label: 'Comment ça marche', href: '#comment' }],
    ctaPrimary: { label: 'Rejoindre la plateforme', href: '/signup?role=creator' },
    ctaSecondary: { label: 'Découvrir comment ça marche', href: '#comment' },

    hero: {
        label: 'La plateforme UGC suisse pour les créateurs.',
        title: 'On voulait de meilleurs contenus. Alors on a simplifié la vie de ceux qui les créent.',
        intro: 'Des campagnes préparées par une agence. Toute leur gestion réunie sur une seule plateforme.',
        reassurance: ['Inscription gratuite', 'Missions financées avant démarrage', 'Libre d\'accepter chaque mission'],
    },

    demo: {
        title: 'Toute ta campagne. Au même endroit.',
        body: 'Tes opportunités, tes campagnes, tes livrables, tes contrats et tes paiements sont réunis dans un seul espace.',
        tabs: [
            { key: 'dashboard', label: 'Tableau de bord', items: ['Actions à réaliser', 'Prochaine échéance', 'Campagnes en cours', 'Paiement attendu'] },
            { key: 'opportunites', label: 'Opportunités', items: ['Marque', 'Mission', 'Rémunération', 'Dates', 'Accepter ou refuser'] },
            { key: 'campagne', label: 'Campagne', items: ['Brief', 'Script', 'Planning', 'Livrables', 'Retours', 'Validation'] },
            { key: 'paiements', label: 'Contrats et paiements', items: ['Contrats signés', 'Factures', 'Paiements prévus', 'Paiements effectués'] },
        ],
    },

    proof: { title: 'Des marques qui donnent envie de créer.' },

    showreel: { title: 'De superbes collaborations' },

    agency: {
        title: 'Un brief complet. Dès le départ.',
        body: "Avant chaque mission, l'équipe travaille avec la marque sur l'objectif, le concept, le script, les livrables, le planning et les droits.",
        detail: 'Tu sais ce que tu dois créer, pourquoi tu le crées et quand le livrer. Les échanges et les retours passent par MOSH.',
        sequence: ['Objectif', 'Concept', 'Brief', 'Script', 'Contenu'],
    },

    benefits: {
        title: 'Moins de gestion. Plus de temps pour créer.',
        items: [
            'Des propositions adaptées à ton profil et à tes disponibilités.',
            'Un seul espace et un seul interlocuteur pour avancer.',
            'Un budget validé avant chaque mission, pour sécuriser ta rémunération.',
            'Un cadre clair qui te laisse te concentrer sur la création.',
            'Une relation construite dans la durée, avec de nouvelles propositions lorsqu\'un projet correspond à ton univers.',
        ],
    },

    how: {
        title: 'Comment ça marche ?',
        steps: [
            { title: 'Rejoins la plateforme', body: 'Présente ton univers, tes compétences et tes contenus.' },
            { title: 'Reçois une proposition', body: 'Retrouve la mission, la rémunération, les délais et les droits avant de décider.' },
            { title: 'Crée', body: 'Travaille avec un brief et un script clairs, puis suis les étapes dans ton espace.' },
            { title: 'Livre et suis ton paiement', body: 'Dépose tes contenus, centralise les retours et suis le statut de ta facture et de ton paiement.' },
        ],
    },

    guarantee: {
        label: 'La garantie MOSH',
        title: 'Pas de budget, pas de mission.',
        body: "Une campagne ne démarre pas tant que son budget n'a pas été validé avec la marque. Tu connais ta rémunération, tes livrables, tes délais et les conditions de la mission avant de l'accepter.",
        detail: 'Lorsque tu remplis les conditions convenues et que tes contenus sont livrés puis validés, ta rémunération est garantie par MOSH.',
        listTitle: 'Tout est clair avant de commencer',
        items: ['les livrables attendus', 'les formats', 'les dates', 'la rémunération totale', 'le nombre de retours inclus', "les droits d'utilisation", "les éventuelles conditions de publication ou d'exclusivité"],
        closing: 'Tu peux poser tes questions, accepter ou refuser la mission. MOSH reste ton interlocuteur jusqu\'au paiement.',
    },

    faq: [
        { q: "Faut-il avoir beaucoup d'abonnés ?", a: 'Non pour les missions de production UGC. Certaines campagnes avec publication peuvent toutefois demander des critères spécifiques.' },
        { q: "Est-ce que l'inscription garantit des missions ?", a: 'Non. Les propositions dépendent des besoins des marques et de la correspondance avec ton profil.' },
        { q: 'Puis-je refuser une mission ?', a: 'Oui. Tu restes libre d\'accepter ou de refuser chaque proposition.' },
        { q: 'Est-ce que je connais la rémunération avant d\'accepter ?', a: 'Oui. Le montant et les conditions de la mission sont présentés avant ton accord.' },
        { q: 'Est-ce que je dois échanger directement avec la marque ?', a: 'MOSH centralise la collaboration et reste ton interlocuteur pendant la campagne.' },
        { q: 'Dois-je publier le contenu sur mes réseaux ?', a: 'Uniquement si la mission le prévoit explicitement.' },
        { q: 'Comment mon paiement est-il garanti ?', a: 'MOSH valide le budget avec la marque avant que ta mission commence. Lorsque les livrables convenus sont remis et validés, ta rémunération est assurée selon les conditions et le délai prévus.' },
        { q: 'Où retrouver mes contrats et mes paiements ?', a: 'Dans ton espace créateur, avec tes campagnes et tes documents.' },
    ],

    finalCta: {
        title: 'Rejoins la plateforme.',
        body: 'Crée ton profil et accède aux campagnes qui correspondent à ton univers.',
        primary: { label: 'Rejoindre la plateforme', href: '/signup?role=creator' },
        secondary: { label: 'Se connecter', href: '/login' },
        reassurance: ['Gratuit', 'Sans exclusivité générale', "Aucune obligation d'accepter une mission"],
    },
} as const
