import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
    kdriveConfigured,
    uploadFile,
    buildExportPath,
    buildExportFileName,
    KDRIVE_MAX_BYTES,
} from '@/lib/kdrive/server'

// The file makes the trip twice — down from Supabase, up to kDrive — so the
// default ceiling would cut a perfectly normal video off mid-upload.
export const maxDuration = 300
export const runtime = 'nodejs'

/**
 * Copy a delivered video into the client's kDrive folder.
 *
 * Fired automatically at final client validation and, when that fails for a
 * reason only a human can fix (folder not created, token expired, video too
 * heavy), re-run by hand from the mission page.
 *
 * Every outcome is written back to the row: success as a date + path, failure
 * as a readable message. An export nobody can see the state of is one nobody
 * can retry.
 */
export async function POST(request: Request) {
    // Service-role work: prove the caller is an admin from their session.
    if (!(await requireAdmin())) {
        return NextResponse.json(
            { success: false, error: 'Réservé aux administrateurs MOSH.' },
            { status: 403 }
        )
    }

    if (!kdriveConfigured()) {
        return NextResponse.json(
            {
                success: false,
                error: "Export kDrive non configuré : KDRIVE_API_TOKEN et KDRIVE_DRIVE_ID doivent être définis sur le serveur.",
            },
            { status: 400 }
        )
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        return NextResponse.json(
            { success: false, error: 'Export kDrive non configuré (SUPABASE_SERVICE_ROLE_KEY manquant sur le serveur).' },
            { status: 400 }
        )
    }

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ success: false, error: 'Requête invalide' }, { status: 400 })
    }

    const campaignId: string = (body?.campaignId || '').trim()
    const contentId: string | null = body?.contentId || null
    /** Re-export a file already exported. kDrive renames on conflict, so nothing is overwritten. */
    const force: boolean = body?.force === true
    if (!campaignId) {
        return NextResponse.json({ success: false, error: 'campaignId requis' }, { status: 400 })
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

    const { data: campData } = await admin
        .from('campaigns')
        .select('id, title, brand_id, video_url, kdrive_exported_at')
        .eq('id', campaignId)
        .single()
    const campaign = campData as any
    if (!campaign) {
        return NextResponse.json({ success: false, error: 'Mission introuvable' }, { status: 404 })
    }

    // The row that carries both the video and its export state.
    const table: 'campaigns' | 'campaign_contents' = contentId ? 'campaign_contents' : 'campaigns'
    let rowId: string = campaignId
    let videoUrl: string | null = campaign.video_url
    let exportedAt: string | null = campaign.kdrive_exported_at
    let suffix: string | undefined

    if (contentId) {
        const { data: contentData } = await admin
            .from('campaign_contents')
            .select('id, campaign_id, position, video_url, kdrive_exported_at')
            .eq('id', contentId)
            .single()
        const content = contentData as any
        if (!content || content.campaign_id !== campaignId) {
            return NextResponse.json(
                { success: false, error: 'Contenu introuvable pour cette mission' },
                { status: 404 }
            )
        }
        rowId = content.id
        videoUrl = content.video_url
        exportedAt = content.kdrive_exported_at
        // Positions are stored 0-based; the file name is read by humans.
        suffix = `Vidéo ${(content.position ?? 0) + 1}`
    }

    const { data: profileData } = await admin
        .from('profiles_brand')
        .select('company_name, kdrive_folder_path')
        .eq('user_id', campaign.brand_id)
        .single()
    const profile = profileData as { company_name?: string; kdrive_folder_path?: string | null } | null
    const clientFolder = (profile?.kdrive_folder_path || '').trim()

    if (!videoUrl) {
        return NextResponse.json(
            { success: false, error: "Aucune vidéo à exporter : la mission n'a pas de fichier livré." },
            { status: 400 }
        )
    }

    if (!clientFolder) {
        return NextResponse.json(
            {
                success: false,
                error: `Aucun dossier kDrive configuré pour ${profile?.company_name || 'cette marque'}. Renseignez-le sur la fiche de la marque.`,
            },
            { status: 400 }
        )
    }

    if (exportedAt && !force) {
        return NextResponse.json(
            {
                success: false,
                error: `Déjà exporté le ${new Date(exportedAt).toLocaleDateString('fr-CH')}. Utilisez « Ré-exporter » pour en envoyer une nouvelle copie.`,
            },
            { status: 409 }
        )
    }

    const missionTitle: string = campaign.title || 'Mission'
    const directoryPath = buildExportPath(clientFolder, missionTitle)
    const fileName = buildExportFileName(missionTitle, videoUrl, suffix)

    try {
        const res = await fetch(videoUrl, { cache: 'no-store' })
        if (!res.ok) {
            throw new Error(`Vidéo illisible à l'adresse enregistrée (HTTP ${res.status}).`)
        }

        // Refuse on the declared size before spending minutes downloading a file
        // kDrive would refuse anyway.
        const declared = Number(res.headers.get('content-length') || 0)
        if (declared > KDRIVE_MAX_BYTES) {
            throw new Error(
                `Vidéo trop volumineuse pour l'export automatique (${Math.round(declared / 1024 / 1024)} Mo, maximum ${Math.round(KDRIVE_MAX_BYTES / 1024 / 1024)} Mo).`
            )
        }

        const bytes = await res.arrayBuffer()
        if (bytes.byteLength === 0) throw new Error('Le fichier téléchargé est vide.')

        const uploaded = await uploadFile({ directoryPath, fileName, body: bytes })
        // kDrive renames on conflict, so this is the path we asked for — the
        // stored copy may carry a "(1)" suffix. Good enough to find the folder.
        const filePath = `${uploaded.directoryPath}/${uploaded.fileName}`

        const { error: upErr } = await (admin.from(table) as any)
            .update({
                kdrive_exported_at: new Date().toISOString(),
                kdrive_file_path: filePath,
                // A later success clears the previous failure.
                kdrive_export_error: null,
            })
            .eq('id', rowId)

        if (upErr) {
            // The file did reach kDrive but the state could not be recorded.
            // Saying "success" flatly here would produce a mission that exports
            // itself again at every retry.
            console.error('[kDrive] export saved to drive but state not stored:', upErr.message)
            return NextResponse.json({
                success: true,
                filePath,
                error: `Fichier exporté, mais l'état n'a pas pu être enregistré : ${upErr.message}`,
            })
        }

        return NextResponse.json({ success: true, filePath })
    } catch (e: any) {
        const message = e?.message || 'Échec de l\'export kDrive'
        console.error('[kDrive] export error:', message)
        await (admin.from(table) as any)
            .update({ kdrive_export_error: message })
            .eq('id', rowId)
        return NextResponse.json({ success: false, error: message }, { status: 502 })
    }
}
