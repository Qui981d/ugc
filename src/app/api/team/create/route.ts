import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const runtime = 'nodejs'

/**
 * Add a MOSH teammate (role = admin).
 *
 * Creating an admin grants full access to every brand and creator, so the route
 * is gated on the caller already being one.
 */
export async function POST(request: Request) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Réservé aux administrateurs MOSH.' }, { status: 403 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        return NextResponse.json(
            { error: "Création de compte non configurée (SUPABASE_SERVICE_ROLE_KEY manquant)." },
            { status: 400 }
        )
    }

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    const fullName: string = (body.fullName || '').trim()
    const email: string = (body.email || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

    // A random password nobody keeps: the teammate sets their own via the
    // password-reset flow, so no secret is ever shown or transported.
    const password = randomBytes(24).toString('base64url')

    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: fullName || email },
    })

    if (error || !data.user) {
        const msg = error?.message || 'Création du compte échouée'
        const status = /already been registered|already exists/i.test(msg) ? 409 : 502
        return NextResponse.json(
            { error: status === 409 ? 'Un compte existe déjà avec cette adresse.' : msg },
            { status }
        )
    }

    // The handle_new_user trigger reads role from metadata, but it defaults to
    // 'creator' on older projects — force it so the teammate really is an admin.
    await admin
        .from('users')
        .update({ role: 'admin', full_name: fullName || email })
        .eq('id', data.user.id)

    return NextResponse.json({ userId: data.user.id })
}
