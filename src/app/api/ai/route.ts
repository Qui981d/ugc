import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@supabase/ssr'
import { rateLimit } from '@/lib/rateLimit'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// ── Auth helper ─────────────────────────────────────────────
async function getAuthUser(request: NextRequest) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll() { /* read-only for API routes */ },
            },
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

// ── System prompts ──────────────────────────────────────────
const BRIEF_REVIEW_SYSTEM = `Tu es un expert en marketing UGC (User Generated Content) travaillant pour MOSH, une agence UGC premium basée en Suisse.

Ton rôle : analyser et reformuler le brief reçu d'une marque pour le rendre plus clair, structuré et actionnable pour l'équipe créative.

Règles :
- Reformule le brief de manière professionnelle et structurée
- Identifie les points forts et les éventuelles zones floues
- Propose des questions pertinentes si des informations manquent
- Suggère des angles créatifs possibles
- Reste concis et actionnable
- Écris en français
- Utilise des émojis avec parcimonie pour la lisibilité

Format de sortie :
📋 **Résumé du brief**
[reformulation claire et concise]

🎯 **Objectif identifié**
[ce que la marque cherche à accomplir]

💡 **Angles créatifs suggérés**
[2-3 suggestions d'approche]

⚠️ **Points à clarifier** (si applicable)
[questions ou éléments manquants]`

const SCRIPT_GENERATION_SYSTEM = `Tu es rédacteur de briefs chez MOSH, agence UGC suisse.

On te donne LA TRAME MOSH, déjà partiellement remplie avec ce que l'agence connaît.
Ta tâche : la compléter. Pas en écrire une autre.

RÈGLES ABSOLUES
1. Conserve la trame à l'identique : mêmes sections, mêmes titres, même ordre,
   mêmes séparateurs. N'ajoute ni ne supprime aucune section.
2. Ne touche pas aux valeurs déjà renseignées (client, dates, format, contexte).
3. Remplace les « … » par du contenu UNIQUEMENT si le brief permet de le déduire.
4. Si le brief ne dit rien, LAISSE « … ». C'est la règle la plus importante :
   un blanc se complète en dix secondes, une consigne inventée part chez un
   créateur et fait tourner une vidéo pour rien. N'invente jamais un public
   cible, un message clé, une police de sous-titres ou une durée.
5. Écris en français, ton direct, pas de remplissage marketing.
6. Réponds avec la trame complétée et rien d'autre : ni préambule, ni
   commentaire, ni bloc de code.`

// ── Route handler ───────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        // Auth check — only authenticated users can call AI
        const user = await getAuthUser(request)
        if (!user) {
            return NextResponse.json(
                { error: 'Non autorisé. Veuillez vous connecter.' },
                { status: 401 }
            )
        }

        // Rate limit — 10 requests per minute per user
        const { success: withinLimit } = rateLimit(user.id, 10, 60 * 1000)
        if (!withinLimit) {
            return NextResponse.json(
                { error: 'Trop de requêtes. Veuillez patienter une minute.' },
                { status: 429 }
            )
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'Clé API OpenAI non configurée. Ajoutez OPENAI_API_KEY dans vos variables d\'environnement.' },
                { status: 500 }
            )
        }

        const body = await request.json()
        const { action, briefData } = body

        if (!action || !briefData) {
            return NextResponse.json(
                { error: 'Paramètres manquants' },
                { status: 400 }
            )
        }

        let systemPrompt: string
        let userPrompt: string

        if (action === 'review_brief') {
            systemPrompt = BRIEF_REVIEW_SYSTEM
            userPrompt = `Analyse et reformule ce brief :

Titre de la campagne : ${briefData.title}
Produit : ${briefData.product_name}
Description du produit : ${briefData.product_description || 'Non renseignée'}
Description de la campagne : ${briefData.description || 'Non renseignée'}
Format vidéo : ${briefData.format}
Type de script : ${briefData.script_type}
Notes de script : ${briefData.script_notes || 'Aucune'}
Droits d'usage : ${briefData.rights_usage}
Budget : ${briefData.budget_chf} CHF`

        } else if (action === 'generate_script') {
            systemPrompt = SCRIPT_GENERATION_SYSTEM
            userPrompt = `Voici la trame MOSH à compléter :

${briefData.template || '(trame absente)'}

--- BRIEF DE LA MARQUE (seule source autorisée) ---
Titre : ${briefData.title}
Produit : ${briefData.product_name}
Description du produit : ${briefData.product_description || 'Non renseignée'}
Description de la campagne : ${briefData.description || 'Non renseignée'}
Format vidéo : ${briefData.format}
Type de script : ${briefData.script_type}
Notes de script : ${briefData.script_notes || 'Aucune'}
Droits d'usage : ${briefData.rights_usage}
${briefData.content_briefs ? `Descriptions détaillées par contenu :
${briefData.content_briefs}` : ''}
${briefData.script_brand_feedback ? `
Retour de la marque sur un précédent script : ${briefData.script_brand_feedback}` : ''}

Rappel : tout ce que ce brief ne dit pas reste « … ».`

        } else {
            return NextResponse.json(
                { error: 'Action inconnue' },
                { status: 400 }
            )
        }

        // Filling a fixed structure is not a creative task: keep the temperature
        // low so the model reproduces the trame rather than reinterpreting it,
        // and leave room for the completed brief, which is long by design.
        const isTemplateFill = action === 'generate_script'

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: isTemplateFill ? 0.3 : 0.7,
            max_tokens: isTemplateFill ? 4000 : 2000,
        })

        const result = completion.choices[0]?.message?.content || 'Aucun résultat généré.'

        return NextResponse.json({ result })

    } catch (error: unknown) {
        console.error('[AI Route] Error:', error)
        const message = error instanceof Error ? error.message : 'Erreur interne'
        return NextResponse.json(
            { error: `Erreur IA : ${message}` },
            { status: 500 }
        )
    }
}
