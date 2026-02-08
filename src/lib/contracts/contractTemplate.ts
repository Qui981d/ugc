// ================================================
// UGC SUISSE - Contract Template (CO art. 394 ss)
// Legal framework: Swiss Code of Obligations
// ================================================

export interface ContractVariables {
    CONTRACT_ID: string
    CONTRACT_DATE: string

    // Brand
    BRAND_COMPANY_NAME: string
    BRAND_CONTACT_NAME: string
    BRAND_ADDRESS: string
    BRAND_EMAIL: string

    // Creator
    CREATOR_FULL_NAME: string
    CREATOR_ADDRESS: string
    CREATOR_EMAIL: string

    // Campaign
    CAMPAIGN_TITLE: string
    CAMPAIGN_DESCRIPTION: string
    DELIVERABLES: string
    DEADLINE: string
    REVISION_COUNT: string

    // Payment
    AMOUNT_CHF: string
    PAYMENT_TERMS: string

    // Signatures
    BRAND_ACCEPTANCE_TIMESTAMP: string
    BRAND_IP_ADDRESS: string
    CREATOR_ACCEPTANCE_TIMESTAMP: string
    CREATOR_IP_ADDRESS: string
}

export function generateContractText(vars: ContractVariables): string {
    return `CONTRAT DE MANDAT POUR CRÉATION DE CONTENU NUMÉRIQUE (UGC)
Conforme au Code des Obligations suisse (art. 394 ss CO)

ID DU CONTRAT : ${vars.CONTRACT_ID}
DATE DE GÉNÉRATION : ${vars.CONTRACT_DATE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLE 1 — DÉSIGNATION DES PARTIES

Le présent contrat est conclu entre :

La Marque :
${vars.BRAND_COMPANY_NAME}
Siège : ${vars.BRAND_ADDRESS}
Représentée par : ${vars.BRAND_CONTACT_NAME}
Email : ${vars.BRAND_EMAIL}
Ci-après la « Marque »

Le Créateur :
${vars.CREATOR_FULL_NAME}
Domicile : ${vars.CREATOR_ADDRESS}
Email : ${vars.CREATOR_EMAIL}
Ci-après le « Créateur »

La plateforme UGC Suisse intervient en tant qu'intermédiaire technique facilitant la conclusion du contrat mais n'est en aucun cas partie au présent mandat.


ARTICLE 2 — OBJET DU MANDAT

La Marque confie au Créateur, qui l'accepte, le mandat de créer et livrer des contenus numériques originaux (ci-après les « Contenus ») dans le cadre de la campagne « ${vars.CAMPAIGN_TITLE} ». La nature de la prestation relève du mandat au sens des articles 394 ss du Code des obligations suisse. Le Créateur s'engage à exécuter sa mission avec toute la diligence requise et conformément au brief créatif fourni par la Marque.


ARTICLE 3 — MISSIONS ET LIVRABLES

3.1. Description de la mission
Le Créateur s'engage à réaliser les prestations décrites dans le brief suivant :
${vars.CAMPAIGN_DESCRIPTION}

3.2. Liste des livrables
Le Créateur doit fournir les éléments suivants :
${vars.DELIVERABLES}

3.3. Délais
L'intégralité des Contenus doit être soumise à la Marque pour validation via la plateforme au plus tard le ${vars.DEADLINE}. Le respect de ce délai est une condition essentielle du mandat.


ARTICLE 4 — OBLIGATIONS DES PARTIES

4.1. Obligations du Créateur
• Qualité : Le Créateur garantit une qualité de production conforme aux standards professionnels (résolution, éclairage, clarté sonore).
• Indépendance : Le Créateur exécute son mandat de manière autonome. Il est seul responsable de ses assurances sociales et de ses obligations fiscales en tant qu'indépendant en Suisse.
• Exclusivité : Sauf mention contraire, le Créateur s'interdit de produire du contenu similaire pour une marque concurrente directe pendant la durée de la campagne.

4.2. Obligations de la Marque
• Coopération : La Marque s'engage à fournir tous les éléments nécessaires (produits, logos, accès) en temps utile.
• Feedback : La Marque doit examiner les livrables promptement et formuler ses demandes de révision via la plateforme.


ARTICLE 5 — RÉMUNÉRATION ET PAIEMENT

5.1. Honoraires
En contrepartie de ses services et de la cession des droits, le Créateur percevra une rémunération de ${vars.AMOUNT_CHF} CHF. Ce montant est ferme et définitif, incluant tous les frais engagés par le Créateur.

5.2. Modalités
Le paiement sera effectué selon les modalités suivantes :
${vars.PAYMENT_TERMS}


ARTICLE 6 — RÉVISIONS ET VALIDATION

Le Créateur inclut un nombre de ${vars.REVISION_COUNT} révisions dans son tarif initial. Toute demande de révision supplémentaire devra faire l'objet d'un accord financier séparé. La validation est réputée acquise si la Marque n'émet aucune réserve dans les 7 jours suivant la livraison.


ARTICLE 7 — CESSION DES DROITS DE PROPRIÉTÉ INTELLECTUELLE

Le Créateur cède à la Marque l'intégralité des droits patrimoniaux sur les Contenus créés.

• Étendue : Droit de reproduction, de représentation, de modification et d'adaptation.
• Supports : Réseaux sociaux (TikTok, Instagram, Facebook, etc.), sites web de la Marque, et utilisation publicitaire payante (Ads).
• Exclusivité : La présente cession est non-exclusive, sauf mention contraire écrite.
• Durée : La cession est consentie pour une durée illimitée (sous réserve de la durée légale de protection du droit d'auteur en Suisse).
• Territoire : La cession est valable pour le monde entier.


ARTICLE 8 — DROIT À L'IMAGE (ART. 28 CC)

Le Créateur autorise expressément la Marque à fixer, reproduire et diffuser son image et sa voix intégrées dans les Contenus livrés, conformément à l'article 28 du Code civil suisse. Cette autorisation est accordée pour les mêmes supports, durées et territoires que ceux définis à l'article 7.


ARTICLE 9 — GARANTIE D'ORIGINALITÉ

Le Créateur garantit que les Contenus sont originaux et qu'il détient tous les droits nécessaires à leur création (notamment sur les musiques ou éléments tiers utilisés). Il garantit la Marque contre toute action en contrefaçon de la part de tiers.


ARTICLE 10 — CONFIDENTIALITÉ

Les Parties s'engagent à ne pas divulguer les informations sensibles échangées (briefs confidentiels, données de vente, prix). Cette obligation survit 2 ans après la fin du contrat.


ARTICLE 11 — RÉSILIATION (ART. 404 CO)

Conformément à l'article 404 CO, le mandat peut être résilié en tout temps par chacune des parties. Toutefois, une résiliation en temps inopportun (sans motif sérieux et causant un préjudice) oblige la partie qui résilie à indemniser l'autre pour le dommage causé (frais déjà engagés, temps de préparation).


ARTICLE 12 — LIMITATION DE RESPONSABILITÉ DE LA PLATEFORME

UGC Suisse n'étant qu'un intermédiaire technique, elle ne saurait être tenue responsable de l'inexécution du mandat, de la qualité des livrables ou du défaut de paiement. La responsabilité de la plateforme est limitée aux dommages directs causés par une défaillance technique majeure de son interface.


ARTICLE 13 — ACCEPTATION ÉLECTRONIQUE (ART. 1 CO)

Les Parties reconnaissent que l'acceptation électronique du présent contrat sur la plateforme UGC Suisse, manifestée par un clic de validation, constitue une acceptation valable et ferme au sens de l'article 1 du Code des obligations suisse. L'horodatage et l'adresse IP enregistrés font foi de la date et de l'intégrité de l'accord. La signature manuscrite n'est pas requise pour la validité du présent mandat.


ARTICLE 14 — DROIT APPLICABLE ET FOR JURIDIQUE

Le présent contrat est régi par le droit suisse. Tout litige découlant du présent contrat sera soumis à la juridiction exclusive des tribunaux compétents de Lausanne.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCEPTATION ÉLECTRONIQUE

Pour la Marque :
Accepté par : ${vars.BRAND_CONTACT_NAME}
Horodatage : ${vars.BRAND_ACCEPTANCE_TIMESTAMP}
Adresse IP : ${vars.BRAND_IP_ADDRESS}

Pour le Créateur :
Accepté par : ${vars.CREATOR_FULL_NAME}
Horodatage : ${vars.CREATOR_ACCEPTANCE_TIMESTAMP}
Adresse IP : ${vars.CREATOR_IP_ADDRESS}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contrat généré automatiquement par la plateforme UGC Suisse
Ce document a une valeur contractuelle conformément au droit suisse.`
}
