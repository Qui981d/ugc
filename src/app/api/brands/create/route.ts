import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const runtime = 'nodejs'

// Creates a real, MOSH-controlled brand account (agency model).
// Uses the Supabase service_role key so it never touches the admin's session.
export async function POST(request: Request) {
    // Service-role work: prove the caller is an admin from their session.
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Réservé aux administrateurs MOSH.' }, { status: 403 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        return NextResponse.json(
            { error: 'Création de marque non configurée (SUPABASE_SERVICE_ROLE_KEY manquant sur le serveur).' },
            { status: 400 }
        )
    }

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    const companyName: string = (body.companyName || '').trim()
    const contactName: string = (body.contactName || '').trim()
    const contactEmail: string = (body.contactEmail || '').trim()
    const clickupListId: string | null = body.clickupListId || null
    if (!companyName) return NextResponse.json({ error: 'Le nom de la marque est requis' }, { status: 400 })

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

    // A real email if provided, else a stable managed placeholder (no email is ever sent).
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'brand'
    const email = contactEmail || `${slug}-${randomBytes(3).toString('hex')}@managed.mosh.local`
    const password = randomBytes(24).toString('base64url')

    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // no confirmation email is sent
        user_metadata: { role: 'brand', full_name: contactName || companyName },
    })

    if (error || !data.user) {
        const msg = error?.message || 'Création du compte échouée'
        const status = /already been registered|already exists/i.test(msg) ? 409 : 502
        return NextResponse.json({ error: msg }, { status })
    }

    const userId = data.user.id

    // The handle_new_user trigger created users + profiles_brand rows.
    // Enrich the brand profile with the real company name + managed flag.
    const { error: profErr } = await admin
        .from('profiles_brand')
        .update({ company_name: companyName, is_managed: true, clickup_list_id: clickupListId })
        .eq('user_id', userId)
    if (profErr) {
        // Fallback: the trigger may not have run — upsert the profile.
        await admin.from('profiles_brand').upsert(
            { user_id: userId, company_name: companyName, is_managed: true, clickup_list_id: clickupListId },
            { onConflict: 'user_id' }
        )
    }

    return NextResponse.json({ brandId: userId })
}
