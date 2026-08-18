import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createClient } from '@supabase/supabase-js'
import { emailConfigured, isDeliverable, sendNotificationEmail } from '@/lib/email/server'

export const runtime = 'nodejs'

/**
 * Mirrors an in-app notification to email.
 *
 * Called best-effort right after a notification row is created. It resolves the
 * recipient's address server-side rather than trusting the caller, so the
 * browser can never aim a mail at an arbitrary address.
 */
export async function POST(request: Request) {
    if (!(await requireUser())) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }
    if (!emailConfigured()) {
        return NextResponse.json({ sent: false, skipped: 'smtp-not-configured' })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        return NextResponse.json({ sent: false, skipped: 'service-key-missing' })
    }

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    const { userId, title, message, referenceId, referenceType } = body
    if (!userId || !title) {
        return NextResponse.json({ error: 'userId et title requis' }, { status: 400 })
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: user } = await admin
        .from('users')
        .select('email, role')
        .eq('id', userId)
        .single()

    const recipient = (user as any)?.email as string | undefined
    const role = (user as any)?.role as string | undefined

    // Managed-brand placeholders and malformed addresses are silently skipped —
    // an unreachable recipient is a normal state here, not an error.
    if (!isDeliverable(recipient)) {
        return NextResponse.json({ sent: false, skipped: 'no-deliverable-address' })
    }

    const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
        new URL(request.url).origin

    // Same destination the in-app bell would open, resolved per role.
    const home = role === 'admin' ? '/mosh-cockpit' : role === 'brand' ? '/brand' : '/creator'
    let path = home
    if (referenceType === 'campaign' && referenceId) {
        path =
            role === 'admin' ? `/mosh-cockpit/missions/${referenceId}`
                : role === 'brand' ? `/brand/campaigns/${referenceId}`
                    : `/creator/missions/${referenceId}`
    }

    try {
        await sendNotificationEmail({
            to: recipient!,
            title,
            message,
            actionUrl: `${origin}${path}`,
        })
        return NextResponse.json({ sent: true })
    } catch (e: any) {
        console.error('[Email] send failed:', e?.message)
        return NextResponse.json({ sent: false, error: e?.message }, { status: 502 })
    }
}
