import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { emailConfigured, isDeliverable, sendNotificationEmail } from '@/lib/email/server'

export const runtime = 'nodejs'

/**
 * Diagnostic: send a test mail to the calling admin and report what actually
 * happened.
 *
 * Notification mail is deliberately silent — it must never block an in-app
 * notification — which makes a misconfiguration invisible. This endpoint is the
 * loud counterpart. It never returns the SMTP password.
 */
export async function POST() {
    const adminId = await requireAdmin()
    if (!adminId) {
        return NextResponse.json({ error: 'Réservé aux administrateurs MOSH.' }, { status: 403 })
    }

    const config = {
        host: process.env.SMTP_HOST || 'mail.infomaniak.com (défaut)',
        port: Number(process.env.SMTP_PORT || 465),
        user: process.env.SMTP_USER || null,
        from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
        passwordSet: !!process.env.SMTP_PASSWORD,
        serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    if (!emailConfigured()) {
        return NextResponse.json({
            ok: false,
            reason: 'SMTP_USER ou SMTP_PASSWORD manquant sur le serveur.',
            config,
        })
    }

    const supabase = await createClient()
    const { data } = await supabase.from('users').select('email').eq('id', adminId).single()
    const to = (data as { email?: string } | null)?.email

    if (!isDeliverable(to)) {
        return NextResponse.json({
            ok: false,
            reason: `L'adresse de votre compte (${to || 'aucune'}) n'est pas une adresse réelle.`,
            config,
        })
    }

    try {
        await sendNotificationEmail({
            to: to!,
            title: 'Test d’envoi — MOSH',
            message: "Si vous lisez ceci, l'envoi d'emails fonctionne. Les notifications de la plateforme partiront de la même façon.",
        })
        return NextResponse.json({ ok: true, to, config })
    } catch (e: any) {
        return NextResponse.json({
            ok: false,
            reason: e?.message || 'Échec SMTP',
            to,
            config,
        })
    }
}
