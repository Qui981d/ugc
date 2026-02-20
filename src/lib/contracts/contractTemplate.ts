// ================================================
// MOSH (LGMA SA) ↔ CRÉATEUR — Contract Template
// Legal framework: Swiss Code of Obligations (CO art. 394 ss)
// ================================================

export interface ContractVariables {
    CONTRACT_ID: string
    CONTRACT_DATE: string

    // MOSH (Mandant)
    MOSH_COMPANY_NAME: string
    MOSH_ADDRESS: string
    MOSH_UID: string
    MOSH_EMAIL: string

    // Creator (Mandataire)
    CREATOR_FULL_NAME: string
    CREATOR_ADDRESS: string
    CREATOR_EMAIL: string

    // Mission details
    MISSION_TITLE: string
    MISSION_DESCRIPTION: string
    BRAND_NAME: string
    DELIVERABLES: string
    FORMAT: string
    SCRIPT_TYPE: string
    DEADLINE: string
    REVISION_COUNT: string

    // Payment
    AMOUNT_CHF: string
    AMOUNT_HT: string
    TVA_AMOUNT: string
    TVA_RATE: string
    PAYMENT_TERMS: string

    // Signatures
    MOSH_ACCEPTANCE_TIMESTAMP: string
    CREATOR_ACCEPTANCE_TIMESTAMP: string
    CREATOR_IP_ADDRESS: string
}

// Default MOSH company information
export const MOSH_COMPANY_INFO = {
    name: 'LGMA SA — Agence Mosh',
    address: 'Lausanne, Suisse',
    uid: 'CHE-XXX.XXX.XXX',
    email: 'contact@agencemosh.ch',
    tvaRate: 8.1,
}

export function generateMoshContractText(vars: ContractVariables): string {
    return `CONTRAT DE MANDAT POUR CRÉATION DE CONTENU NUMÉRIQUE (UGC)
Conforme au Code des Obligations suisse (art. 394 ss CO)

ID DU CONTRAT : ${vars.CONTRACT_ID}
DATE DE GÉNÉRATION : ${vars.CONTRACT_DATE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 1 — DÉSIGNATION DES PARTIES

Le présent contrat est conclu entre :

Le Mandant :
${vars.MOSH_COMPANY_NAME}
Siège : ${vars.MOSH_ADDRESS}
IDE : ${vars.MOSH_UID}
Email : ${vars.MOSH_EMAIL}
Ci-après le « Mandant » ou « MOSH »

Le Mandataire :
${vars.CREATOR_FULL_NAME}
Domicile : ${vars.CREATOR_ADDRESS}
Email : ${vars.CREATOR_EMAIL}
Ci-après le « Mandataire » ou le « Créateur »


ARTICLE 2 — OBJET DU MANDAT

MOSH confie au Créateur, qui l'accepte, le mandat de créer et livrer des contenus numériques originaux (ci-après les « Contenus ») dans le cadre de la mission « ${vars.MISSION_TITLE} ». Cette mission est réalisée pour le compte d'un client final de MOSH (ci-après la « Marque » : ${vars.BRAND_NAME}), avec lequel le Créateur n'entretient aucun lien contractuel direct.

La nature de la prestation relève du mandat au sens des articles 394 ss du Code des obligations suisse. Le Créateur s'engage à exécuter sa mission avec toute la diligence requise et conformément au brief créatif transmis par MOSH.


ARTICLE 3 — MISSIONS ET LIVRABLES

3.1. Description de la mission
Le Créateur s'engage à réaliser les prestations décrites dans le brief suivant :
${vars.MISSION_DESCRIPTION}

3.2. Spécifications techniques
• Format vidéo : ${vars.FORMAT}
• Type de contenu : ${vars.SCRIPT_TYPE}

3.3. Liste des livrables
Le Créateur doit fournir les éléments suivants :
${vars.DELIVERABLES}

3.4. Délais
L'intégralité des Contenus doit être soumise à MOSH pour validation via la plateforme au plus tard le ${vars.DEADLINE}. Le respect de ce délai est une condition essentielle du mandat.


ARTICLE 4 — OBLIGATIONS DES PARTIES

4.1. Obligations du Créateur
• Qualité : Le Créateur garantit une qualité de production conforme aux standards professionnels (résolution min. 1080p, éclairage adéquat, clarté sonore).
• Indépendance : Le Créateur exécute son mandat de manière autonome. Il est seul responsable de ses assurances sociales et de ses obligations fiscales en tant qu'indépendant en Suisse.
• Confidentialité : Le Créateur s'interdit de divulguer l'identité de la Marque ou tout détail du brief avant la publication officielle des contenus.
• Exclusivité mission : Le Créateur s'interdit de produire du contenu similaire pour un concurrent direct de la Marque pendant la durée de la mission et les 30 jours suivants.

4.2. Obligations de MOSH
• Brief : MOSH s'engage à fournir un brief créatif clair et complet, ainsi que tout matériel nécessaire (produits, logos, accès).
• Feedback : MOSH examinera les livrables dans un délai raisonnable (5 jours ouvrables) et formulera ses demandes de révision via la plateforme.
• Paiement : MOSH s'engage à régler la rémunération selon les modalités prévues à l'article 5.


ARTICLE 5 — RÉMUNÉRATION ET PAIEMENT

5.1. Honoraires
En contrepartie de ses services et de la cession des droits, le Créateur percevra la rémunération suivante :

• Montant HT : ${vars.AMOUNT_HT} CHF
• TVA (${vars.TVA_RATE}%) : ${vars.TVA_AMOUNT} CHF
• Montant TTC : ${vars.AMOUNT_CHF} CHF

Ce montant est ferme et définitif pour la mission décrite, incluant tous les frais engagés par le Créateur (déplacement, matériel, post-production).

5.2. Modalités de paiement
${vars.PAYMENT_TERMS}


ARTICLE 6 — RÉVISIONS ET VALIDATION

Le Créateur inclut ${vars.REVISION_COUNT} révision(s) dans son tarif initial. Toute demande de révision supplémentaire devra faire l'objet d'un accord financier séparé entre MOSH et le Créateur. La validation est réputée acquise si MOSH n'émet aucune réserve dans les 5 jours ouvrables suivant la livraison.


ARTICLE 7 — CESSION DES DROITS DE PROPRIÉTÉ INTELLECTUELLE

Le Créateur cède à MOSH l'intégralité des droits patrimoniaux sur les Contenus créés, MOSH étant autorisé à les transmettre à la Marque.

• Étendue : Droit de reproduction, de représentation, de modification et d'adaptation.
• Supports : Réseaux sociaux (TikTok, Instagram, YouTube, Facebook, etc.), sites web, et utilisation publicitaire payante (Ads).
• Exclusivité : La présente cession est exclusive pendant la durée de la campagne, puis non-exclusive.
• Durée : La cession est consentie pour une durée illimitée (sous réserve de la durée légale de protection du droit d'auteur en Suisse, LDA).
• Territoire : La cession est valable pour le monde entier.


ARTICLE 8 — DROIT À L'IMAGE (ART. 28 CC)

Le Créateur autorise expressément MOSH et la Marque à fixer, reproduire et diffuser son image et sa voix intégrées dans les Contenus livrés, conformément à l'article 28 du Code civil suisse. Cette autorisation est accordée pour les mêmes supports, durées et territoires que ceux définis à l'article 7.


ARTICLE 9 — GARANTIE D'ORIGINALITÉ

Le Créateur garantit que les Contenus sont originaux et qu'il détient tous les droits nécessaires à leur création (notamment sur les musiques, polices ou éléments tiers utilisés). Il garantit MOSH et la Marque contre toute action en contrefaçon de la part de tiers.


ARTICLE 10 — CONFIDENTIALITÉ

Les Parties s'engagent à ne pas divulguer les informations sensibles échangées (briefs confidentiels, données de la Marque, montants de rémunération). Cette obligation survit 2 ans après la fin du contrat.


ARTICLE 11 — RÉSILIATION (ART. 404 CO)

Conformément à l'article 404 CO, le mandat peut être résilié en tout temps par chacune des parties. Toutefois :
• Si le Créateur résilie après avoir accepté la mission mais avant livraison, MOSH pourra retenir les montants correspondant au travail non effectué.
• En cas de résiliation en temps inopportun sans motif sérieux, la partie qui résilie indemnisera l'autre pour le dommage causé.


ARTICLE 12 — RELATION AVEC LA MARQUE

Le Créateur reconnaît que MOSH agit en tant qu'intermédiaire entre la Marque et le Créateur. Le Créateur n'a aucun lien contractuel direct avec la Marque et s'interdit de contacter la Marque directement pour des mandats similaires pendant une durée de 12 mois suivant la fin de la mission, sauf accord écrit de MOSH.


ARTICLE 13 — ACCEPTATION ÉLECTRONIQUE (ART. 1 CO)

Les Parties reconnaissent que l'acceptation électronique du présent contrat sur la plateforme MOSH, manifestée par un clic de validation, constitue une acceptation valable et ferme au sens de l'article 1 du Code des obligations suisse. L'horodatage et l'adresse IP enregistrés font foi de la date et de l'intégrité de l'accord.


ARTICLE 14 — DROIT APPLICABLE ET FOR JURIDIQUE

Le présent contrat est régi par le droit suisse. Tout litige découlant du présent contrat sera soumis à la juridiction exclusive des tribunaux compétents de Lausanne, canton de Vaud.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCEPTATION ÉLECTRONIQUE

Pour MOSH (LGMA SA) :
Accepté automatiquement lors de la génération du contrat
Horodatage : ${vars.MOSH_ACCEPTANCE_TIMESTAMP}

Pour le Créateur :
Accepté par : ${vars.CREATOR_FULL_NAME}
Horodatage : ${vars.CREATOR_ACCEPTANCE_TIMESTAMP}
Adresse IP : ${vars.CREATOR_IP_ADDRESS}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contrat généré automatiquement par la plateforme MOSH — LGMA SA
Ce document a une valeur contractuelle conformément au droit suisse.`
}

// Keep legacy function for backward compatibility
export { generateMoshContractText as generateContractText }
