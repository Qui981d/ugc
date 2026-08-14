import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { kdriveConfigured, listFolder } from '@/lib/kdrive/server'

export const runtime = 'nodejs'

/**
 * Folder listing for the picker.
 *
 * Destination paths are long and full of traps — accents, capitals, `VIDEOS`
 * against `VIDÉOS`, one client folder whose name ends in a space. Typed by
 * hand they fail at export time, silently, months later. Clicking through the
 * real drive removes the whole class of mistake.
 *
 * Root is `1`; folders only, since a file is never a destination.
 */
export async function GET(request: Request) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Réservé aux administrateurs MOSH.' }, { status: 403 })
    }
    if (!kdriveConfigured()) {
        return NextResponse.json(
            { error: 'kDrive non configuré sur le serveur (jeton ou identifiant de drive manquant).' },
            { status: 400 }
        )
    }

    const dir = new URL(request.url).searchParams.get('dir') || '1'

    try {
        const entries = (await listFolder(dir)).filter(e => e.type === 'dir')
        return NextResponse.json({
            directoryId: dir,
            folders: entries.map(e => ({ id: e.id, name: e.name, path: e.path })),
        })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Erreur kDrive' }, { status: 502 })
    }
}
