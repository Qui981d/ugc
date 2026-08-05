import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { emailConfigured, isDeliverable, sendNotificationEmail } from '@/lib/email/server'

export const runtime = 'nodejs'

/**
 * Send a teammate their access link.
 *
 * Supabase's own recovery mail is sent from noreply@mail.app.supabase.io, in
 * English, branded Supabase, and worded as a *reset* — wrong on every count for
 * someone setting a password for the first time. So we mint the link with the
 * admin API and deliver it ourselves, through the same SMTP as every other MOSH
 * mail.
 */
export async function POST(request: Request) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Réservé aux administrateurs MOSH.' }, { status: 403 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquant sur le serveur.' }, { status: 400 })
    }
    if (!emailConfigured()) {
        return NextResponse.json({ error: 'SMTP non configuré : impossible d’envoyer l’accès.' }, { status: 400 })
    }

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    const email: string = (body.email || '').trim().toLowerCase()
    const isNew: boolean = !!body.isNew
    if (!isDeliverable(email)) {
        return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

    const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
        new URL(request.url).origin

    const { data, error } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${origin}/login` },
    })

    const actionLink = (data as any)?.properties?.action_link
    if (error || !actionLink) {
        return NextResponse.json({ error: error?.message || 'Génération du lien échouée' }, { status: 502 })
    }

    try {
        await sendNotificationEmail({
            to: email,
            title: isNew ? 'Votre accès à MOSH' : 'Réinitialiser votre mot de passe MOSH',
            message: isNew
                ? "Un compte vous a été créé sur la plateforme MOSH. Cliquez ci-dessous pour définir votre mot de passe et vous connecter."
                : "Cliquez ci-dessous pour choisir un nouveau mot de passe.",
            actionUrl: actionLink,
            actionLabel: isNew ? 'Définir mon mot de passe' : 'Choisir un nouveau mot de passe',
        })
        return NextResponse.json({ sent: true })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Échec SMTP' }, { status: 502 })
    }
}
