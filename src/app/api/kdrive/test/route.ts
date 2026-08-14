import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { kdriveConfigured, probeDrive, listFolder } from '@/lib/kdrive/server'

export const runtime = 'nodejs'

/**
 * Diagnostic: ask kDrive whether the token works, and report its actual reply.
 *
 * Several parameters of the upload call are inferred from an open-source client
 * rather than from official documentation, so the only honest way to debug this
 * integration is to show what kDrive answers. Never returns the token.
 *
 * `?dir=<id>` lists that folder instead, so the export paths can be read off
 * the real tree rather than guessed from memory.
 */
export async function GET(request: Request) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Réservé aux administrateurs MOSH.' }, { status: 403 })
    }

    const config = {
        driveId: process.env.KDRIVE_DRIVE_ID || null,
        tokenSet: !!process.env.KDRIVE_API_TOKEN,
    }

    if (!kdriveConfigured()) {
        return NextResponse.json({
            ok: false,
            reason: 'KDRIVE_API_TOKEN ou KDRIVE_DRIVE_ID manquant sur le serveur.',
            config,
        })
    }

    const dir = new URL(request.url).searchParams.get('dir')
    if (dir) {
        try {
            const entries = await listFolder(dir)
            return NextResponse.json({
                ok: true,
                directoryId: dir,
                count: entries.length,
                entries,
                config,
            })
        } catch (e: any) {
            return NextResponse.json({ ok: false, directoryId: dir, reason: e?.message, config })
        }
    }

    try {
        const probe = await probeDrive()
        return NextResponse.json({
            ok: probe.ok,
            status: probe.status,
            // kDrive's raw answer, truncated by probeDrive — this is the point
            // of the route.
            body: probe.body,
            config,
        })
    } catch (e: any) {
        return NextResponse.json({
            ok: false,
            reason: e?.message || 'Échec de la connexion à kDrive',
            config,
        })
    }
}
