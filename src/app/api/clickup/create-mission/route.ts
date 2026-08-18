import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createMissionCard, clickupConfigured } from '@/lib/clickup/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    if (!(await requireUser())) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }
    if (!clickupConfigured()) {
        return NextResponse.json({ error: 'ClickUp non configuré' }, { status: 400 })
    }
    try {
        const { listId, title, description } = await request.json()
        if (!listId || !title) {
            return NextResponse.json({ error: 'listId et title requis' }, { status: 400 })
        }
        const result = await createMissionCard(listId, title, description || '')
        return NextResponse.json(result)
    } catch (e: any) {
        console.error('[ClickUp] create-mission error:', e?.message)
        return NextResponse.json({ error: e?.message || 'Erreur ClickUp' }, { status: 502 })
    }
}
