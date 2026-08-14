// NOTE: server-only module — imported exclusively by /api/kdrive route handlers.
// Reads KDRIVE_API_TOKEN from the server environment; never import from a client component.

// ============================================================
// Infomaniak kDrive REST API (server-only — uses the secret token)
// ============================================================
//
// Endpoint shapes taken from a working open-source client rather than from
// Infomaniak's documentation portal, which is a JavaScript app that cannot be
// read programmatically:
//   https://github.com/anthonychaussin/kDriveClientPY
//
// Only the direct upload is implemented. That same client forces its chunked
// session flow above 1 GB; UGC videos sit far below it, so a single request is
// enough and the chunk/hash protocol — whose parameters we could not verify —
// stays unwritten rather than guessed at.

const BASE = 'https://api.infomaniak.com'

/**
 * Refuse rather than time out. Vercel allows 300s and 2 GB, and the file makes
 * the trip twice (down from Supabase, up to kDrive), so a very large video
 * would fail late and confusingly instead of failing immediately and clearly.
 */
export const KDRIVE_MAX_BYTES = 600 * 1024 * 1024

export function kdriveConfigured(): boolean {
    return !!process.env.KDRIVE_API_TOKEN && !!process.env.KDRIVE_DRIVE_ID
}

function requireConfig(): { token: string; driveId: string } {
    const token = process.env.KDRIVE_API_TOKEN
    const driveId = process.env.KDRIVE_DRIVE_ID
    if (!token) throw new Error('KDRIVE_API_TOKEN manquant (variable d\'environnement)')
    if (!driveId) throw new Error('KDRIVE_DRIVE_ID manquant (variable d\'environnement)')
    return { token, driveId }
}

export interface KDriveUploadResult {
    fileId: string | null
    fileName: string
    directoryPath: string
    /** kDrive's raw reply, kept so a surprise is diagnosable rather than silent. */
    raw: unknown
}

/**
 * Upload bytes to a folder path, creating the path if kDrive accepts it.
 *
 * `conflict: 'rename'` rather than overwrite: a re-export should never quietly
 * replace a file the client may already have shared or linked.
 */
export async function uploadFile(params: {
    directoryPath: string
    fileName: string
    body: ArrayBuffer
}): Promise<KDriveUploadResult> {
    const { token, driveId } = requireConfig()
    const { directoryPath, fileName, body } = params

    if (body.byteLength > KDRIVE_MAX_BYTES) {
        throw new Error(
            `Fichier trop volumineux pour l'export automatique (${Math.round(body.byteLength / 1024 / 1024)} Mo, maximum ${Math.round(KDRIVE_MAX_BYTES / 1024 / 1024)} Mo).`
        )
    }

    const query = new URLSearchParams({
        directory_path: directoryPath,
        file_name: fileName,
        total_size: String(body.byteLength),
        conflict: 'rename',
        // Ask kDrive to build the per-client / per-mission folders itself.
        create_directory: '1',
    })

    const res = await fetch(`${BASE}/3/drive/${driveId}/upload?${query}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
        },
        body,
    })

    const text = await res.text()
    if (!res.ok) throw new Error(`kDrive ${res.status}: ${text}`)

    let parsed: any = null
    try { parsed = JSON.parse(text) } catch { /* kDrive answered something unexpected */ }

    return {
        fileId: parsed?.data?.id ? String(parsed.data.id) : null,
        fileName,
        directoryPath,
        raw: parsed ?? text,
    }
}

/**
 * Does the token work, and can the drive be read?
 *
 * The SMTP setup in this project was only ever fixed once a route reported the
 * server's actual reply, so kDrive gets the same treatment.
 */
export async function probeDrive(): Promise<{ ok: boolean; status: number; body: string }> {
    const { token, driveId } = requireConfig()
    const res = await fetch(`${BASE}/2/drive/${driveId}/files?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    })
    return { ok: res.ok, status: res.status, body: (await res.text()).slice(0, 2000) }
}

export interface KDriveEntry {
    id: string
    name: string
    type: string
    path: string | null
}

/**
 * Children of a folder.
 *
 * Used to read the real tree instead of assuming it: folder names carry
 * accents and abbreviations nobody remembers exactly, and a path that is one
 * character off fails at export time rather than at configuration time.
 */
export async function listFolder(directoryId: string): Promise<KDriveEntry[]> {
    const { token, driveId } = requireConfig()
    const res = await fetch(
        `${BASE}/2/drive/${driveId}/files/${directoryId}/files?limit=200&with=path`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    const text = await res.text()
    if (!res.ok) throw new Error(`kDrive ${res.status}: ${text}`)
    const parsed = JSON.parse(text)
    return (parsed?.data || []).map((f: any) => ({
        id: String(f.id),
        name: f.name,
        type: f.type,
        path: f.path ?? null,
    }))
}

/** Filesystem-safe, readable, and sortable by client then mission. */
export function buildExportPath(clientFolder: string, missionTitle: string): string {
    const clean = (s: string) =>
        s.replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim() || 'Sans titre'
    const base = clientFolder.trim().replace(/\/+$/, '')
    return `${base.startsWith('/') ? base : `/${base}`}/${clean(missionTitle)}`
}

export function buildExportFileName(missionTitle: string, sourceUrl: string, suffix?: string): string {
    const clean = (s: string) =>
        s.replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim()
    const ext = (sourceUrl.split('?')[0].split('.').pop() || 'mp4').toLowerCase().slice(0, 5)
    const date = new Date().toISOString().slice(0, 10)
    return `${clean(missionTitle) || 'video'}${suffix ? ` — ${clean(suffix)}` : ''} — ${date}.${ext}`
}
