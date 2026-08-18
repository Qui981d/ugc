import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { updateTaskDescription, clickupConfigured } from '@/lib/clickup/server'

export const runtime = 'nodejs'

/**
 * Rewrite a mission card and its subtasks from the descriptions the caller
 * built. Called on every material change, so the card never lags the platform.
 */
export async function POST(request: Request) {
    if (!(await requireUser())) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }
    if (!clickupConfigured()) {
        return NextResponse.json({ ok: false, skipped: true })
    }
    try {
        const { taskId, subtaskMap, description, subtaskDescriptions } = await request.json()
        if (!taskId) return NextResponse.json({ error: 'taskId requis' }, { status: 400 })

        if (typeof description === 'string' && description) {
            await updateTaskDescription(taskId, description)
        }

        const map = (subtaskMap || {}) as Record<string, string>
        const bodies = (subtaskDescriptions || {}) as Record<string, string>
        let subtasksUpdated = 0
        for (const [name, body] of Object.entries(bodies)) {
            const subtaskId = map[name]
            // Cards created before a subtask existed simply carry no id for it —
            // that is a gap to skip, not a reason to fail the whole sync.
            if (!subtaskId || typeof body !== 'string' || !body) continue
            await updateTaskDescription(subtaskId, body)
            subtasksUpdated++
        }

        return NextResponse.json({ ok: true, subtasksUpdated })
    } catch (e: any) {
        console.error('[ClickUp] sync-mission error:', e?.message)
        return NextResponse.json({ ok: false, error: e?.message || 'Erreur ClickUp' }, { status: 502 })
    }
}
