import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { emailConfigured, isDeliverable, sendNotificationEmail } from '@/lib/email/server'

export const runtime = 'nodejs'

/**
 * Mail a creator their invitation.
 *
 * The link points at the invitation landing rather than straight at signup: the
 * creator has never heard of the platform, and a bare password form is a poor
 * first contact.
 */
export async function POST(request: Request) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Réservé aux administrateurs MOSH.' }, { status: 403 })
    }
    if (!emailConfigured()) {
        return NextResponse.json({ error: 'SMTP non configuré : impossible d’envoyer l’invitation.' }, { status: 400 })
    }

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    const email: string = (body.email || '').trim().toLowerCase()
    const code: string = (body.code || '').trim().toUpperCase()
    const name: string = (body.name || '').trim()

    if (!isDeliverable(email)) return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    if (!code) return NextResponse.json({ error: 'Code d’invitation manquant' }, { status: 400 })

    const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
        new URL(request.url).origin

    try {
        await sendNotificationEmail({
            to: email,
            title: 'MOSH vous invite à rejoindre sa communauté de créateurs',
            message: `${name ? `Bonjour ${name},\n\n` : ''}MOSH est une agence suisse de contenu UGC. Nous confions à des créateurs les vidéos que tournent nos clients, avec un brief clair, un tarif annoncé à l'avance et un contrat pour chaque mission.\n\nVotre invitation est valable 30 jours.`,
            actionUrl: `${origin}/rejoindre/${code}`,
            actionLabel: 'Découvrir et créer mon compte',
        })
        return NextResponse.json({ sent: true })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Échec SMTP' }, { status: 502 })
    }
}
