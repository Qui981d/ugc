import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { completeTask, clickupConfigured } from '@/lib/clickup/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    if (!(await requireUser())) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }
    if (!clickupConfigured()) {
        return NextResponse.json({ ok: false, skipped: true })
    }
    try {
        const { taskId } = await request.json()
        if (!taskId) return NextResponse.json({ error: 'taskId requis' }, { status: 400 })
        await completeTask(taskId)
        return NextResponse.json({ ok: true })
    } catch (e: any) {
        console.error('[ClickUp] complete-subtask error:', e?.message)
        return NextResponse.json({ ok: false, error: e?.message || 'Erreur ClickUp' }, { status: 502 })
    }
}
