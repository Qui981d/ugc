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

const SCRIPT_GENERATION_SYSTEM = `Tu es un scénariste UGC expert travaillant pour MOSH, une agence UGC premium basée en Suisse.

Ton rôle : rédiger un script vidéo UGC professionnel basé sur le brief de la marque.

Règles :
- Le script doit être naturel, authentique et engageant (style UGC, pas pub corporate)
- Adapte le ton au type de script demandé
- Structure le script avec des indications de plan (PLAN 1, PLAN 2, etc.)
- Inclus des instructions pour le créateur (ton, énergie, gestes)
- Ajoute des indications de timing approximatives
- Le script doit être prêt à être envoyé à un créateur
- Écris en français

Format de sortie :
🎬 **SCRIPT UGC — [Titre]**

📱 Format : [format vidéo]
⏱️ Durée estimée : [durée]
🎭 Ton : [description du ton]

---

**PLAN 1 — [Accroche]** (0-3s)
[Action + texte]

**PLAN 2 — [Développement]** (3-15s)
[Action + texte]

**PLAN 3 — [Démonstration]** (15-30s)
[Action + texte]

**PLAN 4 — [Conclusion / CTA]** (30-45s)
[Action + texte]

---
📝 **Notes pour le créateur :**
[conseils de tournage, ambiance, etc.]`

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
            userPrompt = `Rédige un script UGC complet basé sur ce brief :

Titre : ${briefData.title}
Produit : ${briefData.product_name}
Description du produit : ${briefData.product_description || 'Non renseignée'}
Description de la campagne : ${briefData.description || 'Non renseignée'}
Format vidéo : ${briefData.format}
Type de script : ${briefData.script_type}
Notes de script : ${briefData.script_notes || 'Aucune'}
Droits d'usage : ${briefData.rights_usage}
${briefData.script_brand_feedback ? `\nRetour de la marque sur un précédent script : ${briefData.script_brand_feedback}` : ''}`

        } else {
            return NextResponse.json(
                { error: 'Action inconnue' },
                { status: 400 }
            )
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 2000,
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
